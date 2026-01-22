import { View, Text, Pressable } from "react-native";

const TABS = ["posts", "followers", "following", "likes", "shares"] as const;
type Tab = typeof TABS[number];

export function ProfileTabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 16 }}>
      {TABS.map(tab => (
        <Pressable
          key={tab}
          onPress={() => onChange(tab)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderBottomWidth: 2,
            borderBottomColor: active === tab ? "black" : "transparent",
          }}
        >
          <Text style={{ fontWeight: active === tab ? "bold" : "normal" }}>
            {tab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
