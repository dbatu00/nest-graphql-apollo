import React from "react";
import { View, Text, ScrollView } from "react-native";
import { commonStyles as styles } from "@/styles/common";
import { FeedHeader } from "@/components/layout/FeedHeader";
import { useFeed } from "@/hooks/useFeed";
import { FeedItem } from "@/components/feed/FeedItem";

export default function Feed() {
  const feed = useFeed();

  return (
    <View style={styles.container}>
      <FeedHeader title="Feed" />

      {feed.loading && <Text>Loading…</Text>}
      {feed.error && <Text>{feed.error}</Text>}

      <ScrollView>
        {feed.activities.map(activity => (
          <FeedItem
            key={activity.id}
            activity={activity}
          />
        ))}
      </ScrollView>
    </View>
  );
}
