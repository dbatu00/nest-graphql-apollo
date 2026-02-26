import React from "react";
import { render, waitFor } from "@testing-library/react-native";

import Layout from "../app/_layout";
import { useAuth } from "../hooks/useAuth";
import { router, useSegments } from "expo-router";

jest.mock("expo-router", () => ({
  Stack: () => null,
  router: {
    replace: jest.fn(),
  },
  useSegments: jest.fn(),
}));

jest.mock("../hooks/useAuth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn(),
}));

describe("Root layout auth gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSegments as jest.Mock).mockReturnValue(["(app)", "feed"]);
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });
  });

  it("does not redirect while loading", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: true });

    render(<Layout />);

    await waitFor(() => {
      expect(useAuth).toHaveBeenCalled();
    });

    expect((router.replace as jest.Mock)).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users to login", async () => {
    render(<Layout />);

    await waitFor(() => {
      expect((router.replace as jest.Mock)).toHaveBeenCalledWith("/(auth)/login");
    });
  });

  it("redirects unverified users to verify-mail", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: "deniz", emailVerified: false },
      loading: false,
    });

    render(<Layout />);

    await waitFor(() => {
      expect((router.replace as jest.Mock)).toHaveBeenCalledWith("/(auth)/verify-mail");
    });
  });

  it("allows unverified users on verify-mail route", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: "deniz", emailVerified: false },
      loading: false,
    });
    (useSegments as jest.Mock).mockReturnValue(["(auth)", "verify-mail"]);

    render(<Layout />);

    await waitFor(() => {
      expect(useSegments).toHaveBeenCalled();
    });

    expect((router.replace as jest.Mock)).not.toHaveBeenCalled();
  });

  it("redirects verified users out of auth group", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: "deniz", emailVerified: true },
      loading: false,
    });
    (useSegments as jest.Mock).mockReturnValue(["(auth)", "login"]);

    render(<Layout />);

    await waitFor(() => {
      expect((router.replace as jest.Mock)).toHaveBeenCalledWith("/(app)/feed");
    });
  });
});
