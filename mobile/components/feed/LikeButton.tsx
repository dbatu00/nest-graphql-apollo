import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { feedStyles } from "@/styles/feed";

type Props = {
  postId: number;
  likedByMe: boolean;
  likesCount: number;
  onToggleLike: (postId: number, currentlyLiked: boolean) => Promise<void>;
  onPressCount: (postId: number) => void;
};

export function LikeButton({
  postId,
  likedByMe,
  likesCount,
  onToggleLike,
  onPressCount,
}: Props) {
  return (
    <View style={feedStyles.likeButton}>
      <TouchableOpacity onPress={() => onToggleLike(postId, likedByMe)}>
        <Text style={{ color: likedByMe ? "red" : "gray" }}>♥</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onPressCount(postId)}>
        <Text>{likesCount}</Text>
      </TouchableOpacity>
    </View>
  );
}
