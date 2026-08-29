import { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ProfileLink } from "@/components/common/ProfileLink";
import {
  userRowCardStyle,
  userRowDeleteIconStyle,
  userRowFollowButtonToneStyle,
  userRowFollowTextToneStyle,
  userRowNameSizeStyle,
  userRowStyles as styles,
} from "@/styles";

type UserRowProps = {
  user: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
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
  const label = user.displayName?.trim() || user.username;
  const avatarUri = user.avatarUrl?.trim()
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=dbeafe&color=1e40af&size=64`;

  const cardStyle = userRowCardStyle(isCompact);

  return (
    <View style={[styles.rootBase, cardStyle]}>
      {/* Name / Profile link */}
      <View style={styles.identityRow}>
        <ProfileLink username={user.username} onNavigate={onProfileNavigate}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
          />
        </ProfileLink>

        <ProfileLink username={user.username} onNavigate={onProfileNavigate}>
          <Text
            style={[styles.nameText, userRowNameSizeStyle(isCompact)]}
          >
            {label}
          </Text>
        </ProfileLink>
      </View>

      {/* Action button */}
      {isSelf ? (
        onDelete && (
          <Pressable
            onPress={() => onDelete(user.id)}
            onHoverIn={() => setIsDeleteHovered(true)}
            onHoverOut={() => setIsDeleteHovered(false)}
            style={styles.deleteButton}
          >
            <MaterialCommunityIcons
              name={isDeleteHovered ? "trash-can" : "trash-can-outline"}
              size={16}
              color={isDeleteHovered ? "#000000" : "#6b7280"}
              style={userRowDeleteIconStyle(isDeleteHovered)}
            />
          </Pressable>
        )
      ) : (
        typeof user.followedByMe === "boolean" &&
        onToggleFollow && (
          <Pressable
            onPress={() => onToggleFollow(user.username, !user.followedByMe)}
            style={[styles.followButton, userRowFollowButtonToneStyle(!!user.followedByMe)]}
          >
            <View style={styles.followRow}>
              <MaterialCommunityIcons
                name={user.followedByMe ? "account-check-outline" : "account-plus-outline"}
                size={14}
                color={user.followedByMe ? "#2563eb" : "#0284c7"}
              />
              <Text
                style={[styles.followText, userRowFollowTextToneStyle(!!user.followedByMe)]}
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
