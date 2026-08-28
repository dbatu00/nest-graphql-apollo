import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";

export default function RootLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user.emailVerified) {
    return <Redirect href="/(auth)/verify-mail" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
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