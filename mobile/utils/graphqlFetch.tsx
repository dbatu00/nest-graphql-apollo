import { getToken } from "@/utils/token";

type GraphQLErrorItem = {
  message?: string;
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLErrorItem[];
};

export class GraphQLRequestError extends Error {
  readonly errors: GraphQLErrorItem[];
  readonly status: number;

  constructor(message: string, errors: GraphQLErrorItem[] = [], status = 200) {
    super(message);
    this.name = "GraphQLRequestError";
    this.errors = errors;
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseGraphQLResponse<T>(payload: unknown): GraphQLResponse<T> {
  if (!isRecord(payload)) {
    throw new GraphQLRequestError("Invalid GraphQL response format");
  }

  const errors = Array.isArray(payload.errors)
    ? (payload.errors as GraphQLErrorItem[])
    : undefined;

  return {
    data: payload.data as T | undefined,
    errors,
  };
}

export async function graphqlFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const url = process.env.EXPO_PUBLIC_API_URL;

  if (!url) {
    throw new Error("EXPO_PUBLIC_API_URL is not defined");
  }

  const token = await getToken();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    const status = res.status;

    if (!res.ok) {
      throw new GraphQLRequestError(`HTTP request failed (${status})`, [], status);
    }

    const rawPayload = await res.json();
    const response = parseGraphQLResponse<T>(rawPayload);

    // GraphQL can return HTTP 200 while still carrying resolver errors.
    if (response.errors?.length) {
      const firstMessage = response.errors[0]?.message;
      throw new GraphQLRequestError(firstMessage || "GraphQL request failed", response.errors, status);
    }

    if (response.data === undefined) {
      throw new GraphQLRequestError("GraphQL response did not include data", [], status);
    }

    return response.data;
  } catch (err: unknown) {
    console.error("[graphqlFetch] request failed", err);
    throw err;
  }
}
