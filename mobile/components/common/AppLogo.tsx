import { View, Text } from "react-native";
import { appLogoStyles as styles } from "@/styles";

type Props = {
    subtitle?: string;
};

export function AppLogo({ subtitle }: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>
                    BB
                </Text>
            </View>

            <Text style={styles.title}>BookBook</Text>
            {subtitle ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}
        </View>
    );
}
