import {
    ADD_POST_MUTATION,
    AUTH_ME_QUERY,
    CHANGE_MY_EMAIL_MUTATION,
    CHANGE_MY_PASSWORD_MUTATION,
    DELETE_POST_MUTATION,
    FEED_QUERY,
    FOLLOWERS_QUERY,
    FOLLOWERS_WITH_FOLLOW_STATE_QUERY,
    FOLLOWING_QUERY,
    FOLLOWING_WITH_FOLLOW_STATE_QUERY,
    FOLLOW_USER_MUTATION,
    GET_LIKED_USERS_QUERY,
    IS_EMAIL_USED_QUERY,
    LIKED_POSTS_QUERY,
    LOGIN_MUTATION,
    ME_QUERY,
    RESEND_VERIFICATION_EMAIL_MUTATION,
    SIGNUP_MUTATION,
    UNFOLLOW_USER_MUTATION,
    UNLIKE_POST_MUTATION,
    LIKE_POST_MUTATION,
    UPDATE_MY_PROFILE_MUTATION,
    USER_PROFILE_QUERY,
} from "@/graphql/operations";
import { EmailSendResult } from "@/types/Auth";
import { Activity } from "@/types/Activity";
import { Post } from "@/types/Post";
import { graphqlFetch } from "@/utils/graphqlFetch";

export type SessionUser = {
    id: number;
    username: string;
    displayName?: string;
};

export type AuthPayload = {
    token: string;
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

export type ProfileMetaData = {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    coverUrl?: string;
};

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

export async function login(identifier: string, password: string): Promise<AuthPayload> {
    const data = await graphqlFetch<{ login: AuthPayload }>(LOGIN_MUTATION, { identifier, password });
    return data.login;
}

export async function signUp(username: string, email: string, password: string): Promise<AuthPayload> {
    const data = await graphqlFetch<{ signUp: AuthPayload }>(SIGNUP_MUTATION, { username, email, password });
    return data.signUp;
}

export async function getAuthMe() {
    const data = await graphqlFetch<{
        me: {
            id: number;
            username: string;
            displayName?: string;
            emailVerified: boolean;
        };
    }>(AUTH_ME_QUERY);

    return data.me;
}

export async function getMyProfile() {
    const data = await graphqlFetch<{
        me: {
            id: number;
            username: string;
            displayName?: string;
            bio?: string;
            avatarUrl?: string;
            coverUrl?: string;
            email: string;
        };
    }>(ME_QUERY);

    return data.me;
}

export async function updateMyProfile(input: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    coverUrl?: string;
}) {
    const data = await graphqlFetch<{
        updateMyProfile: {
            id: number;
            username: string;
            displayName?: string;
            bio?: string;
            avatarUrl?: string;
            coverUrl?: string;
            email: string;
        };
    }>(UPDATE_MY_PROFILE_MUTATION, input);

    return data.updateMyProfile;
}

export async function isEmailUsed(email: string): Promise<boolean> {
    const data = await graphqlFetch<{ isEmailUsed: boolean }>(IS_EMAIL_USED_QUERY, { email });
    return data.isEmailUsed;
}

export async function changeMyEmail(currentPassword: string, newEmail: string): Promise<boolean> {
    const data = await graphqlFetch<{ changeMyEmail: boolean }>(CHANGE_MY_EMAIL_MUTATION, {
        currentPassword,
        newEmail,
    });

    return data.changeMyEmail;
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const data = await graphqlFetch<{ changeMyPassword: boolean }>(CHANGE_MY_PASSWORD_MUTATION, {
        currentPassword,
        newPassword,
    });

    return data.changeMyPassword;
}

export async function resendMyVerificationLink(): Promise<EmailSendResult> {
    const data = await graphqlFetch<{ resendMyVerificationLink: EmailSendResult }>(RESEND_VERIFICATION_EMAIL_MUTATION);
    return data.resendMyVerificationLink;
}

export async function fetchFeed(params: { username?: string; types?: string[] }): Promise<Activity[]> {
    const data = await graphqlFetch<{ feed: Activity[] }>(FEED_QUERY, params);
    return data.feed ?? [];
}

export async function followUser(username: string): Promise<boolean> {
    const data = await graphqlFetch<{ followUser: boolean }>(FOLLOW_USER_MUTATION, { username });
    return data.followUser;
}

export async function unfollowUser(username: string): Promise<boolean> {
    const data = await graphqlFetch<{ unfollowUser: boolean }>(UNFOLLOW_USER_MUTATION, { username });
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

export async function deletePost(postId: number): Promise<boolean> {
    const data = await graphqlFetch<{ deletePost: boolean }>(DELETE_POST_MUTATION, { postId });
    return data.deletePost;
}

export async function addPost(content: string): Promise<number> {
    const data = await graphqlFetch<{ addPost: { id: number } }>(ADD_POST_MUTATION, { content });
    return data.addPost.id;
}

export async function fetchLikedUsers(postId: number): Promise<FollowUser[]> {
    const data = await graphqlFetch<{
        post: { likedUsers: FollowUser[] };
    }>(GET_LIKED_USERS_QUERY, { postId });

    return data.post?.likedUsers ?? [];
}

export async function fetchUserProfile(username: string): Promise<ProfileData | null> {
    const data = await graphqlFetch<{ userByUsername: ProfileData | null }>(USER_PROFILE_QUERY, { username });
    return data.userByUsername;
}

export async function fetchUserProfileMeta(username: string): Promise<ProfileMetaData | null> {
    const data = await graphqlFetch<{ userByUsername: ProfileMetaData | null }>(USER_PROFILE_QUERY, { username });
    return data.userByUsername;
}

export async function fetchFollowers(username: string): Promise<FollowUser[]> {
    const data = await graphqlFetch<{ followers: FollowUser[] }>(FOLLOWERS_QUERY, { username });
    return data.followers ?? [];
}

export async function fetchFollowing(username: string): Promise<FollowUser[]> {
    const data = await graphqlFetch<{ following: FollowUser[] }>(FOLLOWING_QUERY, { username });
    return data.following ?? [];
}

export async function fetchFollowersWithFollowState(username: string): Promise<FollowStateRow[]> {
    const data = await graphqlFetch<{ followersWithFollowState: FollowStateRow[] }>(
        FOLLOWERS_WITH_FOLLOW_STATE_QUERY,
        { username }
    );

    return data.followersWithFollowState ?? [];
}

export async function fetchFollowingWithFollowState(username: string): Promise<FollowStateRow[]> {
    const data = await graphqlFetch<{ followingWithFollowState: FollowStateRow[] }>(
        FOLLOWING_WITH_FOLLOW_STATE_QUERY,
        { username }
    );

    return data.followingWithFollowState ?? [];
}

export async function fetchLikedPosts(username: string): Promise<Post[]> {
    const data = await graphqlFetch<{ likedPosts: Post[] }>(LIKED_POSTS_QUERY, { username });
    return data.likedPosts ?? [];
}
