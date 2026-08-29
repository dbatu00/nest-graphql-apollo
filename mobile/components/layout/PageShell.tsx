import { ReactNode } from "react";
import { Platform, ScrollView, View } from "react-native";

import { commonStyles as styles, pageShellStyles, pageShellWebScrollbar } from "@/styles";

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
                    pageShellStyles.scrollFill,
                    Platform.OS === "web"
                        ? (pageShellWebScrollbar as never)
                        : null,
                ]}
                stickyHeaderIndices={[0]}
                contentContainerStyle={[
                    pageShellStyles.contentPadding,
                    contentContainerStyle,
                ]}
            >
                {header}
                <View style={[pageShellStyles.inner, { maxWidth: FEED_MAX_WIDTH }]}>
                    {children}
                </View>
            </ScrollView>
        </View>
    );
}
