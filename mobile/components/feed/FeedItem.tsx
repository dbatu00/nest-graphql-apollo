import React from "react";
import { Activity } from "@/types/Activity";
import { ActivityRow } from "@/components/feed/ActivityRow";

type Props = {
  activity: Activity;
  currentUserId: number | null;
  onDeletePost?: (postId: number) => void;
  onToggleFollow?: (username: string, follow: boolean) => void;
  onToggleLike?: (postId: number, currentlyLiked: boolean) => Promise<void>;
  onPressLikes?: (postId: number) => void;
};

export function FeedItem({
  activity,
  currentUserId,
  onDeletePost,
  onToggleFollow,
  onToggleLike,
  onPressLikes,
}: Props) {
  return (
    <ActivityRow
      activity={activity}
      currentUserId={currentUserId ?? undefined}
      onToggleFollow={onToggleFollow}
      onDeletePost={onDeletePost}
      onToggleLike={onToggleLike}
      onPressLikes={onPressLikes}
    />
  );
}
