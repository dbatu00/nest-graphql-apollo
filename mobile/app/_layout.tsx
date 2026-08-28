import { Redirect, Stack, useSegments } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

export default function Layout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  const inAuthGroup = segments[0] === "(auth)";
  const authLeaf = segments[1] as string | undefined;
  const onVerifyMailPage = inAuthGroup && authLeaf === "verify-mail";

  if (!user && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user && !user.emailVerified && !onVerifyMailPage) {
    return <Redirect href="/(auth)/verify-mail" />;
  }

  if (user && user.emailVerified && inAuthGroup) {
    return <Redirect href="/(app)/feed" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

function AuthLoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
    >
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 12, fontSize: 16, color: "#475569" }}>
        Loading session...
      </Text>
    </View>
  );
}