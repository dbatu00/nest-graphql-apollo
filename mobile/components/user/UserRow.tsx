import { View, Text, Pressable, Platform } from "react-native";
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
  isCompact?: boolean;
  onProfileNavigate?: () => void;
};

export function UserRow({
  user,
  currentUserId,
  onToggleFollow,
  onDelete,
  isCompact = false,
  onProfileNavigate,
}: UserRowProps) {
  const isSelf = currentUserId === user.id;

  const cardStyle = !isCompact ? {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  } : {
    paddingVertical: 4,
    paddingHorizontal: 0,
  };

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: isCompact ? "center" : "center",
        ...cardStyle,
      }}
    >
      {/* Name / Profile link */}
      <ProfileLink username={user.username} onNavigate={onProfileNavigate}>
        <View
          style={{
            backgroundColor: "#dbeafe",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontWeight: "600", fontSize: isCompact ? 13 : 14, color: "#1e40af" }}>{user.username}</Text>
        </View>
      </ProfileLink>

      {/* Action button */}
      {isSelf ? (
        onDelete && (
          <Pressable
            onPress={() => onDelete(user.id)}
            style={{
              backgroundColor: "#000",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>Delete</Text>
          </Pressable>
        )
      ) : (
        typeof user.followedByMe === "boolean" &&
        onToggleFollow && (
          <Pressable 
            onPress={() => onToggleFollow(user.username, !user.followedByMe)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: user.followedByMe ? "#e0e7ff" : "#f0f9ff",
              borderWidth: 1,
              borderColor: user.followedByMe ? "#c7d2fe" : "#bfdbfe",
            }}
          >
            <Text style={{ fontWeight: "600", color: user.followedByMe ? "#2563eb" : "#0284c7", fontSize: 12 }}>
              {user.followedByMe ? "Following" : "Follow"}
            </Text>
          </Pressable>
        )
      )}
    </View>
  );
}
