import React from "react";
import { View, Text } from "react-native";
import { ProfileLink } from "@/components/common/ProfileLink";
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
  // We render actor/target usernames as clickable links to profiles
  let contentNode: React.ReactNode = null;
  switch (type) {
    case "post":
      contentNode = (
        <Text style={{ marginBottom: 6 }}>
          <ProfileLink username={actor.username}>{actor.displayName ?? actor.username}</ProfileLink>
          {` posted: "${targetPost?.content}"`}
        </Text>
      );
      break;
    case "like":
      contentNode = (
        <Text style={{ marginBottom: 6 }}>
          <ProfileLink username={actor.username}>{actor.displayName ?? actor.username}</ProfileLink>
          {` liked a post: "${targetPost?.content}"`}
        </Text>
      );
      break;
    case "share":
      contentNode = (
        <Text style={{ marginBottom: 6 }}>
          <ProfileLink username={actor.username}>{actor.displayName ?? actor.username}</ProfileLink>
          {` shared a post: "${targetPost?.content}"`}
        </Text>
      );
      break;
    case "follow":
      contentNode = (
        <Text style={{ marginBottom: 6 }}>
          <ProfileLink username={actor.username}>{actor.displayName ?? actor.username}</ProfileLink>
          {" followed "}
          <ProfileLink username={targetUser?.username ?? ""}>{targetUser?.displayName ?? targetUser?.username}</ProfileLink>
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
      {/* Message / follow display (with clickable profile links) */}
      {contentNode}


      {/* Timestamp */}
      <Text style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
        {new Date(createdAt).toLocaleString()}
      </Text>
    </View>
  );
};
