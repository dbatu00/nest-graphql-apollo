import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import Index from "../app/index";
import { useAuth } from "../hooks/useAuth";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock("../hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

describe("Index route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not navigate while auth is loading", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: true });

    render(<Index />);

    await waitFor(() => {
      expect(useAuth).toHaveBeenCalled();
    });

    expect((router.replace as jest.Mock)).not.toHaveBeenCalled();
  });

  it("redirects to feed when user exists", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: "deniz" },
      loading: false,
    });

    render(<Index />);

    await waitFor(() => {
      expect((router.replace as jest.Mock)).toHaveBeenCalledWith("/(app)/feed");
    });
  });

  it("redirects to login when user is missing", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });

    render(<Index />);

    await waitFor(() => {
      expect((router.replace as jest.Mock)).toHaveBeenCalledWith("/(auth)/login");
    });
  });
});
