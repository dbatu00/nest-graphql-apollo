import React from "react";
import { Activity } from "@/types/Activity";
import { PostItem } from "@/components/feed/PostItem";
import { ActivityRow } from "@/components/feed/ActivityRow";

type Props = {
  activity: Activity;
  currentUserId: number | null;
  onDeletePost?: (postId: number) => void;
  onToggleFollow?: (username: string, follow: boolean) => void;
};
export function FeedItem({
  activity,
  currentUserId,
  onDeletePost,
  onToggleFollow,
}: Props) {
  if (activity.targetPost) {
    return (
      <PostItem
        post={activity.targetPost}
        currentUserId={currentUserId}
        onDelete={onDeletePost ?? (() => {})}
        onToggleFollow={onToggleFollow ?? (() => {})}
      />
    );
  }

  return (
    <ActivityRow
      activity={activity}
      currentUserId={currentUserId ?? undefined}
      onToggleFollow={onToggleFollow}
    />
  );
}
