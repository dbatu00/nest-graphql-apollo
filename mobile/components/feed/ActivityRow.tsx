import React from "react";
import { View, Text, Pressable } from "react-native";
import { Activity, ActivityType } from "@/types/Activity";

type Props = {
  activity: Activity;
  onToggleFollow?: (username: string, shouldFollow: boolean) => void;
};

export const ActivityRow = ({ activity, onToggleFollow }: Props) => {
  const { type, actor, targetUser, targetPost, createdAt } = activity;

  // Build display message based on activity type
  let message = "";
  switch (type) {
    case "post":
      message = `${actor.username} posted: "${targetPost?.content}"`;
      break;
    case "like":
      message = `${actor.username} liked a post: "${targetPost?.content}"`;
      break;
    case "share":
      message = `${actor.username} shared a post: "${targetPost?.content}"`;
      break;
    case "follow":
      message = `${actor.username} followed ${targetUser?.username}`;
      break;
  }

  // Optional follow button for "follow" activities
  const renderFollowButton = () => {
    if (type !== "follow" || !onToggleFollow || !targetUser) return null;
    // You could add logic to check if the current user already follows targetUser
    const shouldFollow = true; // assume we want to follow/unfollow
    return (
      <Pressable
        onPress={() => onToggleFollow(targetUser.username, shouldFollow)}
        style={{
          marginLeft: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          backgroundColor: "#eee",
          borderRadius: 4,
        }}
      >
        <Text>{shouldFollow ? "Follow" : "Unfollow"}</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: "#eee",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text style={{ flex: 1 }}>{message}</Text>
      {renderFollowButton()}
      <Text style={{ fontSize: 12, color: "#999", marginLeft: 8 }}>
        {new Date(createdAt).toLocaleString()}
      </Text>
    </View>
  );
};
