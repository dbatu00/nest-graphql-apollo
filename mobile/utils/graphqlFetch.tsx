import { getToken } from "@/utils/token";

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

    const data = await res.json();

    // GraphQL can return HTTP 200 while still carrying resolver errors.
    if (data.errors) {
      throw new Error(data.errors[0]?.message || "GraphQL request failed");
    }

    return data.data as T;
  } catch (err: unknown) {
    console.error("[graphqlFetch] request failed", err);
    throw err;
  }
}
