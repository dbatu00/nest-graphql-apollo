import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/hooks/useI18n";
import { buildLogoutButtonContainerStyle, logoutButtonStyles as styles } from "@/styles";

type Props = {
  onPress: () => void | Promise<void>;
  style?: StyleProp<ViewStyle>;
  minWidth?: number;
  iconColor?: string;
  textColor?: string;
  hideText?: boolean;
};

export function FeedLogoutButton({
  onPress,
  style,
  minWidth = 80,
  iconColor = "#fff",
  textColor = "#fff",
  hideText = false,
}: Props) {
  const { t } = useI18n();
  
  const compactStyle = hideText ? { minWidth: 0, paddingHorizontal: 4, paddingVertical: 4 } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        buildLogoutButtonContainerStyle(hideText ? 0 : minWidth),
        compactStyle,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        <Ionicons name="exit-outline" size={14} color={iconColor} />
        {!hideText && (
          <Text style={[styles.text, { color: textColor }]}>
            {t("common.logout")}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
