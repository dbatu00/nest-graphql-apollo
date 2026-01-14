import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { commonStyles } from "../../styles/common";

export default function Login() {
  return (
    <View style={[commonStyles.container, commonStyles.center]}>
      <Text style={commonStyles.title}>Login</Text>

      <Pressable
        style={commonStyles.button}
        onPress={() => router.replace("/(app)/posts")}
      >
        <Text style={commonStyles.buttonText}>Fake Login</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/signUp")}>
        <Text style={{ marginTop: 12 }}>Sign up</Text>
      </Pressable>
    </View>
  );
}
