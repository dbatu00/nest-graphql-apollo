import { graphqlFetch } from "@/utils/graphqlFetch";
import { ME_QUERY } from "@/graphql/operations";

function isAuthFailure(err: unknown): boolean {
  const message = err instanceof Error ? err.message.toLowerCase() : "";

  return (
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("invalid token") ||
    message.includes("jwt")
  );
}

export async function getCurrentUser() {
  try {
    const data = await graphqlFetch<{
      me: {
        id: number;
        username: string;
        displayName?: string;
        emailVerified: boolean;
      };
    }>(ME_QUERY);

    return data.me;
  } catch (err: unknown) {
    if (isAuthFailure(err)) {
      console.warn("[currentUser] auth failure while fetching current user", err);
      return null;
    }

    console.warn("[currentUser] failed to fetch current user", err);
    throw err;
  }
}
