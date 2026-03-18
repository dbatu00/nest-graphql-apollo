import { graphqlFetch, isAuthGraphQLError } from "@/utils/graphqlFetch";
import { AUTH_ME_QUERY } from "@/graphql/operations";

export async function getCurrentUser() {
  try {
    const data = await graphqlFetch<{
      me: {
        id: number;
        username: string;
        displayName?: string;
        emailVerified: boolean;
      };
    }>(AUTH_ME_QUERY);

    return data.me;
  } catch (err: unknown) {
    if (isAuthGraphQLError(err)) {
      console.warn("[currentUser] auth failure while fetching current user", err);
      return null;
    }

    console.warn("[currentUser] failed to fetch current user", err);
    throw err;
  }
}
