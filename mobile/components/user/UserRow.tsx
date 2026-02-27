import { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);

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
            onHoverIn={() => setIsDeleteHovered(true)}
            onHoverOut={() => setIsDeleteHovered(false)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
            }}
          >
            <MaterialCommunityIcons
              name={isDeleteHovered ? "trash-can" : "trash-can-outline"}
              size={16}
              color={isDeleteHovered ? "#000000" : "#6b7280"}
              style={{
                transform: [
                  { translateY: isDeleteHovered ? -1 : 0 },
                  { rotate: isDeleteHovered && Platform.OS === "web" ? "-12deg" : "0deg" },
                  { scale: isDeleteHovered ? 1.06 : 1 },
                ],
              }}
            />
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
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name={user.followedByMe ? "account-check-outline" : "account-plus-outline"}
                size={14}
                color={user.followedByMe ? "#2563eb" : "#0284c7"}
              />
              <Text
                style={{
                  fontWeight: "600",
                  color: user.followedByMe ? "#2563eb" : "#0284c7",
                  fontSize: 12,
                  marginLeft: 6,
                }}
              >
                {user.followedByMe ? "Following" : "Follow"}
              </Text>
            </View>
          </Pressable>
        )
      )}
    </View>
  );
}
