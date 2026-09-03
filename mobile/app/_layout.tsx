import { Redirect, Stack, useSegments } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { I18nProvider, useI18n } from "@/hooks/useI18n";
import { authLoadingStyles as styles } from "@/styles";

export default function Layout() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </I18nProvider>
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
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>
        {t("app.loadingSession")}
      </Text>
    </View>
  );
}