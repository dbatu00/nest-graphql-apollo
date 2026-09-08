import {
    ADD_POST_MUTATION,
    ADD_COMMENT_MUTATION,
    CHANGE_MY_EMAIL_MUTATION,
    CHANGE_MY_PASSWORD_MUTATION,
    DELETE_MY_ACCOUNT_MUTATION,
    DELETE_COMMENT_MUTATION,
    DELETE_POST_MUTATION,
    FEED_QUERY,
    FOLLOWERS_QUERY,
    FOLLOWERS_WITH_FOLLOW_STATE_QUERY,
    FOLLOWING_QUERY,
    FOLLOWING_WITH_FOLLOW_STATE_QUERY,
    FOLLOW_USER_MUTATION,
    GET_COMMENT_LIKED_USERS_QUERY,
    GET_LIKED_USERS_QUERY,
    IS_EMAIL_USED_QUERY,
    LIKED_POSTS_QUERY,
    LOGIN_MUTATION,
    GET_ME_QUERY,
    REFRESH_AUTH_MUTATION,
    RESEND_VERIFICATION_EMAIL_MUTATION,
    SIGNUP_MUTATION,
    UNFOLLOW_USER_MUTATION,
    UNLIKE_POST_MUTATION,
    LIKE_POST_MUTATION,
    LIKE_COMMENT_MUTATION,
    UPDATE_MY_PROFILE_MUTATION,
    UNLIKE_COMMENT_MUTATION,
    USER_PROFILE_QUERY,
} from "@/graphql/operations";
import { EmailSendResult } from "@/types/Auth";
import { Activity, ActivityType } from "@/types/Activity";
import { Post } from "@/types/Post";
import { getStoredAppLanguage } from "@/utils/appLanguage";
import { graphqlFetch } from "@/utils/graphqlFetch";
import {
    BIO_MAX_LENGTH,
    COMMENT_CONTENT_MAX_LENGTH,
    DISPLAY_NAME_MAX_LENGTH,
    EMAIL_MAX_LENGTH,
    LOGIN_IDENTIFIER_MAX_LENGTH,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    POST_CONTENT_MAX_LENGTH,
    URL_MAX_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from "@/config/inputLimits";

export type MeData = {
    id: number;
    username: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    coverUrl: string;
    emailVerified: boolean;
    email: string;
};

export type SessionUser = MeData;

export type AuthPayload = {
    token: string;
    refreshToken: string;
    emailVerified: boolean;
    user: SessionUser;
};

export type ProfileData = {
    id: number;
    username: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    coverUrl?: string;
    followersCount: number;
    followingCount: number;
    posts: Post[];
};

export type ProfileMetaData = Omit<MeData, "emailVerified">;

export type FollowUser = {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    followedByMe?: boolean;
};

export type FollowStateRow = {
    user: FollowUser;
    followedByMe: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function assertRequired(value: string, field: string) {
    if (!value) {
        throw new Error(`${field} is required`);
    }
}

function assertMaxLength(value: string, maxLength: number, field: string) {
    if (value.length > maxLength) {
        throw new Error(`${field} must be at most ${maxLength} characters`);
    }
}

function assertMinLength(value: string, minLength: number, field: string) {
    if (value.length < minLength) {
        throw new Error(`${field} must be at least ${minLength} characters`);
    }
}

function normalizeText(value: unknown): string {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim();
}

function normalizeAndValidateUsername(username: string): string {
    const normalized = normalizeText(username);
    assertRequired(normalized, 'Username');
    assertMinLength(normalized, USERNAME_MIN_LENGTH, 'Username');
    assertMaxLength(normalized, USERNAME_MAX_LENGTH, 'Username');
    return normalized;
}

function normalizeAndValidateEmail(email: string): string {
    const normalized = normalizeText(email).toLowerCase();
    assertRequired(normalized, 'Email');
    assertMaxLength(normalized, EMAIL_MAX_LENGTH, 'Email');
    if (!EMAIL_REGEX.test(normalized)) {
        throw new Error('Invalid email');
    }
    return normalized;
}

function validatePassword(password: string, field: string): string {
    assertRequired(password, field);
    assertMinLength(password, PASSWORD_MIN_LENGTH, field);
    assertMaxLength(password, PASSWORD_MAX_LENGTH, field);
    return password;
}

export async function login(identifier: string, password: string): Promise<AuthPayload> {
    const normalizedIdentifier = normalizeText(identifier);
    assertRequired(normalizedIdentifier, 'Identifier');
    assertMaxLength(normalizedIdentifier, LOGIN_IDENTIFIER_MAX_LENGTH, 'Identifier');
    validatePassword(password, 'Password');
    const data = await graphqlFetch<{ login: AuthPayload }>(LOGIN_MUTATION, { identifier: normalizedIdentifier, password });
    return data.login;
}

export async function signUp(username: string, email: string, password: string): Promise<AuthPayload> {
    const language = await getStoredAppLanguage();
    const normalizedUsername = normalizeAndValidateUsername(username);
    const normalizedEmail = normalizeAndValidateEmail(email);
    validatePassword(password, 'Password');
    const data = await graphqlFetch<{ signUp: AuthPayload }>(
        SIGNUP_MUTATION,
        { username: normalizedUsername, email: normalizedEmail, password },
        language ? { headers: { "x-app-language": language } } : undefined
    );
    return data.signUp;
}

export async function getMe(options: { skipAuthFailureHandler?: boolean } = {}): Promise<MeData> {
    const data = await graphqlFetch<{ me: MeData }>(GET_ME_QUERY, {}, options);
    return data.me;
}

export async function refreshAuth(refreshToken: string): Promise<AuthPayload> {
    const data = await graphqlFetch<{ refreshAuth: AuthPayload }>(
        REFRESH_AUTH_MUTATION,
        { refreshToken },
        { skipAuthFailureHandler: true }
    );

    return data.refreshAuth;
}

export async function updateMyProfile(input: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    coverUrl?: string;
}): Promise<MeData> {
    const normalizedInput = {
        displayName: normalizeText(input.displayName),
        bio: normalizeText(input.bio),
        avatarUrl: normalizeText(input.avatarUrl),
        coverUrl: normalizeText(input.coverUrl),
    };

    if (normalizedInput.displayName) {
        assertMaxLength(normalizedInput.displayName, DISPLAY_NAME_MAX_LENGTH, 'Display name');
    }

    if (normalizedInput.bio) {
        assertMaxLength(normalizedInput.bio, BIO_MAX_LENGTH, 'Bio');
    }

    if (normalizedInput.avatarUrl) {
        assertMaxLength(normalizedInput.avatarUrl, URL_MAX_LENGTH, 'Avatar URL');
    }

    if (normalizedInput.coverUrl) {
        assertMaxLength(normalizedInput.coverUrl, URL_MAX_LENGTH, 'Cover URL');
    }

    const data = await graphqlFetch<{
        updateMyProfile: {
            id: number;
            username: string;
            displayName: string;
            bio: string;
            avatarUrl: string;
            coverUrl: string;
            emailVerified: boolean;
            email: string;
        };
    }>(UPDATE_MY_PROFILE_MUTATION, normalizedInput);

    return data.updateMyProfile;
}

export async function isEmailUsed(email: string): Promise<boolean> {
    const normalizedEmail = normalizeAndValidateEmail(email);
    const data = await graphqlFetch<{ isEmailUsed: boolean }>(IS_EMAIL_USED_QUERY, { email: normalizedEmail });
    return data.isEmailUsed;
}

export async function changeMyEmail(currentPassword: string, newEmail: string): Promise<boolean> {
    const language = await getStoredAppLanguage();
    validatePassword(currentPassword, 'Current password');
    const normalizedEmail = normalizeAndValidateEmail(newEmail);
    const data = await graphqlFetch<{ changeMyEmail: boolean }>(
        CHANGE_MY_EMAIL_MUTATION,
        { currentPassword, newEmail: normalizedEmail },
        language ? { headers: { "x-app-language": language } } : undefined
    );

    return data.changeMyEmail;
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<boolean> {
    validatePassword(currentPassword, 'Current password');
    validatePassword(newPassword, 'New password');
    const data = await graphqlFetch<{ changeMyPassword: boolean }>(CHANGE_MY_PASSWORD_MUTATION, {
        currentPassword,
        newPassword,
    });

    return data.changeMyPassword;
}

export async function deleteMyAccount(currentPassword: string): Promise<boolean> {
    validatePassword(currentPassword, 'Current password');
    const data = await graphqlFetch<{ deleteMyAccount: boolean }>(DELETE_MY_ACCOUNT_MUTATION, {
        currentPassword,
    });

    return data.deleteMyAccount;
}

export async function resendMyVerificationLink(): Promise<EmailSendResult> {
    const language = await getStoredAppLanguage();
    const data = await graphqlFetch<{ resendMyVerificationLink: EmailSendResult }>(RESEND_VERIFICATION_EMAIL_MUTATION, {}, language ? { headers: { "x-app-language": language } } : undefined);
    return data.resendMyVerificationLink;
}

export async function fetchFeed(params: { username?: string; types?: ActivityType[] }): Promise<Activity[]> {
    const normalizedUsername = normalizeText(params.username);
    if (normalizedUsername) {
        assertMaxLength(normalizedUsername, USERNAME_MAX_LENGTH, 'Username');
    }

    const normalizedTypes = params.types?.map(type => type.toUpperCase() as Uppercase<ActivityType>);

    const normalizedParams = {
        ...params,
        ...(normalizedUsername ? { username: normalizedUsername } : {}),
        ...(normalizedTypes ? { types: normalizedTypes } : {}),
    };

    if (!normalizedUsername && "username" in normalizedParams) {
        delete (normalizedParams as { username?: string }).username;
    }

    const data = await graphqlFetch<{ feed: Activity[] }>(FEED_QUERY, normalizedParams);
    return (data.feed ?? []).map(activity => ({
        ...activity,
        type: activity.type.toLowerCase() as ActivityType,
    }));
}

export async function followUser(username: string): Promise<boolean> {
    const normalizedUsername = normalizeAndValidateUsername(username);
    const data = await graphqlFetch<{ followUser: boolean }>(FOLLOW_USER_MUTATION, { username: normalizedUsername });
    return data.followUser;
}

export async function unfollowUser(username: string): Promise<boolean> {
    const normalizedUsername = normalizeAndValidateUsername(username);
    const data = await graphqlFetch<{ unfollowUser: boolean }>(UNFOLLOW_USER_MUTATION, { username: normalizedUsername });
    return data.unfollowUser;
}

export async function likePost(postId: number): Promise<boolean> {
    const data = await graphqlFetch<{ likePost: boolean }>(LIKE_POST_MUTATION, { postId });
    return data.likePost;
}

export async function unlikePost(postId: number): Promise<boolean> {
    const data = await graphqlFetch<{ unlikePost: boolean }>(UNLIKE_POST_MUTATION, { postId });
    return data.unlikePost;
}

export async function likeComment(commentId: number): Promise<boolean> {
    const data = await graphqlFetch<{ likeComment: boolean }>(LIKE_COMMENT_MUTATION, { commentId });
    return data.likeComment;
}

export async function unlikeComment(commentId: number): Promise<boolean> {
    const data = await graphqlFetch<{ unlikeComment: boolean }>(UNLIKE_COMMENT_MUTATION, { commentId });
    return data.unlikeComment;
}

export async function deletePost(postId: number): Promise<boolean> {
    const data = await graphqlFetch<{ deletePost: boolean }>(DELETE_POST_MUTATION, { postId });
    return data.deletePost;
}

export async function deleteComment(commentId: number): Promise<boolean> {
    const data = await graphqlFetch<{ deleteComment: boolean }>(DELETE_COMMENT_MUTATION, { commentId });
    return data.deleteComment;
}

export async function addPost(content: string): Promise<number> {
    const normalizedContent = normalizeText(content);
    assertRequired(normalizedContent, 'Content');
    assertMaxLength(normalizedContent, POST_CONTENT_MAX_LENGTH, 'Content');
    const data = await graphqlFetch<{ addPost: { id: number } }>(ADD_POST_MUTATION, { content: normalizedContent });
    return data.addPost.id;
}

export async function addComment(postId: number, content: string): Promise<{
    id: number;
    content: string;
    createdAt: string;
    user: {
        id: number;
        username: string;
        displayName?: string;
        avatarUrl?: string;
    };
}> {
    const normalizedContent = normalizeText(content);
    assertRequired(normalizedContent, 'Content');
    assertMaxLength(normalizedContent, COMMENT_CONTENT_MAX_LENGTH, 'Content');

    const data = await graphqlFetch<{
        addComment: {
            id: number;
            content: string;
            createdAt: string;
            user: {
                id: number;
                username: string;
                displayName?: string;
                avatarUrl?: string;
            };
        };
    }>(ADD_COMMENT_MUTATION, { postId, content: normalizedContent });
    return {
        ...data.addComment,
    };
}

export async function fetchLikedUsers(postId: number): Promise<FollowUser[]> {
    const data = await graphqlFetch<{
        post: { likedUsers: FollowUser[] };
    }>(GET_LIKED_USERS_QUERY, { postId });

    return data.post?.likedUsers ?? [];
}

export async function fetchCommentLikedUsers(commentId: number): Promise<FollowUser[]> {
    const data = await graphqlFetch<{
        comment: { likedUsers: FollowUser[] };
    }>(GET_COMMENT_LIKED_USERS_QUERY, { commentId });

    return data.comment?.likedUsers ?? [];
}

export async function fetchUserProfile(username: string): Promise<ProfileData | null> {
    const normalizedUsername = normalizeAndValidateUsername(username);
    const data = await graphqlFetch<{ userByUsername: ProfileData | null }>(USER_PROFILE_QUERY, { username: normalizedUsername });
    return data.userByUsername;
}

export async function fetchUserProfileMeta(username: string): Promise<ProfileMetaData | null> {
    const normalizedUsername = normalizeAndValidateUsername(username);
    const data = await graphqlFetch<{ userByUsername: ProfileMetaData | null }>(USER_PROFILE_QUERY, { username: normalizedUsername });
    return data.userByUsername;
}

export async function fetchFollowers(username: string): Promise<FollowUser[]> {
    const normalizedUsername = normalizeAndValidateUsername(username);
    const data = await graphqlFetch<{ followers: FollowUser[] }>(FOLLOWERS_QUERY, { username: normalizedUsername });
    return data.followers ?? [];
}

export async function fetchFollowing(username: string): Promise<FollowUser[]> {
    const normalizedUsername = normalizeAndValidateUsername(username);
    const data = await graphqlFetch<{ following: FollowUser[] }>(FOLLOWING_QUERY, { username: normalizedUsername });
    return data.following ?? [];
}

export async function fetchProfileFollowersView(username: string): Promise<FollowStateRow[]> {
    const normalizedUsername = normalizeAndValidateUsername(username);
    const data = await graphqlFetch<{ getProfileFollowersView: FollowStateRow[] }>(
        FOLLOWERS_WITH_FOLLOW_STATE_QUERY,
        { username: normalizedUsername }
    );

    return data.getProfileFollowersView ?? [];
}

export async function fetchProfileFollowingView(username: string): Promise<FollowStateRow[]> {
    const normalizedUsername = normalizeAndValidateUsername(username);
    const data = await graphqlFetch<{ getProfileFollowingView: FollowStateRow[] }>(
        FOLLOWING_WITH_FOLLOW_STATE_QUERY,
        { username: normalizedUsername }
    );

    return data.getProfileFollowingView ?? [];
}

export async function fetchLikedPosts(username: string): Promise<Post[]> {
    const normalizedUsername = normalizeAndValidateUsername(username);
    const data = await graphqlFetch<{ likedPosts: Post[] }>(LIKED_POSTS_QUERY, { username: normalizedUsername });
    return data.likedPosts ?? [];
}
