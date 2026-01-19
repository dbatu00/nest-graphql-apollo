import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import { commonStyles } from "../../styles/common";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { saveToken } from "@/utils/token";

export default function Login() {
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
          user: {
            id: number;
            name: string;
          };
        };
      }>(
        `
        mutation Login($username: String!, $password: String!) {
          login(username: $username, password: $password) {
            token
            user {
              id
              name
            }
          }
        }
        `,
        { username, password }
      );

      // store access token (web-only for now)
      saveToken(res.login.token);

      // navigate to app
      router.replace("/(app)/posts");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
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
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 6,
            padding: 10,
            marginBottom: 12,
          }}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 6,
            padding: 10,
            marginBottom: 16,
          }}
        />

        <View style={{ alignItems: "center" }}>
          <Pressable
            style={commonStyles.button}
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
              color: "red",
              marginTop: 10,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={() => router.push("/(auth)/signUp")}
          style={{ marginTop: 16 }}
        >
          <Text style={{ textAlign: "center" }}>Sign up</Text>
        </Pressable>
      </View>
    </View>
  );
}
