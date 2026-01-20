import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { commonStyles } from "@/styles/common";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError("");

    if (!username || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await graphqlFetch(
        `
        mutation SignUp($username: String!, $password: String!) {
          signUp(username: $username, password: $password) {
            user { id }
          }
        }
        `,
        { username, password }
      );

      setSuccess(true);

      // Delay, then redirect to login
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[commonStyles.container, commonStyles.center]}>
      <Text style={commonStyles.title}>Sign Up</Text>

      <View style={{ width: 260 }}>
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={commonStyles.input}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={commonStyles.input}
        />

        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={commonStyles.input}
        />

        <Pressable
          style={commonStyles.button}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={commonStyles.buttonText}>
            {loading ? "Signing up..." : "Sign Up"}
          </Text>
        </Pressable>

        {error ? (
          <Text style={{ color: "red", marginTop: 10, textAlign: "center" }}>
            {error}
          </Text>
        ) : null}

        {success ? (
          <Text style={{ color: "green", marginTop: 10, textAlign: "center" }}>
            Signup successful. Redirecting to login…
          </Text>
        ) : null}
      </View>
    </View>
  );
}
