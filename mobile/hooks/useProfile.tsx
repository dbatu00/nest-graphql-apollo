import { useEffect, useState, useCallback } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { Post } from "@/types/Post";
import { getCurrentUser } from "@/utils/currentUser";

type Profile = {
  id: number;
  username: string;
  displayName?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
};

type UserSummary = {
  id: number;
  username: string;
  displayName?: string;
};

type FollowerViewAPI = {
  user: UserSummary;
  followedByMe: boolean;
};

type FollowRow = {
  user: UserSummary;
  followedByMe: boolean;
};

export function useProfile(username: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<FollowRow[]>([]);
  const [following, setFollowing] = useState<FollowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);

  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  /* CURRENT USER */
  useEffect(() => {
    getCurrentUser()
      .then(user => setCurrentUsername(user.username))
      .catch(() => setCurrentUsername(null));
  }, []);

  /* PROFILE + POSTS */
  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    async function fetchProfile() {
      try {
        setLoading(true);

        const data = await graphqlFetch<{
          userByUsername: Profile & { posts: Post[] };
        }>(
          `
          query UserProfile($username: String!) {
            userByUsername(username: $username) {
              id
              username
              displayName
              bio
              followersCount
              followingCount
              posts {
                id
                content
                createdAt
              }
            }
          }
        `,
          { username }
        );

        if (cancelled) return;

        setProfile(data.userByUsername);
        setPosts(data.userByUsername.posts ?? []);
      } catch {
        if (!cancelled) {
          setProfile(null);
          setPosts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [username]);

  /* LIKED POSTS */
  const fetchLikedPosts = useCallback(async () => {
    if (!username) return;

    const data = await graphqlFetch<{ likedPosts: Post[] }>(
      `
      query LikedPosts($username: String!) {
        likedPosts(username: $username) {
          id
          content
          createdAt
          user {
            id
            username
            displayName
            followedByMe
          }
          likesCount
          likedByMe
        }
      }
      `,
      { username }
    );

    setLikedPosts(data.likedPosts ?? []);
  }, [username]);

  /* FOLLOWERS */
  const fetchFollowers = useCallback(async () => {
    if (!username) return;

    const data = await graphqlFetch<{
      followersWithFollowState: FollowerViewAPI[];
    }>(
      `
      query FollowersWithFollowState($username: String!) {
        followersWithFollowState(username: $username) {
          followedByMe
          user {
            id
            username
            displayName
          }
        }
      }
    `,
      { username }
    );

    setFollowers(
      (data.followersWithFollowState ?? []).map(f => ({
        user: f.user,
        followedByMe: f.followedByMe,
      }))
    );
  }, [username]);

  /* FOLLOWING */
  const fetchFollowing = useCallback(async () => {
    if (!username) return;

    const data = await graphqlFetch<{
      followingWithFollowState: FollowerViewAPI[];
    }>(
      `
      query FollowingWithFollowState($username: String!) {
        followingWithFollowState(username: $username) {
          followedByMe
          user {
            id
            username
            displayName
          }
        }
      }
      `,
      { username }
    );

    setFollowing(
      (data.followingWithFollowState ?? []).map(f => ({
        user: f.user,
        followedByMe: f.followedByMe,
      }))
    );
  }, [username]);

  const toggleFollow = useCallback(
  async (targetUsername: string, shouldFollow: boolean) => {
    if (!currentUsername || currentUsername === targetUsername) return;

    // update followers / following
    setFollowers(prev =>
      prev.map(f =>
        f.user.username === targetUsername
          ? { ...f, followedByMe: shouldFollow }
          : f
      )
    );
    setFollowing(prev =>
      prev.map(f =>
        f.user.username === targetUsername
          ? { ...f, followedByMe: shouldFollow }
          : f
      )
    );

    // ✅ update Likes tab immediately
    setLikedPosts(prev =>
      prev.map(p => ({
        ...p,
        user:
          p.user.username === targetUsername
            ? { ...p.user, followedByMe: shouldFollow }
            : p.user,
      }))
    );

    try {
      await graphqlFetch(
        shouldFollow
          ? `mutation FollowUser($username: String!) { followUser(username: $username) }`
          : `mutation UnfollowUser($username: String!) { unfollowUser(username: $username) }`,
        { username: targetUsername }
      );
    } catch {
      // rollback if backend fails
      setFollowers(prev =>
        prev.map(f =>
          f.user.username === targetUsername
            ? { ...f, followedByMe: !shouldFollow }
            : f
        )
      );
      setFollowing(prev =>
        prev.map(f =>
          f.user.username === targetUsername
            ? { ...f, followedByMe: !shouldFollow }
            : f
        )
      );
      setLikedPosts(prev =>
        prev.map(p => ({
          ...p,
          user:
            p.user.username === targetUsername
              ? { ...p.user, followedByMe: !shouldFollow }
              : p.user,
        }))
      );
    }
  },
  [currentUsername]
);


  return {
    profile,
    posts,
    followers,
    following,
    fetchFollowers,
    fetchFollowing,
    toggleFollow,
    loading,
    likedPosts,
    setLikedPosts, // ✅ REQUIRED FIX
    fetchLikedPosts,
  };
}
