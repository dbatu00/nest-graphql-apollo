import { useEffect, useState } from "react";
import { graphqlFetch } from "@/utils/graphqlFetch";

export function useProfile(username: string) {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await graphqlFetch<{
        userByUsername: any;
        postsByUsername: any[];
      }>(
        `
        query ($username: String!) {
          userByUsername(username: $username) {
            id
            username
            displayName
            createdAt
          }

          postsByUsername(username: $username) {
            id
            content
            createdAt
          }
        }
        `,
        { username }
      );

      setProfile(data.userByUsername);
      setPosts(data.postsByUsername);
      setLoading(false);
    })();
  }, [username]);

  return { profile, posts, loading };
}
