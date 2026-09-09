/*
Kind:
Hook

Role:
Feed data layer

Responsibility:
- Fetch activity feeds
- Own feed state and mutations
- Bridge UI components to the backend
- Coordinate like/comment mutations with optimistic updates

Owns:
- Activities
- Loading state
- Error state
- Post/comment mutation logic

Delegates:
- Network requests → graphql/client
- Activity model → Activity type
- Follow mutations → followUser / unfollowUser
- Optimistic update patterns → optimisticUpdate utils

Used by:
- Feed
- Username screen
*/
import { useEffect, useState, useCallback, useMemo } from "react";
import { Activity, ActivityType } from "@/types/Activity";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/hooks/useAuth";
import {
  optimisticToggle,
  optimisticDelete,
} from "@/utils/optimisticUpdate";
import {
  addPost,
  deleteComment as deleteCommentMutation,
  deletePost as deletePostMutation,
  fetchFeed,
  likeComment,
  likePost,
  followUser,
  unlikeComment,
  unfollowUser,
  unlikePost,
  addComment,
} from "@/graphql/client";




export function useActivities(types?: ActivityType[]) {
  const { t } = useI18n();
  const { user } = useAuth();


  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const feed = await fetchFeed({
        types,
      });

      setActivities(feed);
    } catch (err: unknown) {
      console.error("[useActivities] feed refresh failed", err);
      setError(t("feed.error.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [types]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visibleActivities = useMemo(() => {
    if (!user?.username) {
      return undefined;
    }

    return activities.filter(a => {
      if (a.type === "post") return true;
      if (a.actor?.username === user.username) return false;
      if (a.type === "like" && a.actor?.username === a.targetPost?.user?.username) return false;
      if (a.type === "comment" && a.actor?.username === a.targetPost?.user?.username) return false;
      return a.type !== "follow" || a.active;
    });
  }, [activities, user?.username]);

  // Wrapper for optimistic updates to activities state
  const appliedOptimisticToggle = useCallback(
    async (
      apply: (prev: Activity[]) => Activity[],
      isOn: boolean,
      onFn: () => Promise<unknown>,
      offFn: () => Promise<unknown>
    ) => {
      await optimisticToggle(apply, isOn, onFn, offFn, setActivities, undefined);
    },
    []
  );

  const appliedOptimisticDelete = useCallback(
    async (
      apply: (prev: Activity[]) => Activity[],
      deleteFn: () => Promise<unknown>
    ) => {
      await optimisticDelete(apply, deleteFn, setActivities);
    },
    []
  );

  /* POST STUFF */

  const publishPost = useCallback(
    async (content: string) => {
      const normalizedContent = content.trim();
      if (!normalizedContent) return;

      try {
        await addPost(normalizedContent);
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
      await appliedOptimisticDelete(
        prev => prev.filter(a => a.targetPost?.id !== postId),
        () => deletePostMutation(postId)
      );
    },
    [appliedOptimisticDelete]
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

      await appliedOptimisticToggle(
        apply,
        currentlyLiked,
        () => likePost(postId),
        () => unlikePost(postId)
      );
    },
    [types, appliedOptimisticToggle]
  );

  /* COMMENT STUFF */

  const publishComment = useCallback(
    async (postId: number, content: string) => {
      const normalizedContent = content.trim();
      if (!normalizedContent) return;

      try {
        const result = await addComment(postId, normalizedContent);

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
                  {
                    id: result.id,
                    content: result.content,
                    createdAt: result.createdAt,
                    updatedAt: result.createdAt,
                    likesCount: 0,
                    likedByMe: false,
                    user: {
                      id: result.user.id,
                      username: result.user.username,
                      displayName: result.user.displayName ?? "",
                      avatarUrl: result.user.avatarUrl ?? "",
                    },
                  },
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
      await appliedOptimisticDelete(
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
    [appliedOptimisticDelete]
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

      await appliedOptimisticToggle(
        apply,
        currentlyLiked,
        () => likeComment(commentId),
        () => unlikeComment(commentId)
      );
    },
    [appliedOptimisticToggle]
  );

  /* FOLLOW */

  const toggleFollow = useCallback(
    async (targetUsername: string, shouldFollow: boolean) => {
      const apply = (prev: Activity[]) =>
        prev.map(a => {
          if (a.targetPost?.user?.username !== targetUsername) {
            return a;
          }

          return {
            ...a,
            targetPost: {
              ...a.targetPost,
              user: {
                ...a.targetPost.user,
                followedByMe: shouldFollow,
              },
            },
          };
        });

      await appliedOptimisticToggle(
        apply,
        !shouldFollow,
        () => followUser(targetUsername),
        () => unfollowUser(targetUsername)
      );
    },
    [appliedOptimisticToggle]
  );

  return {
    activities,
    visibleActivities,
    loading,
    error,
    refresh,
    toggleFollow,
    togglePostLike,
    toggleCommentLike,
    deletePost,
    deleteComment,
    publishPost,
    publishComment,
  };
}