import { useEffect, useState, useCallback } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { getCurrentUser } from "@/utils/currentUser";
import { Activity } from "@/types/Activity";
import {
  ADD_POST_MUTATION,
  DELETE_POST_MUTATION,
  FEED_QUERY,
  FOLLOW_USER_MUTATION,
  LIKE_POST_MUTATION,
  UNFOLLOW_USER_MUTATION,
  UNLIKE_POST_MUTATION,
} from "@/graphql/operations";

type Params = {
  username?: string;
  types?: string[];
};

export function useActivities(params: Params = {}) {
  const { username, types } = params;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(user => setCurrentUserId(user?.id ?? null))
      .catch(err => {
        console.warn("[useActivities] failed to resolve current user", err);
        setCurrentUserId(null);
      });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await graphqlFetch<{ feed: Activity[] }>(FEED_QUERY, {
        username,
        types,
      });

      setActivities(data.feed ?? []);
    } catch (err) {
      console.error("[useActivities] feed refresh failed", err);
      setError("Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [username, types]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ---------------- FOLLOW ---------------- */

  const toggleFollowOptimistic = useCallback(
    async (targetUsername: string, shouldFollow: boolean) => {
      // Optimistically propagate follow state through every user reference in feed rows.
      setActivities(prev =>
        prev.map(a => {
          const updated = { ...a };

          if (a.actor?.username === targetUsername) {
            updated.actor = {
              ...a.actor,
              followedByMe: shouldFollow,
            };
          }

          if (a.targetUser?.username === targetUsername) {
            updated.targetUser = {
              ...a.targetUser,
              followedByMe: shouldFollow,
            };
          }

          if (a.targetPost?.user?.username === targetUsername) {
            updated.targetPost = {
              ...a.targetPost,
              user: {
                ...a.targetPost.user,
                followedByMe: shouldFollow,
              },
            };
          }

          return updated;
        })
      );

      try {
        await graphqlFetch(
          shouldFollow ? FOLLOW_USER_MUTATION : UNFOLLOW_USER_MUTATION,
          { username: targetUsername }
        );
      } catch (err) {
        console.error("[useActivities] follow toggle failed", err);
        refresh(); // rollback via truth
      }
    },
    [refresh]
  );

  /* ---------------- LIKE ---------------- */

  const toggleLikeOptimistic = useCallback(
    async (postId: number, currentlyLiked: boolean) => {
      // Optimistically flip like state and count locally before server confirmation.
      setActivities(prev =>
        prev
          .map(a => {
            if (a.targetPost?.id !== postId) return a;

            return {
              ...a,
              targetPost: {
                ...a.targetPost,
                likedByMe: !currentlyLiked,
                likesCount:
                  (a.targetPost.likesCount ?? 0) +
                  (currentlyLiked ? -1 : 1),
              },
            };
          })
          .filter(a => {
            // If we are in likes-only view and user unlikes → remove activity
            if (types?.includes("like") && currentlyLiked) {
              return a.targetPost?.id !== postId;
            }
            return true;
          })
      );

      try {
        await graphqlFetch(
          currentlyLiked ? UNLIKE_POST_MUTATION : LIKE_POST_MUTATION,
          { postId }
        );
      } catch (err) {
        console.error("[useActivities] like toggle failed", err);
        refresh();
      }
    },
    [types, refresh]
  );

  /* ---------------- DELETE POST ---------------- */

  const deletePost = useCallback(
    async (postId: number) => {
      // Optimistically remove related rows, then rely on refresh if backend rejects.
      setActivities(prev =>
        prev.filter(a => a.targetPost?.id !== postId)
      );

      try {
        await graphqlFetch(DELETE_POST_MUTATION, { postId });
      } catch (err) {
        console.error("[useActivities] delete post failed", err);
        refresh();
      }
    },
    [refresh]
  );

  /* ---------------- PUBLISH ---------------- */

  const publish = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      try {
        await graphqlFetch(ADD_POST_MUTATION, { content });

        refresh();
      } catch (err) {
        console.error("[useActivities] publish failed", err);
        refresh();
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
    deletePost,
    publish,
  };
}
