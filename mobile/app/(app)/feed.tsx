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
  const feed = useActivities({ types: ["post", "like", "follow", "comment"] });

  const [content, setContent] = useState("");

  const handlePublish = async () => {
    if (!content.trim()) return;
    await feed.publish(content);
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