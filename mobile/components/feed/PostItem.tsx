import { View, Text, TouchableOpacity } from "react-native";
import { Post } from "@/types/Post";
import { feedStyles } from "@/styles/feed";

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

      <Text style={feedStyles.author}>User: {post.user.username}</Text>

      <Text style={feedStyles.content}>{post.content}</Text>

      <View style={feedStyles.footer}>
        <Text style={feedStyles.timestamp}>
          {new Date(post.createdAt).toLocaleString()}
        </Text>

        <View style={feedStyles.stats}>
          <Text style={feedStyles.stat}>👍 {post.likes}</Text>
          <Text style={feedStyles.stat}>🔁 {post.shares}</Text>
        </View>
      </View>
    </View>
  );
}
