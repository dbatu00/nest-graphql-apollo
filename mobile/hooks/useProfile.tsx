import { useEffect, useState, useCallback } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { Post } from "@/types/Post";
import { getCurrentUser } from "@/utils/currentUser";
import {
  FOLLOWERS_WITH_FOLLOW_STATE_QUERY,
  FOLLOWING_WITH_FOLLOW_STATE_QUERY,
  FOLLOW_USER_MUTATION,
  LIKED_POSTS_QUERY,
  UNFOLLOW_USER_MUTATION,
  USER_PROFILE_QUERY,
} from "@/graphql/operations";

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
  avatarUrl?: string;
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
      .then(user => setCurrentUsername(user?.username ?? null))
      .catch((err: unknown) => {
        console.warn("[useProfile] failed to resolve current user", err);
        setCurrentUsername(null);
      });
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
        }>(USER_PROFILE_QUERY, { username });

        if (cancelled) return;

        setProfile(data.userByUsername);
        setPosts(data.userByUsername.posts ?? []);
      } catch (err: unknown) {
        console.error("[useProfile] profile fetch failed", err);
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

    try {
      const data = await graphqlFetch<{ likedPosts: Post[] }>(
        LIKED_POSTS_QUERY,
        { username }
      );

      setLikedPosts(data.likedPosts ?? []);
    } catch (err: unknown) {
      console.error("[useProfile] liked posts fetch failed", err);
    }
  }, [username]);

  /* FOLLOWERS */
  const fetchFollowers = useCallback(async () => {
    if (!username) return;

    try {
      const data = await graphqlFetch<{
        followersWithFollowState: FollowerViewAPI[];
      }>(FOLLOWERS_WITH_FOLLOW_STATE_QUERY, { username });

      setFollowers(
        (data.followersWithFollowState ?? []).map(f => ({
          user: f.user,
          followedByMe: f.followedByMe,
        }))
      );
    } catch (err: unknown) {
      console.error("[useProfile] followers fetch failed", err);
    }
  }, [username]);

  /* FOLLOWING */
  const fetchFollowing = useCallback(async () => {
    if (!username) return;

    try {
      const data = await graphqlFetch<{
        followingWithFollowState: FollowerViewAPI[];
      }>(FOLLOWING_WITH_FOLLOW_STATE_QUERY, { username });

      setFollowing(
        (data.followingWithFollowState ?? []).map(f => ({
          user: f.user,
          followedByMe: f.followedByMe,
        }))
      );
    } catch (err: unknown) {
      console.error("[useProfile] following fetch failed", err);
    }
  }, [username]);

  const toggleFollow = useCallback(
    async (targetUsername: string, shouldFollow: boolean) => {
      if (!currentUsername || currentUsername === targetUsername) return;

      // Optimistically sync follow state across followers/following/likes views.
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
          shouldFollow ? FOLLOW_USER_MUTATION : UNFOLLOW_USER_MUTATION,
          { username: targetUsername }
        );
      } catch (err: unknown) {
        console.error("[useProfile] follow toggle failed", err);
        // Roll back all optimistic surfaces if mutation fails.
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
    setLikedPosts,
    fetchLikedPosts,
  };
}
