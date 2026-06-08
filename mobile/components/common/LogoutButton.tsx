import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onPress: () => void | Promise<void>;
  style?: StyleProp<ViewStyle>;
  minWidth?: number;
  iconColor?: string;
  textColor?: string;
};

export function FeedLogoutButton({
  onPress,
  style,
  minWidth = 80,
  iconColor = "#fff",
  textColor = "#fff",
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderWidth: 0,
          borderColor: "transparent",
          borderRadius: 8,
          backgroundColor: "transparent",
          minWidth,
          alignItems: "center",
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons name="exit-outline" size={14} color={iconColor} />
        <Text style={{ fontWeight: "600", color: textColor, fontSize: 13, marginLeft: 6 }}>
          Logout
        </Text>
      </View>
    </TouchableOpacity>
  );
}
