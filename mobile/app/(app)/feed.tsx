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
import { View } from "react-native";

import { Header } from "@/components/layout/Header";
import { AppHeaderActions } from "@/components/layout/AppHeaderActions";
import { PageShell } from "@/components/layout/PageShell";
import { Composer } from "@/components/feed/Composer";
import { useActivities } from "@/hooks/useActivities";
import { useAuth } from "@/hooks/useAuth";
import { ActivityList } from "@/components/feed/ActivityList";
import { feedScreenStyles as styles } from "@/styles";

export default function Feed() {
  const feed = useActivities();
  const { user } = useAuth();

  const [content, setContent] = useState("");

  const handlePublish = async () => {
    if (!content.trim()) return;
    await feed.publishPost(content);
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

      <ActivityList
        feed={feed}
        filter={(a) => {
          if (a.type === "post") return true;
          if (user && a.actor?.id === user.id) return false;
          if (a.type === "like" && a.actor?.id === a.targetPost?.user?.id) return false;
          if (a.type === "comment" && a.actor?.id === a.targetPost?.user?.id) return false;
          return a.type !== "follow" || a.active;
        }}
      />
    </PageShell>
  );
}