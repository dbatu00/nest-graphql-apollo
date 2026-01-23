import { View, Text, TouchableOpacity } from "react-native";
import { Post } from "@/types/Post";
import { feedStyles } from "@/styles/feed";
import { ProfileLink } from "@/components/common/ProfileLink";

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
  const canFollow =
    currentUserId !== null && post.user.id !== currentUserId;

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

      {/* Author + Follow */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <ProfileLink username={post.user.username}>
          @{post.user.username}
        </ProfileLink>

        {canFollow && (
          <TouchableOpacity
            onPress={() =>
              onToggleFollow(
                post.user.username,
                !post.user.isFollowedByMe
              )
            }
          >
            <Text style={{ fontWeight: "600" }}>
              {post.user.isFollowedByMe ? "Unfollow" : "Follow"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
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
