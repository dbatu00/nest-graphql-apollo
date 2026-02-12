import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { usePathname } from "expo-router";

import { commonStyles as styles } from "@/styles/common";
import { FeedHeader } from "@/components/layout/FeedHeader";
import { Composer } from "@/components/feed/Composer";
import { FeedItem } from "@/components/feed/FeedItem";
import { UserRow } from "@/components/user/UserRow";

import { useFeed } from "@/hooks/useFeed";
import { graphqlFetch } from "@/utils/graphqlFetch";

export default function Feed() {
  const feed = useFeed();
  const pathname = usePathname();

  const [content, setContent] = useState("");

  // liked users modal state
  const [likedUsers, setLikedUsers] = useState<any[]>([]);
  const [likedModalVisible, setLikedModalVisible] = useState(false);
  const [likedLoading, setLikedLoading] = useState(false);

  // close modal automatically on route change
  useEffect(() => {
    setLikedModalVisible(false);
    setLikedUsers([]);
  }, [pathname]);

  const handlePublish = async () => {
    if (!content.trim()) return;
    await feed.publish(content);
    setContent("");
  };

  // Fetch liked users on count click
  const handlePressLikedByList = async (postId: number) => {
    try {
      setLikedLoading(true);
      setLikedModalVisible(true);

      const data = await graphqlFetch<{
        post: { likedUsers: any[] };
      }>(
        `
        query GetLikedUsers($postId: Int!) {
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

      setLikedUsers(data.post.likedUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setLikedLoading(false);
    }
  };

  // follow toggle wrapper for modal
  const handleToggleFollowInModal = async (
    username: string,
    shouldFollow: boolean
  ) => {
    // optimistic update modal list
    setLikedUsers(prev =>
      prev.map(u =>
        u.username === username
          ? { ...u, followedByMe: shouldFollow }
          : u
      )
    );

    await feed.toggleFollowOptimistic(username, shouldFollow);
  };

  return (
    <View style={styles.container}>
      <FeedHeader title="Feed" />
      <Composer
        value={content}
        onChange={setContent}
        onPublish={handlePublish}
      />

      {feed.loading && <Text>Loading…</Text>}
      {feed.error && <Text>{feed.error}</Text>}

      <ScrollView>
        {feed.activities
          .filter(a => a.type !== "follow" || a.active)
          .map(activity => (
            <FeedItem
              key={activity.id}
              activity={activity}
              currentUserId={feed.currentUserId}
              onToggleFollow={feed.toggleFollowOptimistic}
              onToggleLike={feed.toggleLikeOptimistic}
              onDeletePost={feed.deletePost}
              onPressLikes={handlePressLikedByList}
            />
          ))}
      </ScrollView>

      {/* Liked Users Modal */}
      <Modal visible={likedModalVisible} animationType="slide">
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
            Liked by
          </Text>

          {likedLoading && <ActivityIndicator size="large" />}

          <ScrollView>
            {likedUsers.map(user => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={feed.currentUserId ?? undefined}
                onToggleFollow={handleToggleFollowInModal}
              />
            ))}
          </ScrollView>

          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={() => setLikedModalVisible(false)}
          >
            <Text style={{ textAlign: "center", color: "blue" }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
