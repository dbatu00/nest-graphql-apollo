import { ReactNode } from "react";
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { FeedLogoutButton } from "@/components/common/FeedLogoutButton";

type Props = {
  title?: string;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  rightActions?: ReactNode;
};

export function FeedHeader({ title = "BookBook", onRefresh, isRefreshing = false, rightActions }: Props) {
  const { user, logout } = useAuth();

  const handleTitlePress = () => {
    if (onRefresh) {
      onRefresh();
      return;
    }

    router.push("/feed");
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
    router.replace("/(auth)/login");
  };

  return (
    <View
      style={{
        width: "100%",
        flexDirection: "column",
        paddingHorizontal: 16,
        paddingVertical: 9,
        backgroundColor: "#2563eb",
        ...Platform.select({
          ios: {
            shadowColor: "#1d4ed8",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
          },
          android: { elevation: 3 },
        }),
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={handleTitlePress}
            disabled={isRefreshing && !!onRefresh}
            style={{
              flexDirection: "row",
              alignItems: "center",
              opacity: isRefreshing && onRefresh ? 0.75 : 1,
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 18, color: "#fff", letterSpacing: 0.3 }}>
              {title}
            </Text>
            {isRefreshing && onRefresh && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>
        </View>

        {rightActions ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>{rightActions}</View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={handleProfile}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderWidth: 0,
                borderColor: "transparent",
                borderRadius: 8,
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                minWidth: 80,
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="person-circle-outline" size={14} color="#1d4ed8" />
                <Text style={{ fontWeight: "600", color: "#1d4ed8", fontSize: 13, marginLeft: 6 }}>
                  Profile
                </Text>
              </View>
            </TouchableOpacity>

            <FeedLogoutButton onPress={handleLogout} style={{ marginLeft: 8 }} />
          </View>
        )}
      </View>
    </View>
  );
}
