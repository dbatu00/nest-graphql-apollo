import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useProfile } from "@/hooks/useProfile";
import { UserRow } from "@/components/user/UserRow";
import { FeedItem } from "@/components/feed/FeedItem";
import { commonStyles } from "@/styles/common";
import { getCurrentUser } from "@/utils/currentUser";
import { useFeed } from "@/hooks/useFeed";
import { ProfileTabs, Tab } from "@/components/profile/ProfileTabs";

type User = {
  id: number;
  username: string;
  displayName?: string;
};

type Follower = {
  user: User;
  followedByMe: boolean;
};


export default function Profile() {
  const { username } = useLocalSearchParams<{ username: string }>();

  const {
    profile,
    followers = [] as Follower[],
    following = [] as Follower[],
    fetchFollowers,
    fetchFollowing,
    toggleFollow,
    loading,
  } = useProfile(username!);

  const [activeTab, setActiveTab] = useState<Tab>("activity");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fetch current logged-in user
  useEffect(() => {
    getCurrentUser().then(user => setCurrentUser(user));
  }, []);

  // Fetch followers/following when tab is active
  useEffect(() => {
    if (activeTab === "followers") fetchFollowers();
    if (activeTab === "following") fetchFollowing();
  }, [activeTab, fetchFollowers, fetchFollowing]);

  // Activity feed (unified hook, parameterized by username)
  const { activities, loading: activityLoading, toggleFollowOptimistic, deletePost } =
    useFeed(activeTab === "activity" ? username : undefined);

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
              user={{ ...f.user, followedByMe: f.followedByMe }}
              onToggleFollow={isSelf ? undefined : toggleFollow}
            />
          );
        })}

      {/* FOLLOWING */}
      {activeTab === "following" && following.length === 0 && (
        <Text style={{ color: "#999", marginTop: 12 }}>No following yet</Text>
      )}
      {activeTab === "following" &&
        following.map(f => {
          const isSelf = f.user.username === currentUser.username;
          return (
            <UserRow
              key={f.user.id}
              user={{ ...f.user, followedByMe: f.followedByMe }}
              onToggleFollow={isSelf ? undefined : toggleFollow}
            />
          );
        })}

      {/* ACTIVITY */}
      {activeTab === "activity" && (
        <>
          {activityLoading && <Text>Loading…</Text>}
          {!activityLoading && activities.length === 0 && (
            <Text style={{ color: "#999", marginTop: 12 }}>No activity yet</Text>
          )}
          {!activityLoading && (
            <ScrollView>
              {activities
                .filter(a => a.type !== "follow" || a.active)
                .map(activity => (
                  <FeedItem
                    key={activity.id}
                    activity={activity}
                    currentUserId={currentUser?.id ?? null}
                    onToggleFollow={toggleFollowOptimistic}
                    onDeletePost={deletePost}
                  />
                ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}
