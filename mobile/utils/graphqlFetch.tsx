export async function graphqlFetch<T>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const url = process.env.EXPO_PUBLIC_API_URL;

  if (!url) {
    throw new Error('EXPO_PUBLIC_API_URL is not defined');
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const data = await res.json();

  if (data.errors) {
    throw new Error(data.errors[0]?.message || "GraphQL request failed");
  }

  return data.data as T;
}
