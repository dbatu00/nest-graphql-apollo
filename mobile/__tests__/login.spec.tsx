import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import Login from "../app/(auth)/login";
import { graphqlFetch } from "../utils/graphqlFetch";
import { LOGIN_MUTATION } from "../graphql/operations";
import { useAuth } from "../hooks/useAuth";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock("../utils/graphqlFetch", () => ({
  graphqlFetch: jest.fn(),
}));

jest.mock("../hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

describe("Login screen", () => {
  const setSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ setSession });
  });

  it("shows validation error when username or password is missing", () => {
    const { getAllByText, getByText } = render(<Login />);

    fireEvent.press(getAllByText("Login")[1]);

    expect(getByText("Username or email and password required")).toBeTruthy();
    expect(graphqlFetch).not.toHaveBeenCalled();
  });

  it("submits login, saves token, and navigates to feed", async () => {
    (graphqlFetch as jest.Mock).mockResolvedValueOnce({
      login: {
        token: "jwt-token",
        emailVerified: true,
        user: {
          id: 1,
          username: "deniz",
          displayName: "Deniz",
        },
      },
    });

    const { getByPlaceholderText, getAllByText } = render(<Login />);

    fireEvent.changeText(getByPlaceholderText("Username or Email"), "deniz");
    fireEvent.changeText(getByPlaceholderText("Password"), "secret123");
    fireEvent.press(getAllByText("Login")[1]);

    await waitFor(() => {
      expect(graphqlFetch).toHaveBeenCalledWith(LOGIN_MUTATION, {
        identifier: "deniz",
        password: "secret123",
      });
    });

    expect(setSession).toHaveBeenCalledWith({
      token: "jwt-token",
      emailVerified: true,
      user: {
        id: 1,
        username: "deniz",
        displayName: "Deniz",
      },
    });
    expect((router.replace as jest.Mock)).toHaveBeenCalledWith("/(app)/feed");
  });

  it("routes to verify mail when login payload is unverified", async () => {
    (graphqlFetch as jest.Mock).mockResolvedValueOnce({
      login: {
        token: "jwt-token",
        emailVerified: false,
        user: {
          id: 1,
          username: "deniz",
        },
      },
    });

    const { getByPlaceholderText, getAllByText } = render(<Login />);

    fireEvent.changeText(getByPlaceholderText("Username or Email"), "deniz@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "secret123");
    fireEvent.press(getAllByText("Login")[1]);

    await waitFor(() => {
      expect((router.replace as jest.Mock)).toHaveBeenCalledWith("/(auth)/verify-mail");
    });
  });

  it("shows graphql error message on login failure", async () => {
    (graphqlFetch as jest.Mock).mockRejectedValueOnce(new Error("Invalid credentials"));

    const { getByPlaceholderText, getAllByText, getByText } = render(<Login />);

    fireEvent.changeText(getByPlaceholderText("Username or Email"), "deniz");
    fireEvent.changeText(getByPlaceholderText("Password"), "wrongpass");
    fireEvent.press(getAllByText("Login")[1]);

    await waitFor(() => {
      expect(getByText("Invalid credentials")).toBeTruthy();
    });
  });

  it("navigates to signup screen", () => {
    const { getByText } = render(<Login />);

    fireEvent.press(getByText("Sign up"));

    expect((router.push as jest.Mock)).toHaveBeenCalledWith("/(auth)/signUp");
  });
});
