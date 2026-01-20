import { View, TextInput, TouchableOpacity, Text } from "react-native";

type Props = {
  value: string;
  onChange: (text: string) => void;
  onPublish: () => void;
};

export function Composer({ value, onChange, onPublish }: Props) {
  return (
    <View
      style={{
        padding: 12,
        borderBottomWidth: 2,
        borderColor: "#000",
      }}
    >
      <TextInput
        multiline
        value={value}
        onChangeText={onChange}
        placeholder="What's happening?"
        style={{
          borderWidth: 1,
          borderColor: "#000",
          padding: 10,
          minHeight: 120,
          textAlignVertical: "top",
        }}
      />

      <TouchableOpacity
        onPress={onPublish}
        style={{
          alignSelf: "flex-end",
          marginTop: 10,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: "#000",
        }}
      >
        <Text style={{ fontWeight: "700" }}>Publish</Text>
      </TouchableOpacity>
    </View>
  );
}
