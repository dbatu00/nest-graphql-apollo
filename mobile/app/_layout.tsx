import { Stack } from "expo-router";
import { useEffect } from "react";
import { router, useSegments } from "expo-router";
import { LogBox } from 'react-native';
import { AuthProvider, useAuth } from "@/hooks/useAuth";

LogBox.ignoreLogs([
  'shadow*',
  'resizeMode',
]);

export default function Layout() {
  return (
    <AuthProvider>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const authLeaf = segments[1] as string | undefined;
    const onVerifyMailPage = inAuthGroup && authLeaf === "verify-mail";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (user && !user.emailVerified && !onVerifyMailPage) {
      router.replace("/(auth)/verify-mail" as never);
      return;
    }

    if (user && user.emailVerified && inAuthGroup) {
      router.replace("/(app)/feed");
    }
  }, [user, loading, segments]);

  return null;
}