import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform, Image } from "react-native";
import { useRouter } from "expo-router";
import { ProfileLink } from "@/components/common/ProfileLink";
import { UserRow } from "@/components/user/UserRow";
import { Activity } from "@/types/Activity";
import { feedStyles } from "@/styles/feed";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { GET_LIKED_USERS_QUERY } from "@/graphql/operations";

type Props = {
  activity: Activity;
  currentUserId?: number;
  onToggleFollow?: (username: string, shouldFollow: boolean) => void;
  onDeletePost?: (postId: number) => void;
  onToggleLike?: (postId: number, currentlyLiked: boolean) => Promise<void>;
};

type LikedUser = {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  followedByMe?: boolean;
};

export const ActivityRow = ({
  activity,
  currentUserId,
  onToggleFollow,
  onDeletePost,
  onToggleLike,
}: Props) => {
  const { type, actor, targetUser, targetPost, createdAt } = activity;
  const router = useRouter();

  const isNested = type === "like" || type === "share";
  const isOwner = currentUserId === targetPost?.user.id;

  /* ---------- LIKES MODAL STATE ---------- */
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [likedModalVisible, setLikedModalVisible] = useState(false);
  const [likedLoading, setLikedLoading] = useState(false);

  const handleOpenLikesModal = async (postId: number) => {
    try {
      setLikedLoading(true);
      setLikedModalVisible(true);

      const data = await graphqlFetch<{
        post: { likedUsers: LikedUser[] };
      }>(GET_LIKED_USERS_QUERY, { postId });

      setLikedUsers(data.post.likedUsers);
    } catch (err: unknown) {
      console.error("[ActivityRow] failed to load liked users", err);
      setLikedUsers([]);
    } finally {
      setLikedLoading(false);
    }
  };

  const handleToggleFollowInModal = async (
    username: string,
    shouldFollow: boolean
  ) => {
    setLikedUsers(prev =>
      prev.map(u =>
        u.username === username
          ? { ...u, followedByMe: shouldFollow }
          : u
      )
    );

    if (onToggleFollow) {
      await onToggleFollow(username, shouldFollow);
    }
  };



  /* ---------- HEADER ---------- */

  const renderHeader = () => {
    if (type === "post") return null;


    if (type === "like") {
      const actorLabel = actor.displayName?.trim() || actor.username;
      const actorAvatarUri = actor.avatarUrl?.trim()
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(actorLabel)}&background=e5e7eb&color=374151&size=64`;

      return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 8 }}>
            <Image
              source={{ uri: actorAvatarUri }}
              style={{ width: 32, height: 32, borderRadius: 16, marginRight: 6 }}
            />
            <ProfileLink username={actor.username}>
              <Text style={styles.headerNameText}>{actorLabel}</Text>
            </ProfileLink>
            <Text style={styles.headerText}> liked </Text>
          </View>
          <Text style={styles.timestamp}>
            {new Date(createdAt).toLocaleString()}
          </Text>
        </View>
      );
    }

    if (type === "follow") {
      const actorLabel = actor.displayName?.trim() || actor.username;
      const targetUserLabel = targetUser?.displayName?.trim() || targetUser?.username;
      const actorAvatarUri = actor.avatarUrl?.trim()
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(actorLabel)}&background=e5e7eb&color=374151&size=64`;
      const targetUserAvatarUri = targetUser?.avatarUrl?.trim()
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUserLabel ?? "")}&background=e5e7eb&color=374151&size=64`;

      return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 8 }}>
            <Image
              source={{ uri: actorAvatarUri }}
              style={{ width: 32, height: 32, borderRadius: 16, marginRight: 6 }}
            />
            <ProfileLink username={actor.username}>
              <Text style={styles.headerNameText}>{actorLabel}</Text>
            </ProfileLink>
            <Text style={styles.headerText}> followed </Text>
            <ProfileLink username={targetUser?.username ?? ""}>
              <Text style={styles.headerNameText}>{targetUserLabel ?? ""}</Text>
            </ProfileLink>
            <Image
              source={{ uri: targetUserAvatarUri }}
              style={{ width: 32, height: 32, borderRadius: 16, marginLeft: 6 }}
            />
          </View>
          <Text style={styles.timestamp}>
            {new Date(createdAt).toLocaleString()}
          </Text>
        </View>
      );
    }

    return null;
  };

  /* ---------- POST CARD ---------- */

  const renderPost = () => {
    if (!targetPost) return null;

    return (
      <View style={feedStyles.postCard}>
        <UserRow
          user={{
            id: targetPost.user.id,
            username: targetPost.user.username,
            displayName: targetPost.user.displayName,
            avatarUrl: targetPost.user.avatarUrl,
            followedByMe: targetPost.user.followedByMe,
          }}
          currentUserId={currentUserId}
          onDelete={
            isOwner && onDeletePost
              ? () => onDeletePost(targetPost.id)
              : undefined
          }
          onToggleFollow={!isOwner ? onToggleFollow : undefined}
          isCompact={true}
        />

        <View 
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: 8,
            padding: 10,
            minHeight: 110,
            marginVertical: 4,
            marginHorizontal: 0,
            flexDirection: "column",
            justifyContent: "space-between",
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
          <Text style={feedStyles.content}>{targetPost.content}</Text>
          
          <Text style={{ fontSize: 12, color: "#d1d5db", marginTop: 4, alignSelf: "flex-end" }}>
            {new Date(targetPost.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  /* ---------- MAIN ---------- */

  return (
    <>
      <View style={styles.container}>
        {renderHeader()}

        {targetPost && (
          <View style={isNested ? styles.nestedContainer : undefined}>
            {renderPost()}
          </View>
        )}

        {targetPost && onToggleLike && (
          <View style={{ marginTop: 4, flexDirection: "row", justifyContent: "flex-end" }}>
            <View style={feedStyles.likeButton}>
              <TouchableOpacity
                onPress={() =>
                  onToggleLike(targetPost.id, targetPost.likedByMe ?? false)
                }
              >
                <Text
                  style={{
                    color: targetPost.likedByMe ? "red" : "gray",
                  }}
                >
                  ♥
                </Text>
              </TouchableOpacity>

              {(targetPost.likesCount ?? 0) > 0 && (
                <TouchableOpacity
                  onPress={() => handleOpenLikesModal(targetPost.id)}
                >
                  <Text>{targetPost.likesCount}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Liked Users Modal */}
      <Modal visible={likedModalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
          <View style={{ 
            paddingHorizontal: 16, 
            paddingVertical: 16,
            backgroundColor: "#fff",
            borderBottomWidth: 0,
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
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1f2937" }}>
                Liked by
              </Text>
              <TouchableOpacity
                onPress={() => setLikedModalVisible(false)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: "#f3f4f6",
                }}
              >
                <Text style={{ fontWeight: "600", color: "#374151", fontSize: 13 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!likedLoading && (
            <ScrollView style={{ flex: 1, paddingTop: 8 }}>
              {likedUsers.map(user => (
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
                    currentUserId={currentUserId}
                    onToggleFollow={handleToggleFollowInModal}
                    isCompact={false}
                    onProfileNavigate={() => setLikedModalVisible(false)}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = {
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 6,
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 0,
    borderColor: "transparent",
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  headerText: {
    marginBottom: 0,
    fontSize: 12,
    lineHeight: 16,
    color: "#1f2937",
    includeFontPadding: false,
    textAlignVertical: "center" as const,
  },
  headerNameText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#1f2937",
    fontWeight: "500" as const,
    includeFontPadding: false,
    textAlignVertical: "center" as const,
  },
  nestedContainer: {
    marginLeft: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#e5e7eb",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#d1d5db",
    marginTop: 2,
  },
};
