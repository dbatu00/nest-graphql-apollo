import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { buildSettingsButtonContainerStyle, settingsButtonStyles as styles } from "@/styles";

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
        buildSettingsButtonContainerStyle(minWidth, borderColor, backgroundColor),
        style,
      ]}
    >
      <View style={styles.contentRow}>
        <Ionicons name={iconName} size={14} color={iconColor} />
        <Text style={[styles.text, { color: textColor }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
