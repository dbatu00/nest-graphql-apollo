import { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "./(auth)/useAuth";

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user) {
      router.replace("/(app)/posts");
    } else {
      router.replace("/(auth)/login");
    }
  }, [user, loading]);

  return null;
}
