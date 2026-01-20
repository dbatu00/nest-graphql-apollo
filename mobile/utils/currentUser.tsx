// utils/currentUser.ts
import { graphqlFetch } from "@/utils/graphqlFetch";

export async function getCurrentUser() {
  const data = await graphqlFetch<{ me: { id: number; name: string } }>(`
    query {
      me {
        id
        name
      }
    }
  `);

  return data.me;
}
