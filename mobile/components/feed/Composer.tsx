import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform } from "react-native";

type Props = {
  value: string;
  onChange: (text: string) => void;
  onPublish: () => void;
};

export function Composer({ value, onChange, onPublish }: Props) {
  return (
    <View
      style={{
        flex: 1,
        paddingTop: 25,
        paddingBottom: 0,
      }}
    >
      <TextInput
        multiline
        value={value}
        onChangeText={onChange}
        placeholder="What's happening?"
        placeholderTextColor="#d1d5db"
        style={{
          flex: 1,
          borderWidth: 0,
          borderColor: "transparent",
          borderRadius: 8,
          padding: 10,
          textAlignVertical: "top",
          backgroundColor: "#eff6ff",
          color: "#1f2937",
          fontSize: 15,
          ...Platform.select({
            ios: {
              shadowColor: "#3b82f6",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
            },
            android: { elevation: 1 },
          }),
        }}
      />

      <TouchableOpacity
        onPress={onPublish}
        style={{
          alignSelf: "flex-end",
          marginTop: 4,
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderWidth: 0,
          borderColor: "transparent",
          borderRadius: 8,
          backgroundColor: "#2563eb",
        }}
      >
        <Text style={{ fontWeight: "600", color: "#fff", fontSize: 12 }}>Publish</Text>
      </TouchableOpacity>
    </View>
  );
}
