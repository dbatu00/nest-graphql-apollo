// utils/__tests__/graphqlFetch.spec.ts
import { graphqlFetch } from "../utils/graphqlFetch";

describe("graphqlFetch", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("should return data on successful response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: { foo: "bar" } }),
    });

    const result = await graphqlFetch<{ foo: string }>("query { foo }");
    expect(result).toEqual({ foo: "bar" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if response contains errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ errors: [{ message: "GraphQL failed" }] }),
    });

    await expect(graphqlFetch("query { foo }")).rejects.toThrow(
      "GraphQL failed"
    );
  });

  it("should throw generic error if errors array has no message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ errors: [{}] }),
    });

    await expect(graphqlFetch("query { foo }")).rejects.toThrow(
      "GraphQL request failed"
    );
  });

  it("should send correct body and headers", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: {} }),
    });

    const query = "query { test }";
    const variables = { a: 1 };
     const url = process.env.EXPO_PUBLIC_API_URL;

  if (!url) {
    throw new Error('EXPO_PUBLIC_API_URL is not defined');
  }

    await graphqlFetch(query, variables);

    expect(fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      })
    );
  });
});
