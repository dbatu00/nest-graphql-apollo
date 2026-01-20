import { FlatList, View } from "react-native";
import { Post } from "@/types/Post";
import { feedStyles } from "@/styles/feed";
import { PostItem } from "./PostItem";

type Props = {
  posts: Post[];
  currentUserId: number | null;
  onDelete: (postId: number) => void;
};

export function PostList({ posts, currentUserId, onDelete }: Props) {
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={feedStyles.feedContent}
      ItemSeparatorComponent={() => <View style={feedStyles.separator} />}
      renderItem={({ item }) => (
        <PostItem
          post={item}
          currentUserId={currentUserId}
          onDelete={onDelete}
        />
      )}
    />
  );
}
