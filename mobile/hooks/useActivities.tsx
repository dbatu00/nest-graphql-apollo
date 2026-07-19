/*
Kind:
Hook

Role:
Feed data layer

Responsibility:
- Fetch activity feeds
- Own feed state and mutations
- Bridge UI components to the backend

Owns:
- Activities
- Loading state
- Error state

Delegates:
- Network requests → graphql/client
- Activity model → Activity type

Used by:
- Feed
- Username screen

TODO:
- Move current user identity into useAuth (or another dedicated identity hook)
- Move follow stuff to a dedicated hook
*/
import { useEffect, useState, useCallback } from "react";
import { Activity } from "@/types/Activity";
import {
  addPost,
  getMyProfile,
  deleteComment as deleteCommentMutation,
  deletePost as deletePostMutation,
  fetchFeed,
  followUser,
  likeComment,
  likePost,
  unfollowUser,
  unlikeComment,
  unlikePost,
  addComment,
} from "@/graphql/client";

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
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(null);
  const [currentUserLabel, setCurrentUserLabel] = useState<string | null>(null);

  useEffect(() => {
    getMyProfile()
      .then(user => {
        setCurrentUserId(user?.id ?? null);
        setCurrentUserAvatarUrl(user?.avatarUrl?.trim() || null);
        setCurrentUserLabel(user?.displayName?.trim() || user?.username?.trim() || null);
      })
      .catch((err: unknown) => {
        console.warn("[useActivities] failed to resolve current user", err);
        setCurrentUserId(null);
        setCurrentUserAvatarUrl(null);
        setCurrentUserLabel(null);
      });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const feed = await fetchFeed({
        username,
        types,
      });

      setActivities(feed);
    } catch (err: unknown) {
      console.error("[useActivities] feed refresh failed", err);
      setError("Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [username, types]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Shared shape for all "flip a boolean, hit one of two endpoints,
   * recover on failure" actions (post like, comment like, follow).
   *
   * `apply` is the optimistic state transform, computed from the *current*
   * activities so each caller can build it as a plain closure.
   * `isOn` decides which of onFn/offFn to call.
   * `rollback`, if provided, restores exact prior state on failure instead
   * of doing a full server refresh (cheaper + no flash of stale data).
   */
  const optimisticToggle = useCallback(
    async (
      apply: (prev: Activity[]) => Activity[],
      isOn: boolean,
      onFn: () => Promise<unknown>,
      offFn: () => Promise<unknown>,
      rollback?: (prev: Activity[]) => void
    ) => {
      let previousState: Activity[] | null = null;

      setActivities(prev => {
        previousState = prev;
        return apply(prev);
      });

      try {
        await (isOn ? offFn() : onFn());
      } catch (err: unknown) {
        console.error("[useActivities] optimistic toggle failed", err);
        if (rollback && previousState) {
          rollback(previousState);
        } else {
          refresh();
        }
      }
    },
    [refresh]
  );

  /**
   * Shared shape for delete actions: optimistically remove something from
   * `activities`, and roll back to the exact prior state on failure rather
   * than triggering a full refresh.
   */
  const optimisticDelete = useCallback(
    async (
      apply: (prev: Activity[]) => Activity[],
      deleteFn: () => Promise<unknown>
    ) => {
      let previousState: Activity[] | null = null;

      setActivities(prev => {
        previousState = prev;
        return apply(prev);
      });

      try {
        await deleteFn();
      } catch (err: unknown) {
        console.error("[useActivities] delete failed", err);
        if (previousState) {
          setActivities(previousState);
        }
      }
    },
    []
  );

  /* POST STUFF */

  const publishPost = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      try {
        await addPost(content);
        refresh();
      } catch (err: unknown) {
        console.error("[useActivities] publishPost failed", err);
        refresh();
      }
    },
    [refresh]
  );

  const deletePost = useCallback(
    async (postId: number) => {
      await optimisticDelete(
        prev => prev.filter(a => a.targetPost?.id !== postId),
        () => deletePostMutation(postId)
      );
    },
    [optimisticDelete]
  );

  const togglePostLike = useCallback(
    async (postId: number, currentlyLiked: boolean) => {
      const apply = (prev: Activity[]) =>
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

      await optimisticToggle(
        apply,
        currentlyLiked,
        () => likePost(postId),
        () => unlikePost(postId)
      );
    },
    [types, optimisticToggle]
  );

  /* COMMENT STUFF */

  const publishComment = useCallback(
    async (postId: number, content: string) => {
      if (!content.trim()) return;

      try {
        const result = await addComment(postId, content);

        // Optimistically add comment to the post in the feed
        setActivities(prev =>
          prev.map(a => {
            if (a.targetPost?.id !== postId) return a;

            return {
              ...a,
              targetPost: {
                ...a.targetPost,
                comments: [
                  ...(a.targetPost.comments ?? []),
                  result,
                ],
              },
            };
          })
        );
      } catch (err: unknown) {
        console.error("[useActivities] add comment failed", err);
        refresh();
      }
    },
    [refresh]
  );

  const deleteComment = useCallback(
    async (commentId: number, postId: number) => {
      await optimisticDelete(
        prev =>
          prev.map(a => {
            if (a.targetPost?.id !== postId) return a;

            return {
              ...a,
              targetPost: {
                ...a.targetPost,
                comments: (a.targetPost.comments ?? []).filter(
                  comment => comment.id !== commentId
                ),
              },
            };
          }),
        () => deleteCommentMutation(commentId)
      );
    },
    [optimisticDelete]
  );

  const toggleCommentLike = useCallback(
    async (commentId: number, postId: number, currentlyLiked: boolean) => {
      const apply = (prev: Activity[]) =>
        prev.map(a => {
          if (a.targetPost?.id !== postId) return a;

          return {
            ...a,
            targetPost: {
              ...a.targetPost,
              comments: (a.targetPost.comments ?? []).map(comment => {
                if (comment.id !== commentId) return comment;

                return {
                  ...comment,
                  likedByMe: !currentlyLiked,
                  likesCount:
                    (comment.likesCount ?? 0) +
                    (currentlyLiked ? -1 : 1),
                };
              }),
            },
          };
        });

      await optimisticToggle(
        apply,
        currentlyLiked,
        () => likeComment(commentId),
        () => unlikeComment(commentId)
      );
    },
    [optimisticToggle]
  );

  /* FOLLOW */

  const toggleFollow = useCallback(
    async (targetUsername: string, shouldFollow: boolean) => {
      // Optimistically propagate follow state through every user reference in feed rows.
      const apply = (prev: Activity[]) =>
        prev.map(a => {
          const updated = { ...a };

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
        });

      // shouldFollow is the *target* state here (not "currentlyOn"), so we
      // invert it before handing it to optimisticToggle's isOn param.
      await optimisticToggle(
        apply,
        !shouldFollow,
        () => followUser(targetUsername),
        () => unfollowUser(targetUsername)
      );
    },
    [optimisticToggle]
  );

  return {
    activities,
    loading,
    error,
    refresh,
    currentUserId,
    currentUserAvatarUrl,
    currentUserLabel,
    toggleFollow,
    togglePostLike,
    toggleCommentLike,
    deletePost,
    deleteComment,
    publishPost,
    publishComment,
  };
}