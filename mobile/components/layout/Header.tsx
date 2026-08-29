import { ReactNode } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { FeedLogoutButton } from "@/components/common/LogoutButton";
import { headerStyles as styles, titlePressableOpacityStyle } from "@/styles";

type Props = {
  title?: string;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  rightActions?: ReactNode;
};

export function Header({ title = "BookBook", onRefresh, isRefreshing = false, rightActions }: Props) {
  const { user, logout } = useAuth();

  const handleTitlePress = () => {
    if (onRefresh) {
      onRefresh();
      return;
    }

    router.replace("/feed");
  };

  const handleProfile = () => {
    if (!user?.username) {
      return;
    }

    router.push({
      pathname: "/profile/[username]",
      params: { username: user.username },
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.root}>
      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <TouchableOpacity
            onPress={handleTitlePress}
            disabled={isRefreshing && !!onRefresh}
            style={[styles.titlePressableBase, titlePressableOpacityStyle(isRefreshing, onRefresh)]}
          >
            <Text style={styles.titleText}>
              {title}
            </Text>
            {isRefreshing && onRefresh && <ActivityIndicator size="small" color="#fff" style={styles.refreshIndicator} />}
          </TouchableOpacity>
        </View>

        {rightActions ? (
          <View style={styles.rowCenter}>{rightActions}</View>
        ) : (
          <View style={styles.rowCenter}>
            <TouchableOpacity
              onPress={handleProfile}
              style={styles.profileButton}
            >
              <View style={styles.rowCenter}>
                <Ionicons name="person-circle-outline" size={14} color="#1d4ed8" />
                <Text style={styles.profileText}>
                  Profile
                </Text>
              </View>
            </TouchableOpacity>

            <FeedLogoutButton onPress={handleLogout} style={styles.logoutMargin} />
          </View>
        )}
      </View>
    </View>
  );
}
