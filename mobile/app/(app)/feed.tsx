import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  Platform,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { commonStyles as styles } from "@/styles/common";
import { FeedHeader } from "@/components/layout/FeedHeader";
import { Composer } from "@/components/feed/Composer";
import { useActivities } from "@/hooks/useActivities";
import { ActivityRow } from "@/components/feed/ActivityRow";


export default function Feed() {
  const feed = useActivities();

  const [content, setContent] = useState("");
  const scrollY = useRef(new Animated.Value(0)).current;
  const loaderSpin = useRef(new Animated.Value(0)).current;
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(feed.loading);
  const loadingStartedAtRef = useRef<number | null>(feed.loading ? Date.now() : null);
  const hideLoaderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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

  const handlePublish = async () => {
    if (!content.trim()) return;
    await feed.publish(content);
    setContent("");
  };

  React.useEffect(() => {
    if (feed.loading) {
      if (hideLoaderTimeoutRef.current) {
        clearTimeout(hideLoaderTimeoutRef.current);
        hideLoaderTimeoutRef.current = null;
      }

      loadingStartedAtRef.current = Date.now();
      setShowLoadingIndicator(true);
      return;
    }

    const startedAt = loadingStartedAtRef.current;

    if (!startedAt) {
      setShowLoadingIndicator(false);
      return;
    }

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, 500 - elapsed);

    hideLoaderTimeoutRef.current = setTimeout(() => {
      setShowLoadingIndicator(false);
      loadingStartedAtRef.current = null;
      hideLoaderTimeoutRef.current = null;
    }, remaining);
  }, [feed.loading]);

  React.useEffect(() => {
    if (!showLoadingIndicator) {
      loaderSpin.setValue(0);
      return;
    }

    const spinLoop = Animated.loop(
      Animated.timing(loaderSpin, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    spinLoop.start();

    return () => {
      spinLoop.stop();
    };
  }, [showLoadingIndicator, loaderSpin]);

  React.useEffect(() => {
    return () => {
      if (hideLoaderTimeoutRef.current) {
        clearTimeout(hideLoaderTimeoutRef.current);
      }
    };
  }, []);

  const loaderRotate = loaderSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <FeedHeader title="BookBook" onRefresh={feed.refresh} isRefreshing={feed.loading} />
      
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

      {showLoadingIndicator && (
        <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 8 }}>
          <Animated.View style={{ transform: [{ rotate: loaderRotate }] }}>
            <Ionicons name="refresh" size={18} color="#2563eb" />
          </Animated.View>
        </View>
      )}
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
