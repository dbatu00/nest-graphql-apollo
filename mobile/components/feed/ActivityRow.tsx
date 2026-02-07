import React from "react";
import { View, Text } from "react-native";
import { Activity } from "@/types/Activity";
import { UserRow } from "@/components/user/UserRow";

type Props = {
  activity: Activity;
  currentUserId?: number;
  onToggleFollow?: (username: string, shouldFollow: boolean) => void;
};

export const ActivityRow = ({ activity, currentUserId, onToggleFollow }: Props) => {
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

  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: "#eee",
      }}
    >
      {/* Message for post/like/share */}
      {type !== "follow" && <Text style={{ marginBottom: 6 }}>{message}</Text>}

      {/* Follow row */}
      {type === "follow" && targetUser && onToggleFollow && (
        <UserRow
          user={{
            id: targetUser.id,
            username: targetUser.username,
            displayName: targetUser.displayName,
            followedByMe: targetUser.followedByMe ?? false,
          }}
          currentUserId={currentUserId}
          onToggleFollow={onToggleFollow}
        />
      )}

      {/* Timestamp */}
      <Text style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
        {new Date(createdAt).toLocaleString()}
      </Text>
    </View>
  );
};
