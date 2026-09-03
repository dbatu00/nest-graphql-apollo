import { View, TextInput, TouchableOpacity, Text, Platform } from "react-native";
import { useI18n } from "@/hooks/useI18n";
import { composerStyles as styles, webNoOutlineStyle } from "@/styles";

type Props = {
  value: string;
  onChange: (text: string) => void;
  onPublish: () => void;
};

export function Composer({ value, onChange, onPublish }: Props) {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <TextInput
        multiline
        value={value}
        onChangeText={onChange}
        placeholder={t("feed.composer.placeholder")}
        placeholderTextColor="#d1d5db"
        underlineColorAndroid="transparent"
        style={[
          styles.input,
          Platform.OS === "web"
            ? (webNoOutlineStyle as never)
            : null,
        ]}
      />

      <TouchableOpacity
        onPress={onPublish}
        style={styles.publishButton}
      >
        <Text style={styles.publishText}>{t("feed.composer.publish")}</Text>
      </TouchableOpacity>
    </View>
  );
}
