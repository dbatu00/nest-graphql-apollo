import { graphqlFetch } from "@/utils/graphqlFetch";

export async function getCurrentUser() {
  const data = await graphqlFetch<{
    me: {
      id: number;
      username: string;
      displayName?: string;
    };
  }>(`
    query {
      me {
        id
        username
        displayName
      }
    }
  `);

  return data.me;
}
