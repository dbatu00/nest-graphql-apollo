import { useEffect, useState, useCallback } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { getCurrentUser } from "@/utils/currentUser";
import { Activity } from "@/types/Activity";

export function useFeed(username?: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    getCurrentUser().then(user => setCurrentUserId(user?.id ?? null));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await graphqlFetch<{ feed: Activity[] }>(
        `
        query Feed($username: String) {
          feed(username: $username) {
            id
            active
            type
            createdAt
            actor { id username displayName }
            targetUser { id username displayName followedByMe }
            targetPost {
              id
              content
              user { id username followedByMe }
              createdAt
              likesCount
              likedByMe
            }
          }
        }`,
        { username }
      );
      setActivities(data.feed ?? []);
    } catch (e) {
      setError("Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleFollowOptimistic = useCallback(
    async (targetUsername: string, shouldFollow: boolean) => {
      setActivities(prev =>
        prev.map(a =>
          a.type === "follow" && a.targetUser?.username === targetUsername
            ? { ...a, targetUser: { ...a.targetUser, followedByMe: shouldFollow } }
            : a
        )
      );

      try {
        await graphqlFetch(
          shouldFollow
            ? `mutation FollowUser($username: String!) { followUser(username: $username) }`
            : `mutation UnfollowUser($username: String!) { unfollowUser(username: $username) }`,
          { username: targetUsername }
        );
        await refresh();
      } catch {
        setActivities(prev =>
          prev.map(a =>
            a.type === "follow" && a.targetUser?.username === targetUsername
              ? { ...a, targetUser: { ...a.targetUser, followedByMe: !shouldFollow } }
              : a
          )
        );
      }
    },
    [refresh]
  );

  const toggleLikeOptimistic = useCallback(
  async (postId: number, currentlyLiked: boolean) => {
    setActivities(prev =>
      prev.map(a =>
        a.targetPost?.id === postId
          ? { ...a, targetPost: { ...a.targetPost, likedByMe: !currentlyLiked, likesCount: (a.targetPost.likesCount ?? 0) + (currentlyLiked ? -1 : 1) } }
          : a
      )
    );
    try { await graphqlFetch(`mutation ToggleLike($postId: Int!) { toggleLike(postId: $postId) }`, { postId }); }
    catch { /* rollback */ }
  },
  []
);


  const publish = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      try {
        await graphqlFetch(
          `mutation AddPost($content: String!) {
            addPost(content: $content) { id content createdAt user { id username followedByMe } likesCount likedByMe }
          }`,
          { content }
        );
        await refresh();
      } catch (err) {
        console.error(err);
      }
    },
    [refresh]
  );

  const deletePost = useCallback(
    async (postId: number) => {
      try {
        await graphqlFetch(`mutation DeletePost($postId: Int!) { deletePost(postId: $postId) }`, { postId });
        await refresh();
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    [refresh]
  );

  return {
    activities,
    loading,
    error,
    refresh,
    currentUserId,
    toggleFollowOptimistic,
    toggleLikeOptimistic,
    publish,
    deletePost,
  };
}
