import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import { commonStyles } from "../../styles/common";
import { login } from "@/graphql/client";
import { useAuth } from "@/hooks/useAuth";

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
    <View style={[commonStyles.container, commonStyles.center]}>
      <Text style={commonStyles.title}>Login</Text>

      <View style={{ width: 260 }}>
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
          style={[commonStyles.input, { marginTop: 12 }]}
        />

        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Pressable
            style={[commonStyles.button, { width: 180, paddingVertical: 14 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={commonStyles.buttonText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <Text
            style={{
              color: "#dc2626",
              marginTop: 10,
              textAlign: "center",
              fontSize: 14,
            }}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={() => router.push("/(auth)/signUp")}
          style={{ marginTop: 16 }}
        >
          <Text style={{ textAlign: "center", color: "#2563eb", fontWeight: "500" }}>Sign up</Text>
        </Pressable>
      </View>
    </View>
  );
}
