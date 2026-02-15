import { View, Text, Pressable, Platform } from "react-native";

// Add "activity" to tabs
export const TABS = ["activity","following","followers", "likes", "shares"] as const;

// Export Tab type for reuse
export type Tab = typeof TABS[number];

export function ProfileTabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <View style={{ 
      marginHorizontal: 12, 
      marginBottom: 16,
      backgroundColor: "#f9fafb",
      borderRadius: 10,
      padding: 4,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
        },
        android: { elevation: 1 },
      }),
    }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {TABS.map(tab => (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: 8,
              backgroundColor: active === tab ? "#fff" : "transparent",
              ...( active === tab ? {
                ...Platform.select({
                  ios: {
                    shadowColor: "#2563eb",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                  },
                  android: { elevation: 2 },
                }),
              } : {}),
              alignItems: "center",
            }}
          >
            <Text style={{ 
              fontWeight: active === tab ? "600" : "500", 
              color: active === tab ? "#2563eb" : "#9ca3af", 
              fontSize: 12,
              textAlign: "center",
            }}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
