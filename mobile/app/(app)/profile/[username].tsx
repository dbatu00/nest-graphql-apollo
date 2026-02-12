import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useProfile } from "@/hooks/useProfile";
import { UserRow } from "@/components/user/UserRow";
import { FeedItem } from "@/components/feed/FeedItem";
import { commonStyles } from "@/styles/common";
import { getCurrentUser } from "@/utils/currentUser";
import { useFeed } from "@/hooks/useFeed";
import { ProfileTabs, Tab } from "@/components/profile/ProfileTabs";
import { graphqlFetch } from "@/utils/graphqlFetch";

type User = {
  id: number;
  username: string;
  displayName?: string;
};

type Follower = {
  user: User;
  followedByMe: boolean;
};

type LikedUser = {
  id: number;
  username: string;
  displayName?: string;
  followedByMe?: boolean;
};

type LikedUsersResponse = {
  post: {
    likedUsers: LikedUser[];
  };
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

  /* -------------------- */
  /* FEED (ACTIVITY TAB) */
  /* -------------------- */

  const {
    activities,
    loading: activityLoading,
    toggleFollowOptimistic,
    toggleLikeOptimistic,
    deletePost,
  } = useFeed(activeTab === "activity" ? username : undefined);

  /* -------------------- */
  /* LIKES MODAL STATE    */
  /* -------------------- */

  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);

  const openLikesModal = useCallback(async (postId: number) => {
    try {
      setLikesLoading(true);
      setLikesModalVisible(true);

      const res = await graphqlFetch<LikedUsersResponse>(
        `
          query LikedUsers($postId: Int!) {
            post(id: $postId) {
              likedUsers {
                id
                username
                displayName
                followedByMe
              }
            }
          }
        `,
        { postId }
      );

      setLikedUsers(res.post.likedUsers);
    } catch (err) {
      console.error("Failed fetching liked users", err);
    } finally {
      setLikesLoading(false);
    }
  }, []);

  /* -------------------- */
  /* FIX: MODAL FOLLOW    */
  /* -------------------- */

  const handleToggleFollowInModal = async (
    username: string,
    shouldFollow: boolean
  ) => {
    // 1️⃣ Optimistically update modal UI
    setLikedUsers(prev =>
      prev.map(u =>
        u.username === username
          ? { ...u, followedByMe: shouldFollow }
          : u
      )
    );

    // 2️⃣ Trigger global follow logic (updates feed + backend)
    await toggleFollowOptimistic(username, shouldFollow);
  };

  /* -------------------- */
  /* EFFECTS              */
  /* -------------------- */

  useEffect(() => {
    getCurrentUser().then(user => setCurrentUser(user));
  }, []);

  useEffect(() => {
    if (activeTab === "followers") fetchFollowers();
    if (activeTab === "following") fetchFollowing();
  }, [activeTab, fetchFollowers, fetchFollowing]);

  /* -------------------- */
  /* GUARDS               */
  /* -------------------- */

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

  /* -------------------- */
  /* RENDER               */
  /* -------------------- */

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

      {/* FOLLOWERS TAB */}
      {activeTab === "followers" && (
        <>
          {followers.length === 0 && (
            <Text style={{ color: "#999", marginTop: 12 }}>
              No followers yet
            </Text>
          )}

          {followers.map(f => {
            const isSelf = f.user.username === currentUser.username;
            return (
              <UserRow
                key={f.user.id}
                user={{ ...f.user, followedByMe: f.followedByMe }}
                currentUserId={currentUser.id}
                onToggleFollow={isSelf ? undefined : toggleFollow}
              />
            );
          })}
        </>
      )}

      {/* FOLLOWING TAB */}
      {activeTab === "following" && (
        <>
          {following.length === 0 && (
            <Text style={{ color: "#999", marginTop: 12 }}>
              No following yet
            </Text>
          )}

          {following.map(f => {
            const isSelf = f.user.username === currentUser.username;
            return (
              <UserRow
                key={f.user.id}
                user={{ ...f.user, followedByMe: f.followedByMe }}
                currentUserId={currentUser.id}
                onToggleFollow={isSelf ? undefined : toggleFollow}
              />
            );
          })}
        </>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === "activity" && (
        <>
          {activityLoading && <Text>Loading…</Text>}

          {!activityLoading && activities.length === 0 && (
            <Text style={{ color: "#999", marginTop: 12 }}>
              No activity yet
            </Text>
          )}

          {!activityLoading && (
            <ScrollView>
              {activities
                .filter(a => a.type !== "follow" || a.active)
                .map(activity => (
                  <FeedItem
                    key={activity.id}
                    activity={activity}
                    currentUserId={currentUser.id}
                    onToggleFollow={toggleFollowOptimistic}
                    onToggleLike={toggleLikeOptimistic}
                    onDeletePost={deletePost}
                    onPressLikes={openLikesModal}
                  />
                ))}
            </ScrollView>
          )}
        </>
      )}

      {/* LIKES MODAL */}
      <Modal visible={likesModalVisible} animationType="slide">
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
            Liked by
          </Text>

          {likesLoading && <ActivityIndicator size="large" />}

          <ScrollView>
            {likedUsers.map(user => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={currentUser.id}
                onToggleFollow={handleToggleFollowInModal}
              />
            ))}
          </ScrollView>

          <Text
            style={{
              marginTop: 20,
              textAlign: "center",
              color: "blue",
              fontWeight: "600",
            }}
            onPress={() => setLikesModalVisible(false)}
          >
            Close
          </Text>
        </View>
      </Modal>

    </View>
  );
}
