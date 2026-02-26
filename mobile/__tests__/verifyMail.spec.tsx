import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import VerifyMail from "../app/(auth)/verify-mail";
import { useAuth } from "../hooks/useAuth";
import { graphqlFetch } from "../utils/graphqlFetch";
import { RESEND_VERIFICATION_EMAIL_MUTATION } from "../graphql/operations";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock("../hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../utils/graphqlFetch", () => ({
  graphqlFetch: jest.fn(),
}));

describe("VerifyMail screen", () => {
  const refreshAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: "deniz", emailVerified: false },
      refreshAuth,
    });
    refreshAuth.mockResolvedValue({ id: 1, username: "deniz", emailVerified: false });
    (graphqlFetch as jest.Mock).mockResolvedValue({ resendMyVerificationEmail: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("redirects immediately when user is already verified", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: "deniz", emailVerified: true },
      refreshAuth,
    });

    render(<VerifyMail />);

    await waitFor(() => {
      expect((router.replace as jest.Mock)).toHaveBeenCalledWith("/(app)/feed");
    });
  });

  it("shows info when continue is pressed but account is still unverified", async () => {
    const { getByText } = render(<VerifyMail />);

    fireEvent.press(getByText("I verified, continue"));

    await act(async () => {
      jest.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(getByText("Not verified yet. Open the email link first, then tap continue.")).toBeTruthy();
    });
  });

  it("redirects to feed when continue sees verified state", async () => {
    refreshAuth.mockResolvedValueOnce({ id: 1, username: "deniz", emailVerified: true });

    const { getByText } = render(<VerifyMail />);

    fireEvent.press(getByText("I verified, continue"));

    await act(async () => {
      jest.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect((router.replace as jest.Mock)).toHaveBeenCalledWith("/(app)/feed");
    });
  });

  it("sends resend mutation and shows success info", async () => {
    const { getByText } = render(<VerifyMail />);

    fireEvent.press(getByText("I didn’t get the code"));

    await act(async () => {
      jest.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(graphqlFetch).toHaveBeenCalledWith(RESEND_VERIFICATION_EMAIL_MUTATION);
      expect(getByText("A new verification email has been sent.")).toBeTruthy();
    });
  });

  it("shows resend error when mutation fails", async () => {
    (graphqlFetch as jest.Mock).mockRejectedValueOnce(new Error("Too many resend requests"));

    const { getByText } = render(<VerifyMail />);

    fireEvent.press(getByText("I didn’t get the code"));

    await act(async () => {
      jest.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(getByText("Too many resend requests")).toBeTruthy();
    });
  });

  it("polls refreshAuth periodically while waiting on verify page", async () => {
    render(<VerifyMail />);

    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    expect(refreshAuth).toHaveBeenCalled();
  });
});
