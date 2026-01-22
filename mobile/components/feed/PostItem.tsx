import { View, Text, TouchableOpacity } from "react-native";
import { Post } from "@/types/Post";
import { feedStyles } from "@/styles/feed";
import { ProfileLink } from "@/components/common/ProfileLink";

type Props = {
  post: Post;
  currentUserId: number | null;
  onDelete: (postId: number) => void;
};

export function PostItem({ post, currentUserId, onDelete }: Props) {
  const isOwner = currentUserId === post.user.id;

  return (
    <View style={feedStyles.postCard}>
      {isOwner && (
        <TouchableOpacity
          style={feedStyles.deleteButton}
          activeOpacity={0.7}
          onPress={() => onDelete(post.id)}
        >
          <Text style={feedStyles.deleteText}>DELETE</Text>
        </TouchableOpacity>
      )}

      <ProfileLink username={post.user.username}>
  User: @{post.user.username}
</ProfileLink>

      <Text style={feedStyles.content}>{post.content}</Text>

      <View style={feedStyles.footer}>
        <Text style={feedStyles.timestamp}>
          {new Date(post.createdAt).toLocaleString()}
        </Text>

      </View>
    </View>
  );
}
