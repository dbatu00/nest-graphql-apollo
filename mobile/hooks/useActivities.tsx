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
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Activity, ActivityType } from "@/types/Activity";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/hooks/useAuth";
import {
  optimisticCreate,
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

type UseActivitiesOptions = {
  types?: ActivityType[];
  scopeUsername?: string;
  includeSelfLikes?: boolean;
};



export function useActivities(options?: ActivityType[] | UseActivitiesOptions) {
  const { t } = useI18n();
  const { user } = useAuth();

  const types = Array.isArray(options) ? options : options?.types;
  const scopeUsername = Array.isArray(options) ? undefined : options?.scopeUsername;
  const includeSelfLikes = Array.isArray(options) ? false : !!options?.includeSelfLikes;


  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshRequestIdRef = useRef(0);
  const mutationVersionRef = useRef(0);

  const markMutation = useCallback(() => {
    mutationVersionRef.current += 1;
  }, []);


  const refresh = useCallback(async (refreshOptions?: { silent?: boolean }) => {
    const isSilent = !!refreshOptions?.silent;
    const requestId = ++refreshRequestIdRef.current;
    const mutationVersionAtStart = mutationVersionRef.current;

    if (!isSilent) {
      setLoading(true);
    }
    setError(null);

    try {
      const feed = await fetchFeed({
        types,
      });

      if (requestId !== refreshRequestIdRef.current) {
        return;
      }

      if (mutationVersionRef.current !== mutationVersionAtStart) {
        return;
      }

      setActivities(feed);
    } catch (err: unknown) {
      console.error("[useActivities] feed refresh failed", err);
      setError(t("feed.error.loadFailed"));
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [t, types]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const scopedActivities = useMemo(() => {
    if (!scopeUsername) {
      return activities;
    }

    return activities.filter(activity => {
      if (activity.type === "post") {
        return activity.targetPost?.user?.username === scopeUsername;
      }

      if (activity.type === "like") {
        const isActorMatch = activity.actor?.username === scopeUsername;
        if (!isActorMatch) return false;
        if (includeSelfLikes) return true;
        return activity.targetPost?.user?.id !== activity.actor?.id;
      }

      if (activity.type === "comment") {
        return activity.actor?.username === scopeUsername;
      }

      if (activity.type === "follow") {
        return activity.actor?.username === scopeUsername || activity.targetUser?.username === scopeUsername;
      }

      return false;
    });
  }, [activities, includeSelfLikes, scopeUsername]);

  const visibleActivities = useMemo(() => {
    if (scopeUsername) {
      return scopedActivities;
    }

    if (!user?.username) {
      return undefined;
    }

    return scopedActivities.filter(a => {
      if (a.type === "post") return true;
      if (a.actor?.username === user.username) return false;
      if (a.type === "like" && a.actor?.username === a.targetPost?.user?.username) return false;
      if (a.type === "comment" && a.actor?.username === a.targetPost?.user?.username) return false;
      return a.type !== "follow" || a.active;
    });
  }, [scopeUsername, scopedActivities, user?.username]);

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

      if (!user) {
        try {
          await addPost(normalizedContent);
          refresh();
        } catch (err: unknown) {
          console.error("[useActivities] publishPost failed", err);
          refresh();
        }
        return;
      }

      const tempActivityId = -Date.now();
      const tempPostId = tempActivityId;
      const createdAt = new Date().toISOString();

      const optimisticActivity: Activity = {
        id: tempActivityId,
        type: "post",
        createdAt,
        active: true,
        actor: {
          id: user.id,
          username: user.username,
          displayName: user.displayName ?? user.username,
          avatarUrl: user.avatarUrl ?? "",
        },
        targetUser: {
          id: user.id,
          username: user.username,
          displayName: user.displayName ?? user.username,
          avatarUrl: user.avatarUrl ?? "",
        },
        targetPost: {
          id: tempPostId,
          content: normalizedContent,
          createdAt,
          pending: true,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName ?? user.username,
            avatarUrl: user.avatarUrl ?? "",
            followedByMe: false,
          },
          likedByMe: false,
          likesCount: 0,
          comments: [],
        },
      };

      try {
        markMutation();
        await optimisticCreate(
          prev => [optimisticActivity, ...prev],
          () => addPost(normalizedContent),
          setActivities,
          (prev, persistedPostId) =>
            prev.map(activity =>
              activity.id === tempActivityId && activity.targetPost
                ? {
                  ...activity,
                  targetPost: {
                    ...activity.targetPost,
                    id: persistedPostId,
                    pending: false,
                  },
                }
                : activity
            )
        );
        refresh({ silent: true });
      } catch (err: unknown) {
        console.error("[useActivities] publishPost failed", err);
      }
    },
    [refresh, user, markMutation]
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

      markMutation();
      await appliedOptimisticToggle(
        apply,
        currentlyLiked,
        () => likePost(postId),
        () => unlikePost(postId)
      );
    },
    [types, appliedOptimisticToggle, markMutation]
  );

  /* COMMENT STUFF */

  const publishComment = useCallback(
    async (postId: number, content: string) => {
      const normalizedContent = content.trim();
      if (!normalizedContent) return;

      if (!user) {
        refresh();
        return;
      }

      const tempCommentId = -Date.now();
      const createdAt = new Date().toISOString();

      try {
        markMutation();
        await optimisticCreate(
          prev =>
            prev.map(activity => {
              if (activity.targetPost?.id !== postId) return activity;

              return {
                ...activity,
                targetPost: {
                  ...activity.targetPost,
                  comments: [
                    ...(activity.targetPost.comments ?? []),
                    {
                      id: tempCommentId,
                      content: normalizedContent,
                      createdAt,
                      updatedAt: createdAt,
                      pending: true,
                      likesCount: 0,
                      likedByMe: false,
                      user: {
                        id: user.id,
                        username: user.username,
                        displayName: user.displayName ?? user.username,
                        avatarUrl: user.avatarUrl ?? "",
                      },
                    },
                  ],
                },
              };
            }),
          () => addComment(postId, normalizedContent),
          setActivities,
          (prev, result) =>
            prev.map(activity => {
              if (activity.targetPost?.id !== postId) return activity;

              return {
                ...activity,
                targetPost: {
                  ...activity.targetPost,
                  comments: (activity.targetPost.comments ?? []).map(comment =>
                    comment.id !== tempCommentId
                      ? comment
                      : {
                        ...comment,
                        id: result.id,
                        content: result.content,
                        createdAt: result.createdAt,
                        updatedAt: result.createdAt,
                        pending: false,
                        user: {
                          id: result.user.id,
                          username: result.user.username,
                          displayName: result.user.displayName ?? "",
                          avatarUrl: result.user.avatarUrl ?? "",
                        },
                      }
                  ),
                },
              };
            })
        );
      } catch (err: unknown) {
        console.error("[useActivities] add comment failed", err);
      }
    },
    [refresh, user, markMutation]
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

      markMutation();
      await appliedOptimisticToggle(
        apply,
        currentlyLiked,
        () => likeComment(commentId),
        () => unlikeComment(commentId)
      );
    },
    [appliedOptimisticToggle, markMutation]
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

      markMutation();
      await appliedOptimisticToggle(
        apply,
        !shouldFollow,
        () => followUser(targetUsername),
        () => unfollowUser(targetUsername)
      );
    },
    [appliedOptimisticToggle, markMutation]
  );

  return {
    activities: scopedActivities,
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