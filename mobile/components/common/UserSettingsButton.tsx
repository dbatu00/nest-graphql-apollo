import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  minWidth?: number;
  borderColor?: string;
  label?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
};

export function UserSettingsButton({
  onPress,
  style,
  minWidth = 80,
  borderColor = "#fff",
  label = "Settings",
  iconName = "settings-outline",
  backgroundColor = "#fff",
  textColor = "#1d4ed8",
  iconColor = "#1d4ed8",
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
          backgroundColor,
          minWidth,
          alignItems: "center",
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons name={iconName} size={14} color={iconColor} />
        <Text style={{ fontWeight: "600", color: textColor, fontSize: 13, marginLeft: 6 }}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
