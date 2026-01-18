import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { commonStyles } from "../../styles/common";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={[commonStyles.container, commonStyles.center]}>
      <Text style={commonStyles.title}>Login</Text>

      <View style={{ width: "100%", maxWidth: 320 }}>
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

        <Pressable
  style={({ pressed }) => [
    commonStyles.button,
    {
      alignSelf: "center",
      width: 200,          // 👈 centered button width
      marginTop: 8,
    },
    pressed && { opacity: 0.85 },
  ]}
  onPress={() => router.replace("/(app)/posts")}
>
  <Text style={commonStyles.buttonText}>Login</Text>
</Pressable>

        <Pressable
          onPress={() => router.push("/(auth)/signUp")}
          style={{ marginTop: 12, alignItems: "center" }}
        >
          <Text>Don’t have an account? Sign up</Text>
        </Pressable>
      </View>
    </View>
  );
}
