import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import { commonStyles } from "@/styles";
import { login } from "@/graphql/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLogo } from "@/components/common/AppLogo";
import { authFormStyles as styles } from "@/styles";

export default function Login() {
  const { setSession } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");


    if (!identifier || !password) {
      setError("Username or email and password required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const authPayload = await login(identifier, password);

      await setSession({
        token: authPayload.token,
        refreshToken: authPayload.refreshToken,
        user: authPayload.user,
        emailVerified: authPayload.emailVerified,
      });

      if (authPayload.emailVerified) {
        router.replace("/(app)/feed");
      } else {
        router.replace("/(auth)/verify-mail" as never);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[commonStyles.container, commonStyles.center, commonStyles.pageGutter]}>
      <AppLogo subtitle="Welcome back" />
      <Text style={commonStyles.title}>Login</Text>

      <View style={styles.formWrap}>
        <TextInput
          placeholder="Username or Email"
          placeholderTextColor="#d1d5db"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          style={commonStyles.input}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#d1d5db"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[commonStyles.input, styles.inputTopGap]}
        />

        <View style={styles.actionsCenter}>
          <Pressable
            style={[commonStyles.button, styles.submitButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={commonStyles.buttonText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <Text style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={() => router.push("/(auth)/signUp")}
          style={styles.navLinkWrap}
        >
          <Text style={styles.navLinkText}>Sign up</Text>
        </Pressable>
      </View>
    </View>
  );
}
