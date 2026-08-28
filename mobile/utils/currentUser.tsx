import { getMe } from "@/graphql/client";
import { isAuthGraphQLError } from "@/utils/graphqlFetch";

const CURRENT_USER_MAX_RETRIES = 2;
const CURRENT_USER_BASE_BACKOFF_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCurrentUser() {
  for (let attempt = 0; attempt <= CURRENT_USER_MAX_RETRIES; attempt += 1) {
    const hasMoreRetries = attempt < CURRENT_USER_MAX_RETRIES;

    try {
      return await getMe();
    } catch (err: unknown) {
      if (isAuthGraphQLError(err)) {
        console.warn("[currentUser] auth failure while fetching current user", err);
        return null;
      }

      console.warn("[currentUser] failed to fetch current user", err);

      if (!hasMoreRetries) {
        throw err;
      }

      const backoffMs = CURRENT_USER_BASE_BACKOFF_MS * (2 ** attempt);

      console.warn(
        `[currentUser] retrying getCurrentUser in ${backoffMs}ms (retry ${attempt + 1}/${CURRENT_USER_MAX_RETRIES})`
      );

      await sleep(backoffMs);
    }
  }

  throw new Error("getCurrentUser retry loop ended unexpectedly");
}
