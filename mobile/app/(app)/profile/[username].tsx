import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { commonStyles } from "@/styles/common";

type Tab = "posts" | "followers" | "following" | "likes" | "shares";

export default function Profile() {
  const { username } = useLocalSearchParams<{ username: string }>();

  const {
    profile,
    posts = [],
    followers,
    following,
    fetchFollowers,
    fetchFollowing,
    loading,
  } = useProfile(username!);

  const [activeTab, setActiveTab] = useState<Tab>("posts");

  useEffect(() => {
    if (activeTab === "followers") {
      fetchFollowers();
    }
    if (activeTab === "following") {
      fetchFollowing();
    }
  }, [activeTab, fetchFollowers, fetchFollowing]);

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

      {/* POSTS */}
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

      {/* FOLLOWERS */}
      {activeTab === "followers" && followers.length === 0 && (
        <Text style={{ color: "#999", marginTop: 12 }}>
          No followers yet
        </Text>
      )}

      {activeTab === "followers" &&
        followers.map(user => (
          <View key={user.id} style={{ marginBottom: 12 }}>
            <Text>@{user.username}</Text>
          </View>
        ))}

      {/* FOLLOWING */}
      {activeTab === "following" && following.length === 0 && (
        <Text style={{ color: "#999", marginTop: 12 }}>
          Not following anyone yet
        </Text>
      )}

      {activeTab === "following" &&
        following.map(user => (
          <View key={user.id} style={{ marginBottom: 12 }}>
            <Text>@{user.username}</Text>
          </View>
        ))}
    </View>
  );
}
