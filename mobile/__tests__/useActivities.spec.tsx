import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useActivities } from "../hooks/useActivities";
import { graphqlFetch } from "../utils/graphqlFetch";
import { getCurrentUser } from "../utils/currentUser";
import {
  ADD_POST_MUTATION,
  DELETE_POST_MUTATION,
  FEED_QUERY,
  FOLLOW_USER_MUTATION,
  LIKE_POST_MUTATION,
  UNFOLLOW_USER_MUTATION,
  UNLIKE_POST_MUTATION,
} from "../graphql/operations";
import { Activity } from "../types/Activity";

jest.mock("../utils/graphqlFetch", () => ({
  graphqlFetch: jest.fn(),
}));

jest.mock("../utils/currentUser", () => ({
  getCurrentUser: jest.fn(),
}));

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 1,
    type: "post",
    createdAt: "2026-01-01T00:00:00.000Z",
    active: true,
    actor: {
      id: 10,
      username: "alice",
      displayName: "Alice",
      followedByMe: false,
    },
    targetUser: {
      id: 11,
      username: "alice",
      displayName: "Alice",
      followedByMe: false,
    },
    targetPost: {
      id: 100,
      content: "hello",
      createdAt: "2026-01-01T00:00:00.000Z",
      user: {
        id: 10,
        username: "alice",
        followedByMe: false,
      },
      likedByMe: false,
      likesCount: 1,
    },
    ...overrides,
  };
}

