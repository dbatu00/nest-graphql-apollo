import { View, TextInput, TouchableOpacity, Text, Platform } from "react-native";
import { composerStyles as styles, webNoOutlineStyle } from "@/styles";

type Props = {
  value: string;
  onChange: (text: string) => void;
  onPublish: () => void;
};

export function Composer({ value, onChange, onPublish }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        multiline
        value={value}
        onChangeText={onChange}
        placeholder="What's happening?"
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
        <Text style={styles.publishText}>Publish</Text>
      </TouchableOpacity>
    </View>
  );
}
