/*
Kind:
Component

Role:
User profile

Responsibility:
- Display user profile
- Display and own switchable tabs(post/like/following/followers)
- Display feed-lings for post/like
- Display user lists for following/followers
- Delegate feed logic and rendering
- Delegate user list logic and rendering

Owns:
- Profile meta
- Current tab info
- Followers/following info

Delegates:
- Auth state → useAuth
- Layout → PageShell
- Feed state → useActivities
- Activity rendering → ActivityList
- User(not user list) rendering → UserRow

Used by:
- Expo Router

TODO:
change the shape to 
->
profile info stays. there isnt anything to handle anyway
keep a tab state
if tab is posts: call activitylist with types as post
if tab is likes: call activitylist with types as likes
if tab is followers: call a useFollow , call a userList(list=usefollow.followers)
if tab is followers: call a useFollow , call a userList(list=usefollow.following)
*/

import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { UserRow } from "@/components/user/UserRow";
import { ActivityList } from "@/components/feed/ActivityList";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { UserSettingsButton } from "@/components/common/SettingsButton";
import { FeedLogoutButton } from "@/components/common/LogoutButton";
import { useActivities } from "@/hooks/useActivities";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchFollowers,
  fetchFollowing,
  fetchUserProfileMeta,
  followUser,
  unfollowUser,
} from "@/graphql/client";

type Tab =
  | "posts"
  | "likes"
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

/**
 * Only mounted for the "posts"/"likes" tabs. Keeping this as its own
 * component means useActivities (and its fetch) never runs at all for
 * "followers"/"following" — those tabs have their own data source and
 * the backend rejects an empty `types` array, so we don't want the hook
 * instantiated in that case, not even with a placeholder type.
 */
function TabFeed({
  username,
  tab,
}: {
  username?: string;
  tab: "posts" | "likes";
}) {
  const type = useMemo(() => (tab === "posts" ? ["post"] : ["like"]), [tab]);
  const feed = useActivities({ username, types: type });
  return <ActivityList feed={feed} />;
}

export default function UsernameScreen() {
  const { username } =
    useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };


  /* ---------------- PROFILE HYDRATION ---------------- */

  const [profileMeta, setProfileMeta] = useState<ProfileMeta | null>(null);

  const profileDisplayName = profileMeta?.displayName?.trim() || username;
  const profileBio = profileMeta?.bio?.trim();
  const profileAvatarUrl = profileMeta?.avatarUrl?.trim();
  const profileCoverUrl = profileMeta?.coverUrl?.trim();
  const isOwnProfile = user?.username === username;

  useEffect(() => {
    if (!username) {
      setProfileMeta(null);
      return;
    }

    let cancelled = false;

    const loadProfileMeta = async () => {
      try {
        const profile = await fetchUserProfileMeta(username);
        if (cancelled) return;
        setProfileMeta(profile ?? null);
      } catch {
        if (!cancelled) setProfileMeta(null);
      }
    };

    loadProfileMeta();
    return () => { cancelled = true; };
  }, [username]);


  /* ---------------- TAB ---------------- */

  const [tab, setTab] = useState<Tab>("posts"); //default is posts tab


  /* ---------------- FOLLOW STUFF ---------------- */

  const [followUsers, setFollowUsers] = useState<FollowUser[]>([]);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (tab !== "followers" && tab !== "following") return;

    const load = async () => {
      setFollowLoading(true);
      try {
        const rows = tab === "followers"
          ? await fetchFollowers(username)
          : await fetchFollowing(username);
        setFollowUsers(rows);
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

    try {
      if (shouldFollow) {
        await followUser(targetUsername);
      } else {
        await unfollowUser(targetUsername);
      }
    } catch (err: unknown) {
      console.error("[UsernameScreen] follow toggle failed", err);
    }
  };


  /* ---------------- RENDER ---------------- */

  return (
    <PageShell
      header={<Header
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
                  if (!username) return;
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
      />}
    >
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.coverContainer}>
          {profileCoverUrl ? (
            <Image
              source={{ uri: profileCoverUrl }}
              style={styles.fullSize}
              resizeMode="cover"
            />
          ) : (
            <>
              <Ionicons name="image-outline" size={24} color="#60a5fa" />
              <Text style={styles.coverPlaceholderText}>Cover photo</Text>
            </>
          )}

          <View style={styles.avatarContainer}>
            {profileAvatarUrl ? (
              <Image
                source={{ uri: profileAvatarUrl }}
                style={styles.fullSize}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person-outline" size={34} color="#3b82f6" />
            )}
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.displayName} numberOfLines={1}>
            {profileDisplayName}
          </Text>
          <Text style={styles.usernameText} numberOfLines={1}>
            @{username}
          </Text>
          <Text
            style={[styles.bioText, { color: profileBio ? "#374151" : "#9ca3af" }]}
            numberOfLines={2}
          >
            {profileBio || "No bio yet"}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsRow}>
          {(["posts", "likes", "followers", "following"] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabButton, tab === t && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Followers / Following */}
      {(tab === "followers" || tab === "following") && (
        <View style={styles.followListContainer}>
          {followLoading && (
            <View style={styles.followLoadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          )}

          {!followLoading && (
            <View style={styles.followListInner}>
              {followUsers.map(followUser => (
                <View key={followUser.id} style={styles.followUserCard}>
                  <UserRow
                    user={followUser}
                    currentUserId={user?.id}
                    onToggleFollow={handleToggleFollowInList}
                    isCompact={false}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Activity Based Tabs */}
      {(tab === "posts" || tab === "likes") && (
        <TabFeed username={username} tab={tab} />
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    paddingHorizontal: 0,
    paddingTop: 12,
    borderBottomWidth: 0,
    marginBottom: 12,
  },
  coverContainer: {
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
  },
  fullSize: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholderText: {
    marginTop: 6,
    color: "#60a5fa",
    fontWeight: "500",
    fontSize: 12,
  },
  avatarContainer: {
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
  },
  profileInfo: {
    paddingHorizontal: 4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  usernameText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 2,
  },
  bioText: {
    marginTop: 8,
    fontSize: 13,
  },
  tabsContainer: {
    marginHorizontal: 0,
    marginBottom: 4,
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
  },
  tabsRow: {
    flexDirection: "row",
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#2563eb",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  tabText: {
    fontWeight: "500",
    color: "#9ca3af",
    fontSize: 11,
    textAlign: "center",
  },
  tabTextActive: {
    fontWeight: "600",
    color: "#2563eb",
  },
  followListContainer: {
    flex: 1,
  },
  followLoadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  followListInner: {
    paddingTop: 8,
  },
  followUserCard: {
    backgroundColor: "#fff",
    marginHorizontal: 0,
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
  },
});