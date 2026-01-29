import { View, Text } from "react-native";
import { Post } from "@/types/Post";
import { feedStyles } from "@/styles/feed";
import { UserRow } from "@/components/user/UserRow";

type Props = {
  post: Post;
  currentUserId: number | null;
  onDelete: (postId: number) => void;
  onToggleFollow: (username: string, follow: boolean) => void;
};

export function PostItem({
  post,
  currentUserId,
  onDelete,
  onToggleFollow,
}: Props) {
  const isOwner = currentUserId === post.user.id;

  return (
    <View style={feedStyles.postCard}>
      {/* User row: handles follow/unfollow or delete */}
      <UserRow
        user={{
          id: post.user.id,
          username: post.user.username,
          displayName: post.user.username, // or use displayName if available
          followedByMe: post.user.followedByMe,
        }}
        currentUserId={currentUserId ?? undefined}
        onDelete={isOwner ? () => onDelete(post.id) : undefined}
        onToggleFollow={isOwner ? undefined : onToggleFollow}
      />

      {/* Post content */}
      <Text style={feedStyles.content}>{post.content}</Text>

      {/* Footer */}
      <View style={feedStyles.footer}>
        <Text style={feedStyles.timestamp}>
          {new Date(post.createdAt).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}
