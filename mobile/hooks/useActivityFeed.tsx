import { useState, useEffect, useCallback } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { Activity } from "@/types/Activity";

export function useActivityFeed(username?: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!username) {
      setActivities([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await graphqlFetch<{ profileActivity: Activity[] }>(
        `
        query ProfileActivity($username: String!) {
          profileActivity(username: $username) {
            id
            type
            createdAt
            actor { id username displayName }
            targetUser { id username displayName }
            targetPost { id content }
          }
        }
        `,
        { username }
      );

      setActivities(data.profileActivity);
    } catch (err: any) {
      setError(err.message ?? "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, error, refresh: fetchActivities };
}
