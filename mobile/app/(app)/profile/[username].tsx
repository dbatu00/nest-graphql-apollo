import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useProfile } from "@/hooks/useProfile";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { UserRow } from "@/components/user/UserRow";
import { commonStyles } from "@/styles/common";
import { getCurrentUser } from "@/utils/currentUser";

type Tab = "posts" | "followers" | "following" | "likes" | "shares";

type User = {
  id: number;
  username: string;
  displayName?: string;
};

type Follower = {
  user: User;
  followedByMe: boolean;
};

type Post = {
  id: number;
  content: string;
  createdAt: string;
};

export default function Profile() {
  const { username } = useLocalSearchParams<{ username: string }>();

  const {
    profile,
    posts = [] as Post[],
    followers = [] as Follower[],
    following = [] as Follower[],
    fetchFollowers,
    fetchFollowing,
    toggleFollow,
    loading,
  } = useProfile(username!);

  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser().then(user => setCurrentUser(user));
  }, []);

  useEffect(() => {
    if (activeTab === "followers") fetchFollowers();
    if (activeTab === "following") fetchFollowing();
  }, [activeTab, fetchFollowers, fetchFollowing]);

  if (loading || !currentUser) {
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
      {/* HEADER */}
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        {profile.displayName ?? profile.username}
      </Text>

      <Text style={{ color: "#666", marginBottom: 16 }}>
        @{profile.username}
      </Text>

      {/* TABS */}
      <ProfileTabs active={activeTab} onChange={setActiveTab} />

      {/* POSTS */}
      {activeTab === "posts" && posts.length === 0 && (
        <Text style={{ color: "#999", marginTop: 12 }}>No posts yet</Text>
      )}

      {activeTab === "posts" &&
        posts.map((post: Post) => (
          <View key={post.id} style={{ marginBottom: 16 }}>
            <Text>{post.content}</Text>
            <Text style={{ fontSize: 12, color: "#999" }}>
              {new Date(post.createdAt).toLocaleString()}
            </Text>
          </View>
        ))}

      {/* FOLLOWERS */}
      {activeTab === "followers" && followers.length === 0 && (
        <Text style={{ color: "#999", marginTop: 12 }}>No followers yet</Text>
      )}

     {activeTab === "followers" &&
  followers.map(f => {
    const isSelf = f.user.username === currentUser.username;

    return (
      <UserRow
        key={f.user.id}
        user={{
          ...f.user,
          followedByMe: f.followedByMe, 
        }}
        onToggleFollow={isSelf ? undefined : toggleFollow}
      />
    );
  })}

      {/* FOLLOWING */}
      {activeTab === "following" && following.length === 0 && (
        <Text style={{ color: "#999", marginTop: 12 }}>Not following anyone yet</Text>
      )}
    </View>
  );
}
