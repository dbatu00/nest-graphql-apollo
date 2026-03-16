import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { AuthProvider, useAuth } from "../hooks/useAuth";
import { getCurrentUser } from "../utils/currentUser";
import {
  clearToken,
  getToken,
  saveToken,
} from "../utils/token";

jest.mock("../utils/currentUser", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("../utils/token", () => ({
  clearToken: jest.fn(),
  getToken: jest.fn(),
  saveToken: jest.fn(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getToken as jest.Mock).mockResolvedValue(null);
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    (saveToken as jest.Mock).mockResolvedValue(undefined);
    (clearToken as jest.Mock).mockResolvedValue(undefined);
  });

  it("keeps user null when token is missing", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("hydrates user from current user endpoint when token exists", async () => {
    (getToken as jest.Mock).mockResolvedValue("jwt-token");
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: 7,
      username: "deniz",
      displayName: "Deniz",
      emailVerified: true,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual({
        id: 7,
        username: "deniz",
        displayName: "Deniz",
        emailVerified: true,
      });
    });
  });

  it("clears token and user when current user fetch returns null", async () => {
    (getToken as jest.Mock).mockResolvedValue("jwt-token");
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(clearToken).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
  });

  it("preserves session when refreshAuth hits transient failure", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.setSession({
        token: "new-token",
        user: { id: 10, username: "bob" },
        emailVerified: true,
      });
    });

    (getToken as jest.Mock).mockResolvedValue("new-token");
    (getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error("network failed"));

    await act(async () => {
      const refreshed = await result.current.refreshAuth();
      expect(refreshed).toEqual({
        id: 10,
        username: "bob",
        displayName: undefined,
        emailVerified: true,
      });
    });

    expect(clearToken).not.toHaveBeenCalled();
    expect(result.current.user).toEqual({
      id: 10,
      username: "bob",
      displayName: undefined,
      emailVerified: true,
    });
  });

  it("setSession updates token-backed auth state", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.setSession({
        token: "new-token",
        user: { id: 10, username: "bob", displayName: "Bob" },
        emailVerified: false,
      });
    });

    expect(saveToken).toHaveBeenCalledWith("new-token");
    expect(result.current.user).toEqual({
      id: 10,
      username: "bob",
      displayName: "Bob",
      emailVerified: false,
    });
  });

  it("logout clears user state", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.setSession({
        token: "new-token",
        user: { id: 10, username: "bob" },
        emailVerified: true,
      });
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(clearToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
