import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { FeedLogoutButton } from "@/components/common/FeedLogoutButton";

type Props = {
  title: string;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
};

export function FeedHeader({ title, onRefresh, isRefreshing = false }: Props) {
  const { user, logout } = useAuth();

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
        paddingVertical: 14,
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
          <Text style={{ fontWeight: "700", fontSize: 20, color: "#fff", letterSpacing: 0.3 }}>
            {title}
          </Text>

          {onRefresh && (
            <TouchableOpacity
              onPress={onRefresh}
              disabled={isRefreshing}
              style={{
                marginLeft: 8,
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                opacity: isRefreshing ? 0.75 : 1,
              }}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="refresh-outline" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={handleProfile}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
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
      </View>
    </View>
  );
}
