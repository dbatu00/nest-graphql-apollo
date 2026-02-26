import { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'shadow* style props are deprecated',  // boxShadow warning
  'props.pointerEvents is deprecated',   // pointerEvents warning
]);

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user?.emailVerified) {
      router.replace("/(app)/feed");
    } else if (user && !user.emailVerified) {
      router.replace("/(auth)/verify-mail" as never);
    } else {
      router.replace("/(auth)/login");
    }
  }, [user, loading]);

  return null;
}
