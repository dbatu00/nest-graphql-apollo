import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { ActivityRow } from "../components/feed/ActivityRow";
import { graphqlFetch } from "../utils/graphqlFetch";
import { GET_LIKED_USERS_QUERY } from "../graphql/operations";
import { Activity } from "../types/Activity";

jest.mock("../utils/graphqlFetch", () => ({
  graphqlFetch: jest.fn(),
}));

jest.mock("@/components/common/ProfileLink", () => ({
  ProfileLink: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/user/UserRow", () => ({
  UserRow: ({ user, onToggleFollow, onDelete, onProfileNavigate }: any) => {
    const ReactNative = require("react-native");
    const Pressable = ReactNative.Pressable;
    const Text = ReactNative.Text;

    return (
      <>
        <Text>{`UserRow:${user.username}`}</Text>

        {onToggleFollow && (
          <Pressable
            onPress={() => onToggleFollow(user.username, !(user.followedByMe ?? false))}
          >
            <Text>{`toggle-${user.username}`}</Text>
          </Pressable>
        )}

        {onDelete && (
          <Pressable onPress={() => onDelete(user.id)}>
            <Text>{`delete-${user.id}`}</Text>
          </Pressable>
        )}

        {onProfileNavigate && (
          <Pressable onPress={onProfileNavigate}>
            <Text>{`navigate-${user.username}`}</Text>
          </Pressable>
        )}
      </>
    );
  },
}));

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 1,
    type: "like",
    createdAt: "2026-01-01T00:00:00.000Z",
    active: true,
    actor: {
      id: 20,
      username: "bob",
      displayName: "Bob",
      followedByMe: false,
    },
    targetUser: {
      id: 21,
      username: "charlie",
      displayName: "Charlie",
      followedByMe: false,
    },
    targetPost: {
      id: 42,
      content: "hello world",
      createdAt: "2026-01-01T00:00:00.000Z",
      user: {
        id: 10,
        username: "alice",
        followedByMe: false,
      },
      likedByMe: false,
      likesCount: 7,
    },
    ...overrides,
  };
}

describe("ActivityRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls onToggleLike with post id and liked state", async () => {
    const onToggleLike = jest.fn().mockResolvedValue(undefined);

    const { getByText } = render(
      <ActivityRow activity={makeActivity()} onToggleLike={onToggleLike} />
    );

    fireEvent.press(getByText("♥"));

    expect(onToggleLike).toHaveBeenCalledWith(42, false);
  });

  it("loads liked users in modal and forwards follow toggles", async () => {
    const onToggleFollow = jest.fn().mockResolvedValue(undefined);
    (graphqlFetch as jest.Mock).mockResolvedValueOnce({
      post: {
        likedUsers: [
          {
            id: 101,
            username: "dora",
            displayName: "Dora",
            followedByMe: false,
          },
        ],
      },
    });

    const { getByText } = render(
      <ActivityRow
        activity={makeActivity()}
        currentUserId={99}
        onToggleLike={jest.fn().mockResolvedValue(undefined)}
        onToggleFollow={onToggleFollow}
      />
    );

    fireEvent.press(getByText("7"));

    await waitFor(() => {
      expect(graphqlFetch).toHaveBeenCalledWith(GET_LIKED_USERS_QUERY, { postId: 42 });
    });

    expect(getByText("Liked by")).toBeTruthy();
    expect(getByText("UserRow:dora")).toBeTruthy();

    fireEvent.press(getByText("toggle-dora"));

    await waitFor(() => {
      expect(onToggleFollow).toHaveBeenCalledWith("dora", true);
    });
  });

  it("handles liked-users fetch failure by showing empty modal list", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    (graphqlFetch as jest.Mock).mockRejectedValueOnce(new Error("liked users failed"));

    const { getByText, queryByText } = render(
      <ActivityRow
        activity={makeActivity()}
        onToggleLike={jest.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.press(getByText("7"));

    await waitFor(() => {
      expect(graphqlFetch).toHaveBeenCalledWith(GET_LIKED_USERS_QUERY, { postId: 42 });
    });

    expect(getByText("Liked by")).toBeTruthy();
    expect(queryByText("UserRow:dora")).toBeNull();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("closes liked-users modal when Close is pressed", async () => {
    (graphqlFetch as jest.Mock).mockResolvedValueOnce({
      post: { likedUsers: [] },
    });

    const { getByText, queryByText } = render(
      <ActivityRow
        activity={makeActivity()}
        onToggleLike={jest.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.press(getByText("7"));

    await waitFor(() => {
      expect(getByText("Liked by")).toBeTruthy();
    });

    fireEvent.press(getByText("Close"));

    await waitFor(() => {
      expect(queryByText("Liked by")).toBeNull();
    });
  });

  it("wires owner delete action to onDeletePost", async () => {
    const onDeletePost = jest.fn();

    const { getByText } = render(
      <ActivityRow
        activity={makeActivity()}
        currentUserId={10}
        onDeletePost={onDeletePost}
        onToggleLike={jest.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.press(getByText("delete-10"));

    expect(onDeletePost).toHaveBeenCalledWith(42);
  });

  it("does not render like actions when onToggleLike is not provided", () => {
    const { queryByText } = render(
      <ActivityRow activity={makeActivity()} />
    );

    expect(queryByText("♥")).toBeNull();
    expect(queryByText("7")).toBeNull();
  });

  it("renders follow activity header when targetPost is absent", () => {
    const followActivity = makeActivity({
      type: "follow",
      actor: {
        id: 31,
        username: "mike",
        displayName: "Mike",
        followedByMe: false,
      },
      targetUser: {
        id: 32,
        username: "nina",
        displayName: "Nina",
        followedByMe: false,
      },
      targetPost: undefined,
    });

    const { getByText, queryByText } = render(
      <ActivityRow activity={followActivity} />
    );

    expect(getByText(/mike/i)).toBeTruthy();
    expect(getByText(/followed/i)).toBeTruthy();
    expect(getByText(/nina/i)).toBeTruthy();
    expect(queryByText("♥")).toBeNull();
  });
});
