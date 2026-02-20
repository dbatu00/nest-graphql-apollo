import { graphqlFetch } from "@/utils/graphqlFetch";

export async function getCurrentUser() {
  try {
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
  } catch (err) {
    console.warn("[currentUser] failed to fetch current user", err);
    return null;
  }
}
