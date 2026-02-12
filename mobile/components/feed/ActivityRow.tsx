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

  let contentNode: React.ReactNode = null;

  switch (type) {
    case "post":
      contentNode = (
        <Text style={{ marginBottom: 8 }}>
          <ProfileLink username={actor.username}>
            {actor.displayName ?? actor.username}
          </ProfileLink>
          {" posted"}
        </Text>
      );
      break;

    case "like":
      contentNode = (
        <Text style={{ marginBottom: 8 }}>
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
      break;

    case "share":
      contentNode = (
        <Text style={{ marginBottom: 8 }}>
          <ProfileLink username={actor.username}>
            {actor.displayName ?? actor.username}
          </ProfileLink>
          {" shared "}
          <ProfileLink username={targetPost?.user.username ?? ""}>
            {targetPost?.user.username}
          </ProfileLink>
          {"'s post"}
        </Text>
      );
      break;

    case "follow":
      contentNode = (
        <Text style={{ marginBottom: 8 }}>
          <ProfileLink username={actor.username}>
            {actor.displayName ?? actor.username}
          </ProfileLink>
          {" followed "}
          <ProfileLink username={targetUser?.username ?? ""}>
            {targetUser?.displayName ?? targetUser?.username}
          </ProfileLink>
        </Text>
      );
      break;
  }

  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: "#eee",
      }}
    >
      {contentNode}

      {/* Nested post for post / like / share */}
      {targetPost &&
        (type === "post" || type === "like" || type === "share") && (
          <PostItem
            post={targetPost}
            currentUserId={currentUserId ?? null}
            onDelete={onDeletePost ?? (() => {})}
            onToggleFollow={onToggleFollow}
            onToggleLike={onToggleLike}
            onPressLikes={onPressLikes}
          />
        )}

      <Text style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
        {new Date(createdAt).toLocaleString()}
      </Text>
    </View>
  );
};
