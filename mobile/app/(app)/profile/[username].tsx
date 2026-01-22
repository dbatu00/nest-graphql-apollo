import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useProfile } from "@/hooks/useProfile";
import { commonStyles } from "@/styles/common";

export default function Profile() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { profile, loading, error } = useProfile(username!);

  if (loading) return <Text>Loading…</Text>;
  if (error || !profile) return <Text>User not found</Text>;

  return (
    <View style={commonStyles.container}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        {profile.displayName ?? profile.username}
      </Text>

      <Text style={{ color: "#666", marginBottom: 8 }}>
        @{profile.username}
      </Text>

      {profile.bio && (
        <Text style={{ marginBottom: 12 }}>{profile.bio}</Text>
      )}

      <Text style={{ color: "#999" }}>
        Joined {new Date(profile.createdAt).toDateString()}
      </Text>
    </View>
  );
}
