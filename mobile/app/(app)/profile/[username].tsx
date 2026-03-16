import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { commonStyles as styles } from "@/styles/common";
import { UserRow } from "@/components/user/UserRow";
import { ActivityRow } from "@/components/feed/ActivityRow";
import { FeedHeader } from "@/components/layout/FeedHeader";
import { UserSettingsButton } from "@/components/common/UserSettingsButton";
import { FeedLogoutButton } from "@/components/common/FeedLogoutButton";
import { useActivities } from "@/hooks/useActivities";
import { useAuth } from "@/hooks/useAuth";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { FOLLOWERS_QUERY, FOLLOWING_QUERY, USER_PROFILE_QUERY } from "@/graphql/operations";

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
  avatarUrl?: string;
  followedByMe?: boolean;
};

type ProfileMeta = {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
};

export default function UsernameScreen() {
  const { username } =
    useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { user, logout } = useAuth();

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
  const [profileMeta, setProfileMeta] = useState<ProfileMeta | null>(null);

  useEffect(() => {
    if (!username) {
      setProfileMeta(null);
      return;
    }

    let cancelled = false;

    const loadProfileMeta = async () => {
      try {
        const data = await graphqlFetch<{
          userByUsername: {
            displayName?: string;
            bio?: string;
            avatarUrl?: string;
            coverUrl?: string;
          } | null;
        }>(USER_PROFILE_QUERY, { username });

        if (cancelled) {
          return;
        }

        setProfileMeta(data.userByUsername ?? null);
      } catch {
        if (!cancelled) {
          setProfileMeta(null);
        }
      }
    };

    loadProfileMeta();

    return () => {
      cancelled = true;
    };
  }, [username]);

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

  const profileDisplayName = profileMeta?.displayName?.trim() || username;
  const profileBio = profileMeta?.bio?.trim();
  const profileAvatarUrl = profileMeta?.avatarUrl?.trim();
  const profileCoverUrl = profileMeta?.coverUrl?.trim();
  const isOwnProfile = user?.username === username;

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  /* ---------------- RENDER ---------------- */

  return (
    <View style={styles.container}>
      <FeedHeader
        title="BookBook"
        rightActions={(
          <>
            <UserSettingsButton
              onPress={() => router.push("/feed")}
              minWidth={70}
              borderColor="rgba(255, 255, 255, 0.92)"
              label="Home"
              iconName="home-outline"
            />

            {isOwnProfile && (
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
                borderColor="rgba(255, 255, 255, 0.92)"
                style={{ marginLeft: 8 }}
              />
            )}

            <FeedLogoutButton
              onPress={handleLogout}
              style={{ marginLeft: 8 }}
              minWidth={70}
            />
          </>
        )}
      />

      {/* Profile card */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingTop: 12,
        borderBottomWidth: 0,
        marginBottom: 12,
      }}>
        <View
          style={{
            height: 240,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#bfdbfe",
            backgroundColor: "#eff6ff",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {profileCoverUrl ? (
            <Image
              source={{ uri: profileCoverUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <>
              <Ionicons name="image-outline" size={24} color="#60a5fa" />
              <Text style={{ marginTop: 6, color: "#60a5fa", fontWeight: "500", fontSize: 12 }}>
                Cover photo
              </Text>
            </>
          )}

          <View
            style={{
              position: "absolute",
              left: 14,
              bottom: 12,
              width: 84,
              height: 84,
              borderRadius: 42,
              borderWidth: 3,
              borderColor: "#fff",
              backgroundColor: "#dbeafe",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {profileAvatarUrl ? (
              <Image
                source={{ uri: profileAvatarUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person-outline" size={34} color="#3b82f6" />
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 4 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#1f2937",
            }}
            numberOfLines={1}
          >
            {profileDisplayName}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              color: "#6b7280",
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            @{username}
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 13,
              color: profileBio ? "#374151" : "#9ca3af",
            }}
            numberOfLines={2}
          >
            {profileBio || "No bio yet"}
          </Text>
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
