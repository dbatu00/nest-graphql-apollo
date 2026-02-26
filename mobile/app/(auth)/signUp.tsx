import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { commonStyles } from "@/styles/common";
import { SIGNUP_MUTATION } from "@/graphql/operations";
import { useAuth } from "@/hooks/useAuth";

export default function SignUp() {
  const { setSession } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError("");

    if (!username || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await graphqlFetch<{
        signUp: {
          token: string;
          emailVerified: boolean;
          user: {
            id: number;
            username: string;
            displayName?: string;
          };
        };
      }>(SIGNUP_MUTATION, { username, email: email.trim().toLowerCase(), password });

      await setSession({
        token: res.signUp.token,
        user: res.signUp.user,
        emailVerified: res.signUp.emailVerified,
      });

      setSuccess(true);

      setTimeout(() => {
        router.replace(res.signUp.emailVerified ? "/(app)/feed" : ("/(auth)/verify-mail" as never));
      }, 600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
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
          placeholderTextColor="#d1d5db"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={commonStyles.input}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#d1d5db"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[commonStyles.input, { marginTop: 12 }]}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#d1d5db"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[commonStyles.input, { marginTop: 12 }]}
        />

        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#d1d5db"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={[commonStyles.input, { marginTop: 12 }]}
        />

        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Pressable
            style={[commonStyles.button, { width: 180, paddingVertical: 14 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={commonStyles.buttonText}>
              {loading ? "Signing up..." : "Sign Up"}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <Text style={{ color: "#dc2626", marginTop: 10, textAlign: "center", fontSize: 14 }}>
            {error}
          </Text>
        ) : null}

        {success ? (
          <Text style={{ color: "#059669", marginTop: 10, textAlign: "center", fontSize: 14 }}>
            Signup successful. Redirecting…
          </Text>
        ) : null}

        <Pressable
          onPress={() => router.push("/(auth)/login")}
          style={{ marginTop: 16 }}
        >
          <Text style={{ textAlign: "center", color: "#2563eb", fontWeight: "500" }}>
            Back to login
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
