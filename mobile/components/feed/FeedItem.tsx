import React from "react";
import { Activity } from "@/types/Activity";
import { PostItem } from "@/components/feed/PostItem";
import { ActivityRow } from "@/components/feed/ActivityRow";

type Props = {
  activity: Activity;
  currentUserId: number | null;
  onDeletePost?: (postId: number) => void;
  onToggleFollow?: (username: string, follow: boolean) => void;
  onToggleLike?: (postId: number, currentlyLiked: boolean) => Promise<void>;
};

export function FeedItem({ activity, currentUserId, onDeletePost, onToggleFollow, onToggleLike }: Props) {
  // only render actual 'post' activities as PostItem
  if (activity.type === "post" || activity.type === "share") {
    return (
      <PostItem
        post={activity.targetPost!}
        currentUserId={currentUserId}
        onDelete={onDeletePost ?? (() => {})}
        onToggleFollow={onToggleFollow}
        onToggleLike={onToggleLike}
      />
    );
  }

  // everything else (like/follow) is rendered as ActivityRow
  return (
    <ActivityRow
      activity={activity}
      currentUserId={currentUserId ?? undefined}
      onToggleFollow={onToggleFollow}
    />
  );
}
