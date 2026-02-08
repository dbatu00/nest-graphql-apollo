import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { feedStyles } from "@/styles/feed";

type Props = {
  postId: number;
  likedByMe: boolean;
  likesCount: number;
  onToggleLike: (postId: number, currentlyLiked: boolean) => Promise<void>;
};

export function LikeButton({ postId, likedByMe, likesCount, onToggleLike }: Props) {
  return (
    <TouchableOpacity style={feedStyles.likeButton} onPress={() => onToggleLike(postId, likedByMe)}>
      <Text style={{ color: likedByMe ? 'red' : 'gray' }}>♥</Text>
      <Text>{likesCount}</Text>
    </TouchableOpacity>
  );
}
