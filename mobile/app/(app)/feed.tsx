import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { commonStyles as styles } from "@/styles/common";
import { feedStyles } from "@/styles/feed";
import { getCurrentUser } from "@/utils/currentUser";
import { PostList } from "@/components/feed/PostList";
import { FeedHeader } from "@/components/layout/FeedHeader";
import { Composer } from "@/components/feed/Composer";
import { useFeed } from "@/hooks/useFeed";

export default function Posts() {
  const [content, setContent] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const feed = useFeed();

  useEffect(() => {
    getCurrentUser()
      .then(user => setCurrentUserId(user.id))
      .catch(() => {});
  }, []);

  const handlePublish = async () => {
    await feed.publish(content);
    setContent("");
  };

  const handleDelete = (postId: number) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      feed.remove(postId);
    }
  };

  return (
    <View style={styles.container}>
      <FeedHeader title="Feed" />

      <Composer
        value={content}
        onChange={setContent}
        onPublish={handlePublish}
      />

      {feed.error && (
        <Text style={feedStyles.error}>{feed.error}</Text>
      )}

      <PostList
        posts={feed.posts}
        currentUserId={currentUserId}
        onDelete={handleDelete}
        onToggleFollow={feed.toggleFollowOptimistic} 
      />
    </View>
  );
}
