import { View, Text } from "react-native";

type Props = {
    subtitle?: string;
};

export function AppLogo({ subtitle }: Props) {
    return (
        <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View
                style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: "#2563eb",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                }}
            >
                <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: 0.6 }}>
                    BB
                </Text>
            </View>

            <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>BookBook</Text>
            {subtitle ? (
                <Text style={{ marginTop: 4, color: "#64748b", fontSize: 13 }}>{subtitle}</Text>
            ) : null}
        </View>
    );
}
