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
};

export function FeedLogoutButton({
  onPress,
  style,
  minWidth = 80,
  iconColor = "#fff",
  textColor = "#fff",
}: Props) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        buildLogoutButtonContainerStyle(minWidth),
        style,
      ]}
    >
      <View style={styles.contentRow}>
        <Ionicons name="exit-outline" size={14} color={iconColor} />
        <Text style={[styles.text, { color: textColor }]}>
          {t("common.logout")}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
