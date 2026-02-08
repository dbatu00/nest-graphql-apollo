import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { commonStyles as styles } from "@/styles/common";
import { FeedHeader } from "@/components/layout/FeedHeader";
import { Composer } from "@/components/feed/Composer";
import { useFeed } from "@/hooks/useFeed";
import { FeedItem } from "@/components/feed/FeedItem";

export default function Feed() {
  const feed = useFeed();
  const [content, setContent] = useState("");

  const handlePublish = async () => {
    if (!content.trim()) return;
    await feed.publish(content);
    setContent("");
  };

  return (
    <View style={styles.container}>
      <FeedHeader title="Feed" />
      <Composer value={content} onChange={setContent} onPublish={handlePublish} />

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
            />
          ))}
      </ScrollView>
    </View>
  );
}
