import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { AuthProvider, useAuth } from "../hooks/useAuth";
import { getCurrentUser } from "../utils/currentUser";
import {
  clearToken,
  getEmailVerified,
  getToken,
  saveEmailVerified,
  saveToken,
} from "../utils/token";

jest.mock("../utils/currentUser", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("../utils/token", () => ({
  clearToken: jest.fn(),
  getEmailVerified: jest.fn(),
  getToken: jest.fn(),
  saveEmailVerified: jest.fn(),
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
    (getEmailVerified as jest.Mock).mockResolvedValue(null);
    (saveEmailVerified as jest.Mock).mockResolvedValue(undefined);
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

    expect(saveEmailVerified).toHaveBeenCalledWith(true);
  });

  it("falls back to persisted emailVerified when API does not include it", async () => {
    (getToken as jest.Mock).mockResolvedValue("jwt-token");
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: 8,
      username: "alice",
      displayName: "Alice",
    });
    (getEmailVerified as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user?.emailVerified).toBe(true);
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

  it("setSession and setEmailVerified update persisted state", async () => {
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
    expect(saveEmailVerified).toHaveBeenCalledWith(false);
    expect(result.current.user).toEqual({
      id: 10,
      username: "bob",
      displayName: "Bob",
      emailVerified: false,
    });

    await act(async () => {
      await result.current.setEmailVerified(true);
    });

    expect(saveEmailVerified).toHaveBeenCalledWith(true);
    expect(result.current.user?.emailVerified).toBe(true);
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
