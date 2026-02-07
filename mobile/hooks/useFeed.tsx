import { useEffect, useState, useCallback } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { Activity } from "@/types/Activity";

export function useFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);

      const data = await graphqlFetch<{ homeFeed: Activity[] }>(`
        query {
          homeFeed {
            id
            type
            createdAt
            actor {
              id
              username
              displayName
            }
            targetPost {
              id
              content
              createdAt
              user {
                id
                username
                followedByMe
              }
            }
            targetUser {
              id
              username
              displayName
            }
          }
        }
      `);

      setActivities(data.homeFeed);
    } catch (err: any) {
      setError(err.message ?? "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return {
    activities,
    loading,
    error,
    refresh: fetchFeed,
  };
}
