import { View, Text, TouchableOpacity } from "react-native";
import { logout } from "@/utils/logout";

type Props = {
  title: string;
};

export function FeedHeader({ title }: Props) {
  return (
    <View
      style={{
          width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: 2,
        borderColor: "#000",
      }}
    >
      <Text style={{ fontWeight: "700", fontSize: 18 }}>
        {title}
      </Text>

      <TouchableOpacity
        onPress={logout}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: "#000",
        }}
      >
        <Text style={{ fontWeight: "700" }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
