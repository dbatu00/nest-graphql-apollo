import { ReactNode } from "react";
import { Platform, ScrollView, View } from "react-native";

import { commonStyles as styles } from "@/styles/common";

const FEED_MAX_WIDTH = 960;

type Props = {
    header: ReactNode;
    children: ReactNode;
    contentContainerStyle?: object;
};

export function PageShell({ header, children, contentContainerStyle }: Props) {
    return (
        <View style={styles.container}>
            <ScrollView
                style={[
                    { flex: 1 },
                    Platform.OS === "web"
                        ? ({
                            scrollbarColor: "#bfdbfe #2563eb",
                            scrollbarWidth: "thin",
                            scrollbarGutter: "stable",
                        } as never)
                        : null,
                ]}
                stickyHeaderIndices={[0]}
                contentContainerStyle={[
                    { paddingBottom: 24 },
                    contentContainerStyle,
                ]}
            >
                {header}
                <View
                    style={{
                        width: "100%",
                        maxWidth: FEED_MAX_WIDTH,
                        alignSelf: "center",
                        paddingHorizontal: 16,
                    }}
                >
                    {children}
                </View>
            </ScrollView>
        </View>
    );
}
