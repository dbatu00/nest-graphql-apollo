import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import { commonStyles } from "../../styles/common";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { LOGIN_MUTATION } from "@/graphql/operations";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { setSession } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!username || !password) {
      setError("Username and password required");
      return;
    }

    setLoading(true);

    try {
      const res = await graphqlFetch<{
        login: {
          token: string;
          emailVerified: boolean;
          user: {
            id: number;
            username: string;
            displayName?: string;
          };
        };
      }>(LOGIN_MUTATION, { username, password });

      await setSession({
        token: res.login.token,
        user: res.login.user,
        emailVerified: res.login.emailVerified,
      });

      if (res.login.emailVerified) {
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
          placeholder="Username"
          placeholderTextColor="#d1d5db"
          value={username}
          onChangeText={setUsername}
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
