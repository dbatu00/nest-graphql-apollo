import React from "react";
import { View, Text } from "react-native";
import { Post } from "@/types/Post";
import { feedStyles } from "@/styles/feed";
import { UserRow } from "@/components/user/UserRow";
import { LikeButton } from "./LikeButton";

type Props = {
  post: Post;
  currentUserId: number | null;
  onDelete: (postId: number) => void;
  onToggleFollow?: (username: string, follow: boolean) => void;
  onToggleLike?: (postId: number, currentlyLiked: boolean) => Promise<void>;
  onPressLikes?: (postId: number) => void;
};

export function PostItem({
  post,
  currentUserId,
  onDelete,
  onToggleFollow,
  onToggleLike,
  onPressLikes,
}: Props) {
  const isOwner = currentUserId === post.user.id;

  return (
    <View style={feedStyles.postCard}>
      <UserRow
        user={{
          id: post.user.id,
          username: post.user.username,
          displayName: post.user.username,
          followedByMe: post.user.followedByMe,
        }}
        currentUserId={currentUserId ?? undefined}
        onDelete={isOwner ? () => onDelete(post.id) : undefined}
        onToggleFollow={isOwner ? undefined : onToggleFollow}
      />

      <Text style={feedStyles.content}>{post.content}</Text>

      <View style={feedStyles.footer}>
        <Text style={feedStyles.timestamp}>
          {new Date(post.createdAt).toLocaleString()}
        </Text>

        {onToggleLike && onPressLikes && (
          <LikeButton
            postId={post.id}
            likedByMe={post.likedByMe ?? false}
            likesCount={post.likesCount ?? 0}
            onToggleLike={onToggleLike}
            onPressCount={onPressLikes}
          />
        )}
      </View>
    </View>
  );
}
