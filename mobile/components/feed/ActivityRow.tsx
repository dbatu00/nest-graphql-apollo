import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from "react-native";
import { ProfileLink } from "@/components/common/ProfileLink";
import { UserRow } from "@/components/user/UserRow";
import { Activity } from "@/types/Activity";
import { feedStyles } from "@/styles/feed";
import { graphqlFetch } from "@/utils/graphqlFetch";

type Props = {
  activity: Activity;
  currentUserId?: number;
  onToggleFollow?: (username: string, shouldFollow: boolean) => void;
  onDeletePost?: (postId: number) => void;
  onToggleLike?: (postId: number, currentlyLiked: boolean) => Promise<void>;
};

export const ActivityRow = ({
  activity,
  currentUserId,
  onToggleFollow,
  onDeletePost,
  onToggleLike,
}: Props) => {
  const { type, actor, targetUser, targetPost, createdAt } = activity;

  const isNested = type === "like" || type === "share";
  const isOwner = currentUserId === targetPost?.user.id;

  /* ---------- LIKES MODAL STATE ---------- */
  const [likedUsers, setLikedUsers] = useState<any[]>([]);
  const [likedModalVisible, setLikedModalVisible] = useState(false);
  const [likedLoading, setLikedLoading] = useState(false);

  const handleOpenLikesModal = async (postId: number) => {
    try {
      setLikedLoading(true);
      setLikedModalVisible(true);

      const data = await graphqlFetch<{
        post: { likedUsers: any[] };
      }>(
        `
        query GetLikedUsers($postId: Int!) {
          post(id: $postId) {
            likedUsers {
              id
              username
              displayName
              followedByMe
            }
          }
        }
        `,
        { postId }
      );

      setLikedUsers(data.post.likedUsers);
    } catch (err) {
      console.error(err);
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
      return (
        <Text style={styles.headerText}>
          <ProfileLink username={actor.username}>
            {actor.displayName ?? actor.username}
          </ProfileLink>
          {" liked "}
          <ProfileLink username={targetPost?.user.username ?? ""}>
            {targetPost?.user.username}
          </ProfileLink>
          {"'s post"}
        </Text>
      );
    }

    if (type === "follow") {
      return (
        <Text style={styles.headerText}>
          <ProfileLink username={actor.username}>
            {actor.displayName ?? actor.username}
          </ProfileLink>
          {" followed "}
          <ProfileLink username={targetUser?.username ?? ""}>
            {targetUser?.displayName ?? targetUser?.username}
          </ProfileLink>
        </Text>
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
            displayName: targetPost.user.username,
            followedByMe: targetPost.user.followedByMe,
          }}
          currentUserId={currentUserId}
          onDelete={
            isOwner && onDeletePost
              ? () => onDeletePost(targetPost.id)
              : undefined
          }
          onToggleFollow={!isOwner ? onToggleFollow : undefined}
        />

        <Text style={feedStyles.content}>{targetPost.content}</Text>

        <View style={feedStyles.footer}>
          <Text style={feedStyles.timestamp}>
            {new Date(targetPost.createdAt).toLocaleString()}
          </Text>

          {onToggleLike && (
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

              <TouchableOpacity
                onPress={() => handleOpenLikesModal(targetPost.id)}
              >
                <Text>{targetPost.likesCount ?? 0}</Text>
              </TouchableOpacity>
            </View>
          )}
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

        <Text style={styles.timestamp}>
          {new Date(createdAt).toLocaleString()}
        </Text>
      </View>

      {/* Liked Users Modal */}
      <Modal visible={likedModalVisible} animationType="slide">
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
            Liked by
          </Text>

          {likedLoading && <ActivityIndicator size="large" />}

          <ScrollView>
            {likedUsers.map(user => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                onToggleFollow={handleToggleFollowInModal}
              />
            ))}
          </ScrollView>

          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={() => setLikedModalVisible(false)}
          >
            <Text style={{ textAlign: "center", color: "blue" }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = {
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerText: {
    marginBottom: 8,
  },
  nestedContainer: {
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#eee",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
};
