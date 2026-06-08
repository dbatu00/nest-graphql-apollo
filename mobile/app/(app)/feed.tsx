import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Platform,
} from "react-native";

import { commonStyles as styles } from "@/styles/common";
import { FeedHeader } from "@/components/layout/FeedHeader";
import { Composer } from "@/components/feed/Composer";
import { useActivities } from "@/hooks/useActivities";
import { ActivityRow } from "@/components/feed/ActivityRow";

const FEED_MAX_WIDTH = 960;

export default function Feed() {
  const feed = useActivities();

  const [content, setContent] = useState("");

  const handlePublish = async () => {
    if (!content.trim()) return;
    await feed.publish(content);
    setContent("");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={[
          { flex: 1 },
          Platform.OS === "web"
            ? ({
              scrollbarColor: "#bfdbfe #2563eb",
              scrollbarWidth: "thin",
              scrollbarGutter: "stable",
            } as never)
            : null,
        ]}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <FeedHeader title="BookBook" onRefresh={feed.refresh} isRefreshing={feed.loading} />
        <View
          style={{
            width: "100%",
            maxWidth: FEED_MAX_WIDTH,
            alignSelf: "center",
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              minHeight: 200,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: "#fff",
              marginHorizontal: 0,
              marginTop: 12,
              marginBottom: 6,
              borderRadius: 12,
              overflow: "hidden",
              ...Platform.select({
                ios: {
                  shadowColor: "#3b82f6",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                },
                android: { elevation: 2 },
              }),
            }}
          >
            <Composer value={content} onChange={setContent} onPublish={handlePublish} />
          </View>

          {feed.error && <Text>{feed.error}</Text>}

          {feed.activities
            .filter(a => a.type !== "follow" || a.active)
            .map(activity => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                currentUserId={feed.currentUserId ?? undefined}
                currentUserAvatarUrl={feed.currentUserAvatarUrl ?? undefined}
                currentUserLabel={feed.currentUserLabel ?? undefined}
                onToggleFollow={feed.toggleFollowOptimistic}
                onToggleLike={feed.toggleLikeOptimistic}
                onToggleCommentLike={feed.toggleCommentLikeOptimistic}
                onDeletePost={feed.deletePost}
                onDeleteComment={feed.deleteCommentFromPost}
                onAddComment={feed.addCommentToPost}
              />
            ))}
        </View>
      </ScrollView>
    </View>
  );
}
