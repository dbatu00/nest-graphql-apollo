import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { resendMyVerificationLink } from "@/graphql/client";
import { useAuth } from "@/hooks/useAuth";
import { EmailSendResult } from "@/types/Auth";
import { AppLogo } from "@/components/common/AppLogo";
import {
  authFormStyles as authStyles,
  commonStyles,
  verifyMailStatusColorStyle,
  verifyMailStyles as styles,
} from "@/styles";

const MIN_ACTION_MS = 900;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function VerifyMail() {
  const { user, refreshAuth, logout } = useAuth();

  const resendSuccessMessage =
    "Verification link sent. Please check your email.";

  const [checking, setChecking] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const mountedRef = useRef(true);
  const refreshLockRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (user.emailVerified) {
      router.replace("/(app)/feed");
      return;
    }

    const intervalId = setInterval(() => {
      if (refreshLockRef.current) return;

      refreshLockRef.current = true;
      void refreshAuth().finally(() => {
        refreshLockRef.current = false;
      });
    }, 4000);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [user, refreshAuth]);

  const checkVerificationStatus = async () => {
    setError("");
    setInfo("");
    setChecking(true);

    const startTime = Date.now();

    try {
      const refreshedUser = await refreshAuth();

      const elapsedMs = Date.now() - startTime;
      if (elapsedMs < MIN_ACTION_MS) {
        await sleep(MIN_ACTION_MS - elapsedMs);
      }

      if (!mountedRef.current) return;

      if (refreshedUser?.emailVerified) {
        router.replace("/(app)/feed");
        return;
      }

      setInfo(
        "Not verified yet. Open the email link first, then tap continue."
      );
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setError(
        err instanceof Error
          ? err.message
          : "Could not check verification status"
      );
    } finally {
      if (mountedRef.current) {
        setChecking(false);
      }
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setResendLoading(true);

    const startTime = Date.now();

    try {
      const resendStatus = await resendMyVerificationLink();

      const messages: Record<EmailSendResult, string> = {
        SENT: "Verification link sent. Please check your email.",
        THROTTLED: "Please wait before requesting another email.",
        FAILED: "Could not deliver email right now. Try again later.",
        ALREADY_VERIFIED: "Your email is already verified",
      };

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_ACTION_MS) {
        await sleep(MIN_ACTION_MS - elapsed);
      }

      if (!mountedRef.current) return;

      setInfo(messages[resendStatus] ?? "Unknown status");
    } catch (err: unknown) {
      if (!mountedRef.current) return;

      setError(
        err instanceof Error
          ? err.message
          : "Could not resend verification email"
      );
    } finally {
      if (mountedRef.current) {
        setResendLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View
      style={[
        commonStyles.container,
        commonStyles.pageGutter,
        styles.containerTone,
      ]}
    >
      <View style={styles.inner}>
        <AppLogo subtitle="One more step" />

        <Text style={styles.title}>
          Verify your email
        </Text>

        <Text style={styles.description}>
          Open the verification link we sent to your email. We’ll move you to
          feed once your account is verified.
        </Text>

        <Pressable
          onPress={checkVerificationStatus}
          disabled={checking}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            {checking ? "Checking..." : "I verified, continue"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleResend}
          disabled={resendLoading}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            {resendLoading ? "Sending..." : "I didn’t get the code"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleLogout}
          style={authStyles.navLinkWrap}
        >
          <Text style={authStyles.navLinkText}>
            Back to login
          </Text>
        </Pressable>

        {error ? (
          <Text style={[styles.statusText, { color: "#dc2626" }]}>
            {error}
          </Text>
        ) : null}

        {info ? (
          <Text
            style={[
              styles.statusText,
              verifyMailStatusColorStyle(info === resendSuccessMessage),
            ]}
          >
            {info}
          </Text>
        ) : null}
      </View>
    </View>
  );
}