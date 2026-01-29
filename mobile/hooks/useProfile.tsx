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

/** UI-facing type */
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

  /** logged-in user */
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

  /* FOLLOWING (later) */
  const fetchFollowing = useCallback(async () => {
    if (!username) return;
  }, [username]);

  /* FOLLOW / UNFOLLOW */
  const toggleFollow = useCallback(
    async (targetUsername: string, shouldFollow: boolean) => {
      // 🚫 prevent self-follow
      if (!currentUsername || currentUsername === targetUsername) {
        return;
      }

      // optimistic update
      setFollowers(prev =>
        prev.map(f =>
          f.user.username === targetUsername
            ? { ...f, followedByMe: shouldFollow }
            : f
        )
      );

      try {
        await graphqlFetch(
          shouldFollow
            ? `
              mutation FollowUser($username: String!) {
                followUser(username: $username)
              }
            `
            : `
              mutation UnfollowUser($username: String!) {
                unfollowUser(username: $username)
              }
            `,
          { username: targetUsername }
        );
      } catch {
        // rollback
        setFollowers(prev =>
          prev.map(f =>
            f.user.username === targetUsername
              ? { ...f, followedByMe: !shouldFollow }
              : f
          )
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
  };
}
