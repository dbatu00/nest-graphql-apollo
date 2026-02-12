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
    likedPosts,
    setLikedPosts, // ✅ required
    fetchLikedPosts,
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
  /* FIX: LIKES TAB HEART */
  /* -------------------- */

  const handleToggleLikeInLikesTab = async (
  postId: number,
  currentlyLiked: boolean
) => {
  setLikedPosts(prev =>
    prev.map(p =>
      p.id === postId
        ? {
            ...p,
            likedByMe: !currentlyLiked,
            likesCount:
              (p.likesCount ?? 0) + (currentlyLiked ? -1 : 1),
          }
        : p
    )
  );

  // Only remove from list if viewing own likes
  if (
    currentlyLiked &&
    currentUser?.username === profile?.username
  ) {
    setLikedPosts(prev => prev.filter(p => p.id !== postId));
  }

  await toggleLikeOptimistic(postId, currentlyLiked);
};



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

  const handleToggleFollowInModal = async (
    username: string,
    shouldFollow: boolean
  ) => {
    setLikedUsers(prev =>
      prev.map(u =>
        u.username === username
          ? { ...u, followedByMe: shouldFollow }
          : u
      )
    );

    await toggleFollowOptimistic(username, shouldFollow);
  };

  const handleDeletePostInLikesTab = async (postId: number) => {
  // 1️⃣ Optimistically remove from likes tab
  setLikedPosts(prev => prev.filter(p => p.id !== postId));

  // 2️⃣ Call global delete logic
  await deletePost(postId);
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

  useEffect(() => {
    if (activeTab === "likes") {
      fetchLikedPosts();
    }
  }, [activeTab, fetchLikedPosts]);

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
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        {profile.displayName ?? profile.username}
      </Text>
      <Text style={{ color: "#666", marginBottom: 16 }}>
        @{profile.username}
      </Text>

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

      {/* LIKES TAB */}
      {activeTab === "likes" && (
        <>
          {likedPosts.length === 0 && (
            <Text style={{ color: "#999", marginTop: 12 }}>
              No liked posts yet
            </Text>
          )}

          <ScrollView>
            {likedPosts.map(post => (
  <FeedItem
    key={`liked-${post.id}`}
    activity={{
      id: post.id,
      type: "like", // ✅ important
      actor: currentUser!, // ✅ YOU liked it
      targetPost: post,
      active: true,
      createdAt: post.createdAt,
    }}
                currentUserId={currentUser.id}
                onToggleFollow={toggleFollow}
                onToggleLike={handleToggleLikeInLikesTab} // ✅ fixed
                onDeletePost={handleDeletePostInLikesTab}
                onPressLikes={openLikesModal}
              />
            ))}
          </ScrollView>
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
