import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { resendMyVerificationLink } from "@/graphql/client";
import { useAuth } from "@/hooks/useAuth";
import { EmailSendResult } from "@/types/Auth";
import { AppLogo } from "@/components/common/AppLogo";
import { commonStyles } from "@/styles/common";

const MIN_ACTION_MS = 900;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function VerifyMail() {
  const { user, refreshAuth } = useAuth();
  const resendSuccessMessage = "Verification link sent. Please check your email.";
  const [checking, setChecking] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (user.emailVerified) {
      router.replace("/(app)/feed");
      return;
    }

    const intervalId = setInterval(() => {
      void refreshAuth();
    }, 4000);

    return () => clearInterval(intervalId);
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

      if (refreshedUser?.emailVerified) {
        router.replace("/(app)/feed");
        return;
      }

      setInfo("Not verified yet. Open the email link first, then tap continue.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not check verification status");
    } finally {
      setChecking(false);
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

      setInfo(messages[resendStatus] ?? "Unknown status");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not resend verification email");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={[commonStyles.container, commonStyles.pageGutter, { backgroundColor: "#f3f4f6", justifyContent: "center" }]}>
      <View style={{ alignSelf: "center", width: "100%", maxWidth: 520 }}>
        <AppLogo subtitle="One more step" />
        <Text style={{ fontSize: 42, fontWeight: "800", color: "#0f172a", marginBottom: 10 }}>Verify your email</Text>

        <Text style={{ fontSize: 17, color: "#111827", marginBottom: 28, lineHeight: 24 }}>
          Open the verification link we sent to your email. We’ll move you to feed once your account is verified.
        </Text>

        <Pressable
          onPress={checkVerificationStatus}
          disabled={checking}
          style={{
            height: 58,
            borderRadius: 999,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#1665d8",
            marginBottom: 14,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>
            {checking ? "Checking..." : "I verified, continue"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleResend}
          disabled={resendLoading}
          style={{
            height: 58,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "#cbd5e1",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ color: "#111827", fontSize: 26, fontWeight: "500" }}>
            {resendLoading ? "Sending..." : "I didn’t get the code"}
          </Text>
        </Pressable>

        {error ? (
          <Text style={{ color: "#dc2626", marginTop: 12, textAlign: "center", fontSize: 16 }}>{error}</Text>
        ) : null}

        {info ? (
          <Text
            style={{
              color: info === resendSuccessMessage ? "#059669" : "#d97706",
              marginTop: 12,
              textAlign: "center",
              fontSize: 16,
            }}
          >
            {info}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
