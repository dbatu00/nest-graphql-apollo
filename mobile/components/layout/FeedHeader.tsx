import { View, Text, TouchableOpacity, Platform } from "react-native";
import { logout } from "@/utils/logout";

type Props = {
  title: string;
};

export function FeedHeader({ title }: Props) {
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
        <Text style={{ fontWeight: "700", fontSize: 20, color: "#fff", letterSpacing: 0.3 }}>
          {title}
        </Text>

        <TouchableOpacity
          onPress={logout}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderWidth: 0,
            borderColor: "transparent",
            borderRadius: 8,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            minWidth: 80,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "600", color: "#fff", fontSize: 13 }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
