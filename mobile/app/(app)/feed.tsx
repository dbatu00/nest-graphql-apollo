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

TODO:
- Move inline composer card style block into Composer (or a shared style/theme
  constant) so Feed doesn't own presentation details like shadows/border radius
- Move activity filter predicate (a.type !== "follow" || a.active) into
  useActivities (e.g. feed.visibleActivities) or pass as config to ActivityList,
  so Feed doesn't own feed business logic
*/
import { useState } from "react";
import {
  View,
  Platform,
} from "react-native";

import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { Composer } from "@/components/feed/Composer";
import { useActivities } from "@/hooks/useActivities";
import { ActivityList } from "@/components/feed/ActivityList";

export default function Feed() {
  const feed = useActivities();

  const [content, setContent] = useState("");

  const handlePublish = async () => {
    if (!content.trim()) return;
    await feed.publishPost(content);
    setContent("");
  };

  return (
    <PageShell
      header={<Header title="BookBook" onRefresh={feed.refresh} isRefreshing={feed.loading} />}
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

      <ActivityList
        feed={feed}
        filter={a => a.type !== "follow" || a.active}
      />
    </PageShell>
  );
}