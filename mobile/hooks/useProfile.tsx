import { useEffect, useState, useCallback } from "react";
import { Post } from "@/types/Post";
import { getCurrentUser } from "@/utils/currentUser";
import {
  fetchFollowersWithFollowState,
  fetchFollowingWithFollowState,
  fetchLikedPosts as fetchLikedPostsQuery,
  fetchUserProfile,
  followUser,
  unfollowUser,
} from "@/graphql/client";

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

        const userByUsername = await fetchUserProfile(username);

        if (cancelled) return;

        if (!userByUsername) {
          setProfile(null);
          setPosts([]);
          return;
        }

        setProfile(userByUsername);
        setPosts(userByUsername.posts ?? []);
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
      const liked = await fetchLikedPostsQuery(username);
      setLikedPosts(liked);
    } catch (err: unknown) {
      console.error("[useProfile] liked posts fetch failed", err);
    }
  }, [username]);

  /* FOLLOWERS */
  const fetchFollowers = useCallback(async () => {
    if (!username) return;

    try {
      const rows = await fetchFollowersWithFollowState(username);

      setFollowers(
        rows.map(f => ({
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
      const rows = await fetchFollowingWithFollowState(username);

      setFollowing(
        rows.map(f => ({
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
        if (shouldFollow) {
          await followUser(targetUsername);
        } else {
          await unfollowUser(targetUsername);
        }
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
