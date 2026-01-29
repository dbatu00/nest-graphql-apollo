import { View, Text, Pressable } from "react-native";
import { ProfileLink } from "@/components/common/ProfileLink";

type UserRowProps = {
  user: {
    id: number;
    username: string;
    displayName?: string;
    followedByMe?: boolean;
  };
  currentUserId?: number;
  onToggleFollow?: (username: string, shouldFollow: boolean) => void;
  onDelete?: (userId: number) => void;
};

export function UserRow({
  user,
  currentUserId,
  onToggleFollow,
  onDelete,
}: UserRowProps) {
  const isSelf = currentUserId === user.id;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
      }}
    >
      {/* Name / Profile link */}
      <ProfileLink username={user.username}>
        <View>
          {user.displayName && (
            <Text style={{ fontWeight: "bold" }}>{user.displayName}</Text>
          )}
          <Text style={{ color: "#666" }}>@{user.username}</Text>
        </View>
      </ProfileLink>

      {/* Action button */}
      {isSelf ? (
        onDelete && (
          <Pressable
            onPress={() => onDelete(user.id)}
            style={{
              backgroundColor: "#000", // black box
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Delete</Text>
          </Pressable>
        )
      ) : (
        typeof user.followedByMe === "boolean" &&
        onToggleFollow && (
          <Pressable onPress={() => onToggleFollow(user.username, !user.followedByMe)}>
            <Text style={{ fontWeight: "bold" }}>
              {user.followedByMe ? "Unfollow" : "Follow"}
            </Text>
          </Pressable>
        )
      )}
    </View>
  );
}
