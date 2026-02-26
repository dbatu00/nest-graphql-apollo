import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import SignUp from "../app/(auth)/signUp";
import { graphqlFetch } from "../utils/graphqlFetch";
import { SIGNUP_MUTATION } from "../graphql/operations";
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

describe("SignUp screen", () => {
  const setSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ setSession });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows validation error when required fields are missing", () => {
    const { getAllByText, getByText } = render(<SignUp />);

    fireEvent.press(getAllByText("Sign Up")[1]);

    expect(getByText("All fields are required")).toBeTruthy();
    expect(graphqlFetch).not.toHaveBeenCalled();
  });

  it("shows validation error when passwords do not match", () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(<SignUp />);

    fireEvent.changeText(getByPlaceholderText("Username"), "deniz");
    fireEvent.changeText(getByPlaceholderText("Email"), "deniz@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "secret1");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "secret2");
    fireEvent.press(getAllByText("Sign Up")[1]);

    expect(getByText("Passwords do not match")).toBeTruthy();
    expect(graphqlFetch).not.toHaveBeenCalled();
  });

  it("submits signup and redirects to verify screen after delay", async () => {
    jest.useFakeTimers();
    (graphqlFetch as jest.Mock).mockResolvedValueOnce({
      signUp: {
        user: { id: 1, username: "deniz" },
        token: "signup-token",
        emailVerified: false,
      },
    });

    const { getByPlaceholderText, getAllByText, getByText } = render(<SignUp />);

    fireEvent.changeText(getByPlaceholderText("Username"), "deniz");
    fireEvent.changeText(getByPlaceholderText("Email"), "deniz@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "secret");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "secret");
    fireEvent.press(getAllByText("Sign Up")[1]);

    await waitFor(() => {
      expect(graphqlFetch).toHaveBeenCalledWith(SIGNUP_MUTATION, {
        username: "deniz",
        email: "deniz@example.com",
        password: "secret",
      });
    });

    expect(setSession).toHaveBeenCalledWith({
      token: "signup-token",
      emailVerified: false,
      user: { id: 1, username: "deniz" },
    });

    expect(getByText("Signup successful. Redirecting…")).toBeTruthy();

    jest.advanceTimersByTime(600);

    expect((router.replace as jest.Mock)).toHaveBeenCalledWith("/(auth)/verify-mail");
  });

  it("navigates back to login", () => {
    const { getByText } = render(<SignUp />);

    fireEvent.press(getByText("Back to login"));

    expect((router.push as jest.Mock)).toHaveBeenCalledWith("/(auth)/login");
  });

  it("shows graphql error message on signup failure", async () => {
    (graphqlFetch as jest.Mock).mockRejectedValueOnce(new Error("Sign up failed"));

    const { getByPlaceholderText, getAllByText, getByText } = render(<SignUp />);

    fireEvent.changeText(getByPlaceholderText("Username"), "deniz");
    fireEvent.changeText(getByPlaceholderText("Email"), "deniz@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "secret");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "secret");
    fireEvent.press(getAllByText("Sign Up")[1]);

    await waitFor(() => {
      expect(getByText("Sign up failed")).toBeTruthy();
    });
  });
});
