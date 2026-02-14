import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { commonStyles as styles } from "@/styles/common";
import { UserRow } from "@/components/user/UserRow";
import { ActivityRow } from "@/components/feed/ActivityRow";
import { useActivities } from "@/hooks/useActivities";
import { graphqlFetch } from "@/utils/graphqlFetch";

type Tab =
  | "posts"
  | "likes"
  | "activity"
  | "followers"
  | "following";

export default function UsernameScreen() {
  const { username } =
    useLocalSearchParams<{ username: string }>();

  const [tab, setTab] = useState<Tab>("posts");

  /* ---------------- ACTIVITY TYPES ---------------- */

  const types = useMemo(() => {
    if (tab === "posts") return ["post"];
    if (tab === "likes") return ["like"];
    if (tab === "activity") return undefined;
    return undefined;
  }, [tab]);

  const feed = useActivities({
    username,
    types:
      tab === "followers" || tab === "following"
        ? undefined
        : types,
  });

  /* ---------------- FOLLOW LIST STATE ---------------- */

  const [followUsers, setFollowUsers] = useState<any[]>([]);
  const [followLoading, setFollowLoading] =
    useState(false);

  useEffect(() => {
    if (
      tab !== "followers" &&
      tab !== "following"
    )
      return;

    const load = async () => {
      setFollowLoading(true);

      try {
        const data = await graphqlFetch<{
          followers?: any[];
          following?: any[];
        }>(
          tab === "followers"
            ? `
              query ($username: String!) {
                followers(username: $username) {
                  id
                  username
                  displayName
                  followedByMe
                }
              }
            `
            : `
              query ($username: String!) {
                following(username: $username) {
                  id
                  username
                  displayName
                  followedByMe
                }
              }
            `,
          { username }
        );

        setFollowUsers(
          tab === "followers"
            ? data.followers ?? []
            : data.following ?? []
        );
      } catch {
        setFollowUsers([]);
      } finally {
        setFollowLoading(false);
      }
    };

    load();
  }, [tab, username]);

  const handleToggleFollowInList = async (
    targetUsername: string,
    shouldFollow: boolean
  ) => {
    setFollowUsers(prev =>
      prev.map(u =>
        u.username === targetUsername
          ? { ...u, followedByMe: shouldFollow }
          : u
      )
    );

    await feed.toggleFollowOptimistic(
      targetUsername,
      shouldFollow
    );
  };

  /* ---------------- RENDER ---------------- */

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
          }}
        >
          @{username}
        </Text>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-around",
          paddingVertical: 8,
        }}
      >
        {(
          [
            "posts",
            "likes",
            "activity",
            "followers",
            "following",
          ] as Tab[]
        ).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{ marginVertical: 4 }}
          >
            <Text
              style={{
                fontWeight:
                  tab === t ? "700" : "400",
              }}
            >
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Followers / Following */}
      {(tab === "followers" ||
        tab === "following") && (
        <>
          {followLoading && (
            <ActivityIndicator size="large" />
          )}

          <ScrollView>
            {followUsers.map(user => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={
                  feed.currentUserId ??
                  undefined
                }
                onToggleFollow={
                  handleToggleFollowInList
                }
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* Activity Based Tabs */}
      {tab !== "followers" &&
        tab !== "following" && (
          <>
            {feed.loading && (
              <Text>Loading…</Text>
            )}
            {feed.error && (
              <Text>{feed.error}</Text>
            )}

            <ScrollView>
              {feed.activities.map(
                activity => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    currentUserId={
                      feed.currentUserId ?? 0
                    }
                    onToggleFollow={
                      feed.toggleFollowOptimistic
                    }
                    onToggleLike={
                      feed.toggleLikeOptimistic
                    }
                    onDeletePost={
                      feed.deletePost
                    }
                  />
                )
              )}
            </ScrollView>
          </>
        )}
    </View>
  );
}
