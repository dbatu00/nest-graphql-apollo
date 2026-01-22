import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useProfile } from "@/hooks/useProfile";
import { commonStyles } from "@/styles/common";

export default function Profile() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { profile, posts, loading } = useProfile(username!);

  if (loading) return <Text>Loading…</Text>;
  if (!profile) return <Text>User not found</Text>;

  return (
    <View style={commonStyles.container}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        {profile.displayName ?? profile.username}
      </Text>

      <Text style={{ color: "#666", marginBottom: 16 }}>
        @{profile.username}
      </Text>

      {posts.map(post => (
        <View key={post.id} style={{ marginBottom: 16 }}>
          <Text>{post.content}</Text>
          <Text style={{ fontSize: 12, color: "#999" }}>
            {new Date(post.createdAt).toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );
}
