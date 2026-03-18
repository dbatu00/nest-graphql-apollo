import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import { commonStyles } from "@/styles/common";
import { signUp } from "@/graphql/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLogo } from "@/components/common/AppLogo";

export default function SignUp() {
  const { setSession } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError("");
    setUsernameError("");
    setEmailError("");

    if (!username || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    const trimmedLowerCaseEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedLowerCaseEmail)) {
      setEmailError("Please enter a valid email");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const authPayload = await signUp(username, trimmedLowerCaseEmail, password);

      await setSession({
        token: authPayload.token,
        user: authPayload.user,
        emailVerified: authPayload.emailVerified,
      });

      setSuccess(true);

      setTimeout(() => {
        router.replace(authPayload.emailVerified ? "/(app)/feed" : ("/(auth)/verify-mail" as never));
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      if (msg.toLowerCase().includes("username")) setUsernameError(msg);
      else if (msg.toLowerCase().includes("email")) setEmailError(msg);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[commonStyles.container, commonStyles.center, commonStyles.pageGutter]}>
      <AppLogo subtitle="Create your account" />
      <Text style={commonStyles.title}>Sign Up</Text>

      <View style={{ width: "100%", maxWidth: 360 }}>
        <TextInput
          placeholder="Username"
          placeholderTextColor="#d1d5db"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={commonStyles.input}
        />
        {usernameError ? (
          <Text style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{usernameError}</Text>
        ) : null}

        <TextInput
          placeholder="Email"
          placeholderTextColor="#d1d5db"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[commonStyles.input, { marginTop: 12 }]}
        />
        {emailError ? (
          <Text style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{emailError}</Text>
        ) : null}

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

        <Pressable onPress={() => router.push("/(auth)/login")} style={{ marginTop: 16 }}>
          <Text style={{ textAlign: "center", color: "#2563eb", fontWeight: "500" }}>
            Back to login
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
