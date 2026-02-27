import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  minWidth?: number;
  borderColor?: string;
};

export function UserSettingsButton({
  onPress,
  style,
  minWidth = 80,
  borderColor = "#fff",
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor,
          borderRadius: 8,
          backgroundColor: "#fff",
          minWidth,
          alignItems: "center",
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons name="settings-outline" size={14} color="#1d4ed8" />
        <Text style={{ fontWeight: "600", color: "#1d4ed8", fontSize: 13, marginLeft: 6 }}>
          Settings
        </Text>
      </View>
    </TouchableOpacity>
  );
}
