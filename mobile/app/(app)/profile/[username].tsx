// app/(app)/profile/[username].tsx

import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { commonStyles } from "@/styles/common";

type Tab = "posts" | "followers" | "following" | "likes" | "shares";

export default function Profile() {
  const { username } = useLocalSearchParams<{ username: string }>();

  const {
    profile,
    posts = [], // ✅ hard default
    loading,
  } = useProfile(username!);

  const [activeTab, setActiveTab] = useState<Tab>("posts");

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <Text>Loading…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={commonStyles.container}>
        <Text>User not found</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        {profile.displayName ?? profile.username}
      </Text>

      <Text style={{ color: "#666", marginBottom: 16 }}>
        @{profile.username}
      </Text>

      {/* Tabs */}
      <ProfileTabs active={activeTab} onChange={setActiveTab} />

      {/* Content */}
      {activeTab === "posts" && posts.length === 0 && (
        <Text style={{ color: "#999", marginTop: 12 }}>
          No posts yet
        </Text>
      )}

      {activeTab === "posts" &&
        posts.map(post => (
          <View key={post.id} style={{ marginBottom: 16 }}>
            <Text>{post.content}</Text>
            <Text style={{ fontSize: 12, color: "#999" }}>
              {new Date(post.createdAt).toLocaleString()}
            </Text>
          </View>
        ))}

      {activeTab !== "posts" && (
        <Text style={{ color: "#999", marginTop: 12 }}>
          {activeTab} — coming later
        </Text>
      )}
    </View>
  );
}
