import { useEffect, useState, useCallback } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { Activity } from "@/types/Activity";

export function useProfileActivity(username?: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    try {
      const data = await graphqlFetch<{ profileActivity: Activity[] }>(
        `
        query ProfileActivity($username: String!) {
          profileActivity(username: $username) {
            id
            active
            type
            createdAt
            actor { id username displayName }
            targetUser { id username displayName followedByMe }
            targetPost { id content user { id username displayName } createdAt }
          }
        }
      `,
        { username }
      );
      
     setActivities(data.profileActivity?.filter(a => a.type !== "follow" || a.active) ?? []);

    } catch (err) {
      
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (!username) return;
    refresh();
  }, [username, refresh]);

  const toggleFollowOptimistic = useCallback(
    async (username: string, shouldFollow: boolean) => {
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
        // re-sync activities from server
        await refresh();
      } catch (err) {
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

  return { activities, loading, refresh, toggleFollowOptimistic };
}
