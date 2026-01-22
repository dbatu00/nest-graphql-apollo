import { useEffect, useState } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";

export function useProfile(username: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    graphqlFetch<{ userByUsername: any }>(
      `
      query ($username: String!) {
        userByUsername(username: $username) {
          id
          username
          displayName
          createdAt
        }
      }
      `,
      { username }
    )
      .then(res => setProfile(res.userByUsername))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [username]);

  return { profile, loading, error };
}
