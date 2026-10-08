/*
Kind:
Component

Role:
Profile screen coordinator

Responsibility:
- Keep profile metadata visible
- Own active tab state (posts / likes / followers / following)
- Route posts/likes tabs to ActivityList + useActivities(types)
- Route followers/following tabs to UserList + useFollow

Owns:
- Profile metadata
- Active tab state

Delegates:
- Auth state → useAuth
- Layout → PageShell
- Feed state + mutations → useActivities
- Follow-list state + mutations → useFollow
- Activity rendering → ActivityList
- User-list rendering → UserList

Used by:
- Expo Router
*/

import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { UserList } from "@/components/user/UserList";
import { ActivityList } from "@/components/feed/ActivityList";
import { Header } from "@/components/layout/Header";
import { AppHeaderActions } from "@/components/layout/AppHeaderActions";
import { PageShell } from "@/components/layout/PageShell";
import { useActivities } from "@/hooks/useActivities";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { useI18n } from "@/hooks/useI18n";
import { ActivityType } from "@/types/Activity";
import {
  fetchUserProfileMeta,
} from "@/graphql/client";
import {
  profileBioColorStyle,
  profileUsernameStyles as styles,
} from "@/styles";

type Tab =
  | "posts"
  | "likes"
  | "followers"
  | "following";

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
  isOwnProfile,
}: {
  username?: string;
  tab: "posts" | "likes";
  isOwnProfile: boolean;
}) {
  const type = useMemo<ActivityType[]>(() => (tab === "posts" ? ["post"] : ["like"]), [tab]);
  const feed = useActivities({
    types: type,
    scopeUsername: username,
    includeSelfLikes: isOwnProfile,
  });

  return (
    <ActivityList feed={feed} />
  );
}

export default function UsernameScreen() {
  const { username } =
    useLocalSearchParams<{ username: string }>();
  const { user } = useAuth();
  const { t } = useI18n();


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


  const followers = useFollow({
    type: "followers",
    username,
    enabled: tab === "followers",
  });

  const following = useFollow({
    type: "following",
    username,
    enabled: tab === "following",
  });

  const activeUserList = tab === "followers" ? followers : following;


  /* ---------------- RENDER ---------------- */

  return (
    <PageShell
      header={<Header
        title="BookBook"
        rightActions={<AppHeaderActions mode="profile" username={username} isOwnProfile={isOwnProfile} />}
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
              <Text style={styles.coverPlaceholderText}>{t("profile.coverPlaceholder")}</Text>
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
            style={[styles.bioText, profileBioColorStyle(!!profileBio)]}
            numberOfLines={2}
          >
            {profileBio || t("profile.noBio")}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsRow}>
          {(["posts", "likes", "followers", "following"] as Tab[]).map(tabKey => (
            <TouchableOpacity
              key={tabKey}
              onPress={() => setTab(tabKey)}
              style={[styles.tabButton, tab === tabKey && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, tab === tabKey && styles.tabTextActive]}>
                {t(`profile.tab.${tabKey}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Followers / Following */}
      {(tab === "followers" || tab === "following") && (
        <View style={styles.followListContainer}>
          <UserList
            follow={activeUserList}
            currentUserId={user?.id}
            isCompact={false}
          />
        </View>
      )}

      {/* Activity Based Tabs */}
      {(tab === "posts" || tab === "likes") && (
        <TabFeed username={username} tab={tab} isOwnProfile={isOwnProfile} />
      )}
    </PageShell>
  );
}

