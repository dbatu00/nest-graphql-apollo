import { useState, useEffect, useCallback } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { Activity } from "@/types/Activity";

export function useActivityFeed(username?: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);

      const data = await graphqlFetch<{ activityFeed: Activity[] }>(
        `
        query ActivityFeed($username: String) {
          activityFeed(username: $username) {
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

      setActivities(data.activityFeed);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, error, refresh: fetchActivities };
}
