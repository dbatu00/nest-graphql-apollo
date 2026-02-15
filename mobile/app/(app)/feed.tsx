import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  Platform,
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
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Composer shrinks from 200px (3 lines) to 30px (1 line) as you scroll
  const composerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 30],
    extrapolate: 'clamp',
  });

  const textAreaHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 30],
    extrapolate: 'clamp',
  });

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
      
      <Animated.View
        style={{
          minHeight: composerHeight,
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: "#fff",
          marginHorizontal: 20,
          marginVertical: 20,
          borderRadius: 12,
          overflow: 'hidden',
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
        <Animated.View
          style={{
            minHeight: textAreaHeight,
          }}
        >
          <Composer
            value={content}
            onChange={setContent}
            onPublish={handlePublish}
          />
        </Animated.View>
      </Animated.View>

      {feed.loading && <Text>Loading…</Text>}
      {feed.error && <Text>{feed.error}</Text>}

      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
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
      </Animated.ScrollView>
    </View>
  );
}
