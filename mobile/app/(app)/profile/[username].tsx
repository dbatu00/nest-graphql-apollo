import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { commonStyles as styles } from "@/styles/common";
import { UserRow } from "@/components/user/UserRow";
import { ActivityRow } from "@/components/feed/ActivityRow";
import { FeedLogoutButton } from "@/components/common/FeedLogoutButton";
import { UserSettingsButton } from "@/components/common/UserSettingsButton";
import { useActivities } from "@/hooks/useActivities";
import { useAuth } from "@/hooks/useAuth";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { FOLLOWERS_QUERY, FOLLOWING_QUERY } from "@/graphql/operations";

type Tab =
  | "posts"
  | "likes"
  | "activity"
  | "followers"
  | "following";

type FollowUser = {
  id: number;
  username: string;
  displayName?: string;
  followedByMe?: boolean;
};

export default function UsernameScreen() {
  const { username } =
    useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { logout } = useAuth();

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

  const [followUsers, setFollowUsers] = useState<FollowUser[]>([]);
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
          followers?: FollowUser[];
          following?: FollowUser[];
        }>(
          tab === "followers" ? FOLLOWERS_QUERY : FOLLOWING_QUERY,
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

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  /* ---------------- RENDER ---------------- */

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 14,
        backgroundColor: "#fff",
        borderBottomWidth: 0,
        marginBottom: 12,
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
          },
          android: { elevation: 1 },
        }),
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#1f2937",
            }}
          >
            @{username}
          </Text>
          
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push("/feed")}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderWidth: 0,
                borderColor: "transparent",
                borderRadius: 8,
                backgroundColor: "#2563eb",
                minWidth: 70,
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="home-outline" size={14} color="#fff" />
                <Text style={{ fontWeight: "600", color: "#fff", fontSize: 13, marginLeft: 6 }}>Home</Text>
              </View>
            </TouchableOpacity>

            <UserSettingsButton
              onPress={() => {
                if (!username) {
                  return;
                }

                router.push({
                  pathname: "/profile/[username]/settings",
                  params: { username },
                });
              }}
              minWidth={70}
              borderColor="#2563eb"
            />

            <FeedLogoutButton
              onPress={handleLogout}
              style={{ marginLeft: 8 }}
              minWidth={70}
              iconColor="#2563eb"
              textColor="#2563eb"
            />
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View
        style={{
          marginHorizontal: 12,
          marginBottom: 16,
          backgroundColor: "#f9fafb",
          borderRadius: 10,
          padding: 4,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 3,
            },
            android: { elevation: 1 },
          }),
        }}
      >
        <View style={{ flexDirection: "row", gap: 4 }}>
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
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: tab === t ? "#fff" : "transparent",
                ...(tab === t ? {
                  ...Platform.select({
                    ios: {
                      shadowColor: "#2563eb",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 2,
                    },
                    android: { elevation: 2 },
                  }),
                } : {}),
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontWeight:
                    tab === t ? "600" : "500",
                  color: tab === t ? "#2563eb" : "#9ca3af",
                  fontSize: 11,
                  textAlign: "center",
                }}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Followers / Following */}
      {(tab === "followers" ||
        tab === "following") && (
        <View style={{ flex: 1 }}>
          {followLoading && (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          )}

          {!followLoading && (
            <ScrollView style={{ paddingTop: 8 }}>
              {followUsers.map(user => (
                <View
                  key={user.id}
                  style={{
                    backgroundColor: "#fff",
                    marginHorizontal: 12,
                    marginVertical: 6,
                    borderRadius: 10,
                    ...Platform.select({
                      ios: {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 2,
                      },
                      android: { elevation: 1 },
                    }),
                  }}
                >
                  <UserRow
                    user={user}
                    currentUserId={
                      feed.currentUserId ??
                      undefined
                    }
                    onToggleFollow={
                      handleToggleFollowInList
                    }
                    isCompact={false}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>
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
