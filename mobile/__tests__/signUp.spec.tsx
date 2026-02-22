import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import SignUp from "../app/(auth)/signUp";
import { graphqlFetch } from "../utils/graphqlFetch";
import { SIGNUP_MUTATION } from "../graphql/operations";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock("../utils/graphqlFetch", () => ({
  graphqlFetch: jest.fn(),
}));

describe("SignUp screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    fireEvent.changeText(getByPlaceholderText("Password"), "secret1");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "secret2");
    fireEvent.press(getAllByText("Sign Up")[1]);

    expect(getByText("Passwords do not match")).toBeTruthy();
    expect(graphqlFetch).not.toHaveBeenCalled();
  });

  it("submits signup and redirects to login after delay", async () => {
    jest.useFakeTimers();
    (graphqlFetch as jest.Mock).mockResolvedValueOnce({
      signUp: {
        user: { id: 1, username: "deniz" },
      },
    });

    const { getByPlaceholderText, getAllByText, getByText } = render(<SignUp />);

    fireEvent.changeText(getByPlaceholderText("Username"), "deniz");
    fireEvent.changeText(getByPlaceholderText("Password"), "secret");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "secret");
    fireEvent.press(getAllByText("Sign Up")[1]);

    await waitFor(() => {
      expect(graphqlFetch).toHaveBeenCalledWith(SIGNUP_MUTATION, {
        username: "deniz",
        password: "secret",
      });
    });

    expect(getByText("Signup successful. Redirecting to login…")).toBeTruthy();

    jest.advanceTimersByTime(2000);

    expect((router.replace as jest.Mock)).toHaveBeenCalledWith("/(auth)/login");
  });

  it("shows graphql error message on signup failure", async () => {
    (graphqlFetch as jest.Mock).mockRejectedValueOnce(new Error("Sign up failed"));

    const { getByPlaceholderText, getAllByText, getByText } = render(<SignUp />);

    fireEvent.changeText(getByPlaceholderText("Username"), "deniz");
    fireEvent.changeText(getByPlaceholderText("Password"), "secret");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "secret");
    fireEvent.press(getAllByText("Sign Up")[1]);

    await waitFor(() => {
      expect(getByText("Sign up failed")).toBeTruthy();
    });
  });
});
