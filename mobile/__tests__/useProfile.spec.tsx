import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useProfile } from "../hooks/useProfile";
import { graphqlFetch } from "../utils/graphqlFetch";
import { getCurrentUser } from "../utils/currentUser";
import {
  FOLLOWERS_WITH_FOLLOW_STATE_QUERY,
  FOLLOWING_WITH_FOLLOW_STATE_QUERY,
  FOLLOW_USER_MUTATION,
  LIKED_POSTS_QUERY,
  UNFOLLOW_USER_MUTATION,
  USER_PROFILE_QUERY,
} from "../graphql/operations";

jest.mock("../utils/graphqlFetch", () => ({
  graphqlFetch: jest.fn(),
}));

jest.mock("../utils/currentUser", () => ({
  getCurrentUser: jest.fn(),
}));

function makeProfileResponse() {
  return {
    userByUsername: {
      id: 1,
      username: "alice",
      displayName: "Alice",
      bio: "bio",
      followersCount: 2,
      followingCount: 3,
      posts: [
        {
          id: 50,
          content: "hello",
          createdAt: "2026-01-01T00:00:00.000Z",
          user: {
            id: 1,
            username: "alice",
            followedByMe: false,
          },
        },
      ],
    },
  };
}

describe("useProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 99, username: "deniz" });
    (graphqlFetch as jest.Mock).mockImplementation(async (query: string) => {
      if (query === USER_PROFILE_QUERY) {
        return makeProfileResponse();
      }
      if (query === FOLLOW_USER_MUTATION || query === UNFOLLOW_USER_MUTATION) {
        return true;
      }
      throw new Error(`Unexpected GraphQL query in test: ${query}`);
    });
  });

  it("loads profile and posts on mount", async () => {
    const { result } = renderHook(() => useProfile("alice"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile?.username).toBe("alice");
    expect(result.current.posts).toHaveLength(1);
    expect(graphqlFetch).toHaveBeenCalledWith(USER_PROFILE_QUERY, { username: "alice" });
  });

  it("does not fetch profile when username is empty", async () => {
    const { result } = renderHook(() => useProfile(""));

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalled();
    });

    expect(graphqlFetch).not.toHaveBeenCalledWith(USER_PROFILE_QUERY, { username: "" });
    expect(result.current.profile).toBeNull();
    expect(result.current.posts).toEqual([]);
  });

  it("handles profile fetch failure by clearing profile/posts", async () => {
    (graphqlFetch as jest.Mock).mockRejectedValueOnce(new Error("profile failed"));

    const { result } = renderHook(() => useProfile("alice"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.posts).toEqual([]);
  });

  it("sets current user fallback to null when current user fetch fails", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    (getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error("me failed"));

    const { result } = renderHook(() => useProfile("alice"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFollow("target", true);
    });

    expect(graphqlFetch).not.toHaveBeenCalledWith(FOLLOW_USER_MUTATION, { username: "target" });
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("fetchLikedPosts populates likedPosts", async () => {
    const likedPosts = [
      {
        id: 70,
        content: "liked",
        createdAt: "2026-01-01T00:00:00.000Z",
        user: { id: 2, username: "target", followedByMe: false },
        likedByMe: true,
        likesCount: 3,
      },
    ];

    (graphqlFetch as jest.Mock).mockImplementation(async (query: string) => {
      if (query === USER_PROFILE_QUERY) return makeProfileResponse();
      if (query === LIKED_POSTS_QUERY) return { likedPosts };
      throw new Error(`Unexpected GraphQL query in test: ${query}`);
    });

    const { result } = renderHook(() => useProfile("alice"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.fetchLikedPosts();
    });

    expect(result.current.likedPosts).toEqual(likedPosts);
    expect(graphqlFetch).toHaveBeenCalledWith(LIKED_POSTS_QUERY, { username: "alice" });
  });

  it("fetchLikedPosts logs and keeps state when request fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    (graphqlFetch as jest.Mock).mockImplementation(async (query: string) => {
      if (query === USER_PROFILE_QUERY) return makeProfileResponse();
      if (query === LIKED_POSTS_QUERY) throw new Error("liked failed");
      throw new Error(`Unexpected GraphQL query in test: ${query}`);
    });

    const { result } = renderHook(() => useProfile("alice"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.fetchLikedPosts();
    });

    expect(result.current.likedPosts).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("fetchFollowers and fetchFollowing populate mapped rows", async () => {
    (graphqlFetch as jest.Mock).mockImplementation(async (query: string) => {
      if (query === USER_PROFILE_QUERY) return makeProfileResponse();
      if (query === FOLLOWERS_WITH_FOLLOW_STATE_QUERY) {
        return {
          followersWithFollowState: [
            {
              user: { id: 2, username: "target", displayName: "Target" },
              followedByMe: false,
            },
          ],
        };
      }
      if (query === FOLLOWING_WITH_FOLLOW_STATE_QUERY) {
        return {
          followingWithFollowState: [
            {
              user: { id: 3, username: "other", displayName: "Other" },
              followedByMe: true,
            },
          ],
        };
      }
      if (query === FOLLOW_USER_MUTATION) {
        return true;
      }
      throw new Error(`Unexpected GraphQL query in test: ${query}`);
    });

    const { result } = renderHook(() => useProfile("alice"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.fetchFollowers();
      await result.current.fetchFollowing();
    });

    expect(result.current.followers).toEqual([
      {
        user: { id: 2, username: "target", displayName: "Target" },
        followedByMe: false,
      },
    ]);
    expect(result.current.following).toEqual([
      {
        user: { id: 3, username: "other", displayName: "Other" },
        followedByMe: true,
      },
    ]);
  });

  it("fetchFollowers and fetchFollowing log and keep state when requests fail", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    (graphqlFetch as jest.Mock).mockImplementation(async (query: string) => {
      if (query === USER_PROFILE_QUERY) return makeProfileResponse();
      if (query === FOLLOWERS_WITH_FOLLOW_STATE_QUERY) throw new Error("followers failed");
      if (query === FOLLOWING_WITH_FOLLOW_STATE_QUERY) throw new Error("following failed");
      throw new Error(`Unexpected GraphQL query in test: ${query}`);
    });

    const { result } = renderHook(() => useProfile("alice"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.fetchFollowers();
      await result.current.fetchFollowing();
    });

    expect(result.current.followers).toEqual([]);
    expect(result.current.following).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("fetchLikedPosts/fetchFollowers/fetchFollowing return early when username is empty", async () => {
    const { result } = renderHook(() => useProfile(""));

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalled();
    });

    const callCountBefore = (graphqlFetch as jest.Mock).mock.calls.length;

    await act(async () => {
      await result.current.fetchLikedPosts();
      await result.current.fetchFollowers();
      await result.current.fetchFollowing();
    });

    const callCountAfter = (graphqlFetch as jest.Mock).mock.calls.length;
    expect(callCountAfter).toBe(callCountBefore);
  });

  it("toggleFollow returns early when target is current user", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValueOnce({ id: 99, username: "alice" });

    const { result } = renderHook(() => useProfile("alice"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFollow("alice", true);
    });

    expect(graphqlFetch).not.toHaveBeenCalledWith(FOLLOW_USER_MUTATION, { username: "alice" });
  });

  it("toggleFollow returns early when current user resolves to null", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useProfile("alice"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFollow("target", true);
    });

    expect(graphqlFetch).not.toHaveBeenCalledWith(FOLLOW_USER_MUTATION, { username: "target" });
  });

  it("toggleFollow applies optimistic updates and calls follow mutation", async () => {
    (graphqlFetch as jest.Mock).mockImplementation(async (query: string) => {
      if (query === USER_PROFILE_QUERY) return makeProfileResponse();
      if (query === FOLLOWERS_WITH_FOLLOW_STATE_QUERY) {
        return {
          followersWithFollowState: [
            { user: { id: 2, username: "target", displayName: "Target" }, followedByMe: false },
          ],
        };
      }
      if (query === FOLLOWING_WITH_FOLLOW_STATE_QUERY) {
        return {
          followingWithFollowState: [
            { user: { id: 2, username: "target", displayName: "Target" }, followedByMe: false },
          ],
        };
      }
      if (query === FOLLOW_USER_MUTATION) {
        return true;
      }
      throw new Error(`Unexpected GraphQL query in test: ${query}`);
    });

    const { result } = renderHook(() => useProfile("alice"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.fetchFollowers();
      await result.current.fetchFollowing();
      result.current.setLikedPosts([
        {
          id: 70,
          content: "liked",
          createdAt: "2026-01-01T00:00:00.000Z",
          user: { id: 2, username: "target", followedByMe: false },
          likedByMe: true,
          likesCount: 1,
        },
      ]);
    });

    await act(async () => {
      await result.current.toggleFollow("target", true);
    });

    expect(result.current.followers[0].followedByMe).toBe(true);
    expect(result.current.following[0].followedByMe).toBe(true);
    expect(result.current.likedPosts[0].user.followedByMe).toBe(true);
    expect(graphqlFetch).toHaveBeenCalledWith(FOLLOW_USER_MUTATION, { username: "target" });
  });

  it("toggleFollow rolls back optimistic updates when mutation fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    (graphqlFetch as jest.Mock).mockImplementation(async (query: string) => {
      if (query === USER_PROFILE_QUERY) return makeProfileResponse();
      if (query === FOLLOWERS_WITH_FOLLOW_STATE_QUERY) {
        return {
          followersWithFollowState: [
            { user: { id: 2, username: "target", displayName: "Target" }, followedByMe: false },
          ],
        };
      }
      if (query === FOLLOWING_WITH_FOLLOW_STATE_QUERY) {
        return {
          followingWithFollowState: [
            { user: { id: 2, username: "target", displayName: "Target" }, followedByMe: false },
          ],
        };
      }
      if (query === FOLLOW_USER_MUTATION) {
        throw new Error("follow failed");
      }
      throw new Error(`Unexpected GraphQL query in test: ${query}`);
    });

    const { result } = renderHook(() => useProfile("alice"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.fetchFollowers();
      await result.current.fetchFollowing();
      result.current.setLikedPosts([
        {
          id: 70,
          content: "liked",
          createdAt: "2026-01-01T00:00:00.000Z",
          user: { id: 2, username: "target", followedByMe: false },
          likedByMe: true,
          likesCount: 1,
        },
      ]);
    });

    await act(async () => {
      await result.current.toggleFollow("target", true);
    });

    expect(result.current.followers[0].followedByMe).toBe(false);
    expect(result.current.following[0].followedByMe).toBe(false);
    expect(result.current.likedPosts[0].user.followedByMe).toBe(false);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("toggleFollow uses unfollow mutation when shouldFollow is false", async () => {
    const { result } = renderHook(() => useProfile("alice"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFollow("target", false);
    });

    expect(graphqlFetch).toHaveBeenCalledWith(UNFOLLOW_USER_MUTATION, { username: "target" });
  });
});
