/*
Kind:
Component

Role:
Feed screen

Responsibility:
- Coordinate the feed feature
- Own screen-level state and delegate feed logic and rendering

Owns:
- Draft post content

Delegates:
- Feed state → useActivities
- Layout → PageShell
- Composer → Composer
- Activity rendering → ActivityList

Used by:
- Expo Router
*/
import { useState } from "react";
import { View } from "react-native";

import { Header } from "@/components/layout/Header";
import { AppHeaderActions } from "@/components/layout/AppHeaderActions";
import { PageShell } from "@/components/layout/PageShell";
import { Composer } from "@/components/feed/Composer";
import { useActivities } from "@/hooks/useActivities";
import { ActivityList } from "@/components/feed/ActivityList";
import { feedScreenStyles as styles } from "@/styles";

export default function Feed() {
  const feed = useActivities();

  const [content, setContent] = useState("");

  const handlePublish = async () => {
    const normalizedContent = content.trim();
    if (!normalizedContent) return;
    await feed.publishPost(normalizedContent);
    setContent("");
  };

  return (
    <PageShell
      header={<Header title="BookBook" onRefresh={feed.refresh} isRefreshing={feed.loading} rightActions={<AppHeaderActions mode="feed" />} />}
    >
      <View
        style={styles.composerCard}
      >
        <Composer value={content} onChange={setContent} onPublish={handlePublish} />
      </View>

      <ActivityList feed={feed} />
    </PageShell>
  );
}