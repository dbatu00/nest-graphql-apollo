import { graphqlFetch } from "@/utils/graphqlFetch";
import { ME_QUERY } from "@/graphql/operations";

export async function getCurrentUser() {
  try {
    const data = await graphqlFetch<{
      me: {
        id: number;
        username: string;
        displayName?: string;
      };
    }>(ME_QUERY);

    return data.me;
  } catch (err) {
    console.warn("[currentUser] failed to fetch current user", err);
    return null;
  }
}
