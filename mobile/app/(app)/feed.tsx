import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
} from "react-native";
import { usePathname } from "expo-router";

import { commonStyles as styles } from "@/styles/common";
import { FeedHeader } from "@/components/layout/FeedHeader";
import { Composer } from "@/components/feed/Composer";
import { useActivities } from "@/hooks/useActivities";
import { ActivityRow } from "@/components/feed/ActivityRow";


export default function Feed() {
  const feed = useActivities();
  const pathname = usePathname();

  const [content, setContent] = useState("");

  // close modal automatically on route change
  useEffect(() => {
    // modals are now managed inside ActivityRow
  }, [pathname]);

  const handlePublish = async () => {
    if (!content.trim()) return;
    await feed.publish(content);
    setContent("");
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
            <ActivityRow
              key={activity.id}
              activity={activity}
              currentUserId={feed.currentUserId ?? undefined}
              onToggleFollow={feed.toggleFollowOptimistic}
              onToggleLike={feed.toggleLikeOptimistic}
              onDeletePost={feed.deletePost}
            />
          ))}
      </ScrollView>
    </View>
  );
}
