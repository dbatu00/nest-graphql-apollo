import React from "react";
import { View, Text } from "react-native";
import { ProfileLink } from "@/components/common/ProfileLink";
import { Activity } from "@/types/Activity";
import { PostItem } from "@/components/feed/PostItem";

type Props = {
  activity: Activity;
  currentUserId?: number;
  onToggleFollow?: (username: string, shouldFollow: boolean) => void;
  onDeletePost?: (postId: number) => void;
  onToggleLike?: (postId: number, currentlyLiked: boolean) => Promise<void>;
  onPressLikes?: (postId: number) => void;
};

export const ActivityRow = ({
  activity,
  currentUserId,
  onToggleFollow,
  onDeletePost,
  onToggleLike,
  onPressLikes,
}: Props) => {
  const { type, actor, targetUser, targetPost, createdAt } = activity;

  const isPost = type === "post";
  const isNested = type === "like" || type === "share";

  /* ---------------- Header Rendering ---------------- */

  const renderHeader = () => {
    if (type === "post") return null;

    switch (type) {
      case "like":
        return (
          <Text style={styles.headerText}>
            <ProfileLink username={actor.username}>
              {actor.displayName ?? actor.username}
            </ProfileLink>
            {" liked "}
            <ProfileLink username={targetPost?.user.username ?? ""}>
              {
                targetPost?.user.username}
            </ProfileLink>
            {"'s post"}
          </Text>
        );

      case "share":
        return (
          <Text style={styles.headerText}>
            <ProfileLink username={actor.username}>
              {actor.displayName ?? actor.username}
            </ProfileLink>
            {" shared "}
            <ProfileLink username={targetPost?.user.username ?? ""}>
              {
                targetPost?.user.username}
            </ProfileLink>
            {"'s post"}
          </Text>
        );

      case "follow":
        return (
          <Text style={styles.headerText}>
            <ProfileLink username={actor.username}>
              {actor.displayName ?? actor.username}
            </ProfileLink>
            {" followed "}
            <ProfileLink username={targetUser?.username ?? ""}>
              {targetUser?.displayName ??
                targetUser?.username}
            </ProfileLink>
          </Text>
        );

      default:
        return null;
    }
  };

  /* ---------------- Main Render ---------------- */

  return (
    <View style={styles.container}>
      {renderHeader()}

      {/* Post rendering */}
      {targetPost && (isPost || isNested) && (
        <View style={isNested ? styles.nestedContainer : undefined}>
          <PostItem
            post={targetPost}
            currentUserId={currentUserId ?? null}
            onDelete={onDeletePost ?? (() => {})}
            onToggleFollow={onToggleFollow}
            onToggleLike={onToggleLike}
            onPressLikes={onPressLikes}
          />
        </View>
      )}

      <Text style={styles.timestamp}>
        {new Date(createdAt).toLocaleString()}
      </Text>
    </View>
  );
};

/* ---------------- Styles ---------------- */

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
