import { View, Text, Pressable } from "react-native";

type Props = {
  user: {
    id: number;
    username: string;
    displayName?: string;
  };
  followedByMe?: boolean;
  onToggleFollow?: (username: string, shouldFollow: boolean) => void;
};

export function UserRow({
  user,
  followedByMe,
  onToggleFollow,
}: Props) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <View>
        <Text>{user.displayName ?? user.username}</Text>
        <Text style={{ color: "#666" }}>@{user.username}</Text>
      </View>

      {typeof followedByMe === "boolean" && onToggleFollow && (
        <Pressable
          onPress={() =>
            onToggleFollow(user.username, !followedByMe)
          }
        >
          <Text>
            {followedByMe ? "Unfollow" : "Follow"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
