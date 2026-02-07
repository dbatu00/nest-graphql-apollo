import { useEffect, useState, useCallback } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { getCurrentUser } from "@/utils/currentUser";
import { Activity } from "@/types/Activity";

export function useFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Fetch current user
  useEffect(() => {
    getCurrentUser().then(user => setCurrentUserId(user?.id ?? null));
  }, []);

  // Fetch feed activities
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await graphqlFetch<{ homeFeed: Activity[] }>(
        `
        query HomeFeed {
          homeFeed {
            id
            type
            createdAt
            actor { id username displayName }
            targetUser { id username displayName followedByMe }
            targetPost { id content user { id username followedByMe } createdAt }
          }
        }
      `
      );
      setActivities(data.homeFeed ?? []);
    } catch (e) {
      setError("Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Optimistic follow/unfollow for activity rows
  const toggleFollowOptimistic = useCallback(
    async (username: string, shouldFollow: boolean) => {
      // Optimistic update
      setActivities(prev =>
        prev.map(a => {
          if (a.type === "follow" && a.targetUser?.username === username) {
            return {
              ...a,
              targetUser: { ...a.targetUser, followedByMe: shouldFollow },
            };
          }
          return a;
        })
      );

      // GraphQL call
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
          { username }
        );
        // re-sync from server to ensure authoritative followedByMe
        await refresh();
      } catch {
        // rollback
        setActivities(prev =>
          prev.map(a => {
            if (a.type === "follow" && a.targetUser?.username === username) {
              return {
                ...a,
                targetUser: { ...a.targetUser, followedByMe: !shouldFollow },
              };
            }
            return a;
          })
        );
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
    publish: async (content: string) => {
      if (!content.trim()) return;
      try {
        await graphqlFetch(
          `
          mutation AddPost($content: String!) {
            addPost(content: $content) {
              id
              content
              createdAt
            }
          }
        `,
          { content }
        );
        console.log("✅ Post published, refreshing feed...");
        await refresh();
      } catch (err) {
        console.error("❌ Post publication failed:", err);
        throw err;
      }
    },
  };
}