describe("useActivities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 99, username: "deniz" });
    (graphqlFetch as jest.Mock).mockResolvedValue({ feed: [] });
  });

  it("loads feed and current user on mount", async () => {
    const feed = [makeActivity()];
    (graphqlFetch as jest.Mock).mockResolvedValueOnce({ feed });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentUserId).toBe(99);
    expect(result.current.activities).toEqual(feed);
    expect(graphqlFetch).toHaveBeenCalledWith(FEED_QUERY, {
      username: undefined,
      types: undefined,
    });
  });

  it("passes username and types params to feed query", async () => {
    const username = "alice";
    const types = ["post", "like"];

    renderHook(() => useActivities({ username, types }));

    await waitFor(() => {
      expect(graphqlFetch).toHaveBeenCalledWith(FEED_QUERY, {
        username,
        types,
      });
    });
  });

  it("sets currentUserId to null when current user resolution fails", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    (getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error("me failed"));

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentUserId).toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("sets error when initial feed request fails", async () => {
    (graphqlFetch as jest.Mock).mockRejectedValueOnce(new Error("feed failed"));

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Failed to load feed");
    });

    expect(result.current.activities).toEqual([]);
  });

  it("toggleFollowOptimistic updates local state and calls follow mutation", async () => {
    const feed = [makeActivity()];
    (graphqlFetch as jest.Mock).mockResolvedValueOnce({ feed });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFollowOptimistic("alice", true);
    });

    expect(result.current.activities[0].actor.followedByMe).toBe(true);
    expect(result.current.activities[0].targetUser?.followedByMe).toBe(true);
    expect(result.current.activities[0].targetPost?.user.followedByMe).toBe(true);
    expect(graphqlFetch).toHaveBeenCalledWith(FOLLOW_USER_MUTATION, {
      username: "alice",
    });
  });

  it("toggleFollowOptimistic uses unfollow mutation when shouldFollow is false", async () => {
    const feed = [makeActivity({ actor: { id: 10, username: "alice", followedByMe: true } as Activity["actor"] })];
    (graphqlFetch as jest.Mock).mockResolvedValueOnce({ feed });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFollowOptimistic("alice", false);
    });

    expect(graphqlFetch).toHaveBeenCalledWith(UNFOLLOW_USER_MUTATION, {
      username: "alice",
    });
  });

  it("toggleFollowOptimistic refreshes feed when mutation fails", async () => {
    const initialFeed = [makeActivity()];
    const serverTruthFeed = [
      makeActivity({
        actor: { id: 10, username: "alice", displayName: "Alice", followedByMe: false },
        targetUser: { id: 11, username: "alice", displayName: "Alice", followedByMe: false },
        targetPost: {
          id: 100,
          content: "hello",
          createdAt: "2026-01-01T00:00:00.000Z",
          user: { id: 10, username: "alice", followedByMe: false },
          likedByMe: false,
          likesCount: 1,
        },
      }),
    ];

    (graphqlFetch as jest.Mock).mockImplementation(async (query: string) => {
      if (query === FEED_QUERY) {
        return (graphqlFetch as jest.Mock).mock.calls.filter(([q]) => q === FEED_QUERY).length === 1
          ? { feed: initialFeed }
          : { feed: serverTruthFeed };
      }

      if (query === FOLLOW_USER_MUTATION) {
        throw new Error("follow failed");
      }

      throw new Error(`Unexpected GraphQL query in test: ${query}`);
    });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFollowOptimistic("alice", true);
    });

    await waitFor(() => {
      expect(result.current.activities[0].actor.followedByMe).toBe(false);
    });

    const feedCalls = (graphqlFetch as jest.Mock).mock.calls.filter(([query]) => query === FEED_QUERY).length;
    expect(feedCalls).toBe(2);
  });

  it("toggleLikeOptimistic updates local like state and calls like mutation", async () => {
    const feed = [makeActivity()];
    (graphqlFetch as jest.Mock).mockResolvedValueOnce({ feed });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleLikeOptimistic(100, false);
    });

    expect(result.current.activities[0].targetPost?.likedByMe).toBe(true);
    expect(result.current.activities[0].targetPost?.likesCount).toBe(2);
    expect(graphqlFetch).toHaveBeenCalledWith(LIKE_POST_MUTATION, { postId: 100 });
  });

  it("toggleLikeOptimistic removes row in likes-only view on unlike", async () => {
    const types = ["like"];
    const feed = [
      makeActivity({
        id: 2,
        type: "like",
        targetPost: {
          id: 200,
          content: "liked post",
          createdAt: "2026-01-01T00:00:00.000Z",
          user: { id: 10, username: "alice", followedByMe: false },
          likedByMe: true,
          likesCount: 3,
        },
      }),
    ];

    (graphqlFetch as jest.Mock).mockResolvedValueOnce({ feed });

    const { result } = renderHook(() => useActivities({ types }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleLikeOptimistic(200, true);
    });

    expect(result.current.activities).toHaveLength(0);
    expect(graphqlFetch).toHaveBeenCalledWith(UNLIKE_POST_MUTATION, { postId: 200 });
  });

  it("toggleLikeOptimistic refreshes feed when mutation fails", async () => {
    const post = {
      id: 100,
      content: "hello",
      createdAt: "2026-01-01T00:00:00.000Z",
      user: {
        id: 10,
        username: "alice",
        followedByMe: false,
      },
      likedByMe: false,
      likesCount: 1,
    };

    (graphqlFetch as jest.Mock).mockImplementation(async (query: string) => {
      if (query === FEED_QUERY) {
        return { feed: [makeActivity({ targetPost: { ...post } })] };
      }

      if (query === LIKE_POST_MUTATION) {
        throw new Error("like failed");
      }

      throw new Error(`Unexpected GraphQL query in test: ${query}`);
    });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleLikeOptimistic(100, false);
    });

    await waitFor(() => {
      expect(result.current.activities[0].targetPost?.likedByMe).toBe(false);
      expect(result.current.activities[0].targetPost?.likesCount).toBe(1);
    });

    const feedCalls = (graphqlFetch as jest.Mock).mock.calls.filter(([query]) => query === FEED_QUERY).length;
    expect(feedCalls).toBe(2);
  });

  it("deletePost removes matching rows and calls delete mutation", async () => {
    const feed = [
      makeActivity({ id: 1, targetPost: { ...makeActivity().targetPost!, id: 300 } }),
      makeActivity({ id: 2, targetPost: { ...makeActivity().targetPost!, id: 301 } }),
    ];

    (graphqlFetch as jest.Mock).mockResolvedValueOnce({ feed });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deletePost(300);
    });

    expect(result.current.activities).toHaveLength(1);
    expect(result.current.activities[0].targetPost?.id).toBe(301);
    expect(graphqlFetch).toHaveBeenCalledWith(DELETE_POST_MUTATION, { postId: 300 });
  });

  it("deletePost refreshes feed when mutation fails", async () => {
    const serverFeed = [makeActivity({ targetPost: { ...makeActivity().targetPost!, id: 300 } })];

    (graphqlFetch as jest.Mock).mockImplementation(async (query: string) => {
      if (query === FEED_QUERY) {
        return { feed: serverFeed };
      }

      if (query === DELETE_POST_MUTATION) {
        throw new Error("delete failed");
      }

      throw new Error(`Unexpected GraphQL query in test: ${query}`);
    });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deletePost(300);
    });

    await waitFor(() => {
      expect(result.current.activities).toHaveLength(1);
      expect(result.current.activities[0].targetPost?.id).toBe(300);
    });
  });

  it("publish ignores blank content", async () => {
    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callsAfterMount = (graphqlFetch as jest.Mock).mock.calls.length;

    await act(async () => {
      await result.current.publish("   ");
    });

    expect((graphqlFetch as jest.Mock).mock.calls.length).toBe(callsAfterMount);
  });

  it("publish sends add mutation and refreshes feed", async () => {
    (graphqlFetch as jest.Mock).mockImplementation(async (query: string) => {
      if (query === FEED_QUERY) {
        return { feed: [] };
      }

      if (query === ADD_POST_MUTATION) {
        return { addPost: { id: 1 } };
      }

      throw new Error(`Unexpected GraphQL query in test: ${query}`);
    });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const feedCallsBeforePublish = (graphqlFetch as jest.Mock).mock.calls.filter(
      ([query]) => query === FEED_QUERY
    ).length;

    await act(async () => {
      await result.current.publish("new post");
    });

    expect(graphqlFetch).toHaveBeenCalledWith(ADD_POST_MUTATION, { content: "new post" });

    const feedCallsAfterPublish = (graphqlFetch as jest.Mock).mock.calls.filter(
      ([query]) => query === FEED_QUERY
    ).length;

    expect(feedCallsAfterPublish).toBe(feedCallsBeforePublish + 1);
  });

  it("publish refreshes feed when add mutation fails", async () => {
    (graphqlFetch as jest.Mock).mockImplementation(async (query: string) => {
      if (query === FEED_QUERY) {
        return { feed: [] };
      }

      if (query === ADD_POST_MUTATION) {
        throw new Error("publish failed");
      }

      throw new Error(`Unexpected GraphQL query in test: ${query}`);
    });

    const { result } = renderHook(() => useActivities());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const feedCallsBeforePublish = (graphqlFetch as jest.Mock).mock.calls.filter(
      ([query]) => query === FEED_QUERY
    ).length;

    await act(async () => {
      await result.current.publish("hello world");
    });

    const feedCallsAfterPublish = (graphqlFetch as jest.Mock).mock.calls.filter(
      ([query]) => query === FEED_QUERY
    ).length;

    expect(feedCallsAfterPublish).toBe(feedCallsBeforePublish + 1);
  });
});
