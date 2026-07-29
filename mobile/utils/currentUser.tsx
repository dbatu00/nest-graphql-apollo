import { getMe } from "@/graphql/client";
import { isAuthGraphQLError } from "@/utils/graphqlFetch";

export async function getCurrentUser() {
  try {
    return await getMe();
  } catch (err: unknown) {
    if (isAuthGraphQLError(err)) {
      console.warn("[currentUser] auth failure while fetching current user", err);
      return null;
    }

    console.warn("[currentUser] failed to fetch current user", err);
    throw err;
  }
}
