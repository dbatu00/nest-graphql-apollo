import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { commonStyles as styles } from "@/styles/common";
import { FeedHeader } from "@/components/layout/FeedHeader";
import { useFeed } from "@/hooks/useFeed";
import { FeedItem } from "@/components/feed/FeedItem";
import { Composer } from "@/components/feed/Composer";

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

      {/* Composer for new posts */}
      <Composer value={content} onChange={setContent} onPublish={handlePublish} />

      {feed.loading && <Text>Loading…</Text>}
      {feed.error && <Text>{feed.error}</Text>}

      <ScrollView>
        {feed.activities.map(activity => (
          <FeedItem
            key={activity.id}
            activity={activity}
            currentUserId={feed.currentUserId}
            // Use toggleFollowOptimistic for follow buttons in activity rows
            onToggleFollow={feed.toggleFollowOptimistic}
          />
        ))}
      </ScrollView>
    </View>
  );
}
