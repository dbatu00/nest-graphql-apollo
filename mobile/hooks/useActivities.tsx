import { useEffect, useState, useCallback } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { getCurrentUser } from "@/utils/currentUser";
import { Activity } from "@/types/Activity";

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
    getCurrentUser().then(user =>
      setCurrentUserId(user?.id ?? null)
    );
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await graphqlFetch<{ feed: Activity[] }>(
        `
        query Feed($username: String, $types: [String!]) {
          feed(username: $username, types: $types) {
            id
            type
            active
            createdAt

            actor {
              id
              username
              displayName
              followedByMe
            }

            targetUser {
              id
              username
              displayName
              followedByMe
            }

            targetPost {
              id
              content
              createdAt
              likesCount
              likedByMe
              user {
                id
                username
                displayName
                followedByMe
              }
            }
          }
        }
        `,
        { username, types }
      );

      setActivities(data.feed ?? []);
    } catch {
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
          shouldFollow
            ? `mutation FollowUser($username: String!) { followUser(username: $username) }`
            : `mutation UnfollowUser($username: String!) { unfollowUser(username: $username) }`,
          { username: targetUsername }
        );
      } catch {
        refresh(); // rollback via truth
      }
    },
    [refresh]
  );

  /* ---------------- LIKE ---------------- */

  const toggleLikeOptimistic = useCallback(
    async (postId: number, currentlyLiked: boolean) => {
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
  currentlyLiked
    ? `mutation UnlikePost($postId: Int!) {
        unlikePost(postId: $postId)
      }`
    : `mutation LikePost($postId: Int!) {
        likePost(postId: $postId)
      }`,
  { postId }
);

      } catch {
        refresh();
      }
    },
    [types, refresh]
  );

  /* ---------------- DELETE POST ---------------- */

  const deletePost = useCallback(
    async (postId: number) => {
      setActivities(prev =>
        prev.filter(a => a.targetPost?.id !== postId)
      );

      try {
        await graphqlFetch(
          `mutation DeletePost($postId: Int!) {
            deletePost(postId: $postId)
          }`,
          { postId }
        );
      } catch {
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
        await graphqlFetch(
          `mutation AddPost($content: String!) {
            addPost(content: $content) { id }
          }`,
          { content }
        );

        refresh();
      } catch {
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
