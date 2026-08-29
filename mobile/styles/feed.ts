import { Platform, StyleSheet } from "react-native";
import { center, color, rowCenter, tinyCardShadow } from "./tokens";

export const composerStyles = StyleSheet.create({
    container: { flex: 1, paddingTop: 25 },
    input: {
        flex: 1,
        borderWidth: 0,
        borderColor: color.transparent,
        borderRadius: 8,
        padding: 10,
        textAlignVertical: "top",
        backgroundColor: "#eff6ff",
        color: color.textSlate,
        fontSize: 15,
        ...Platform.select({
            ios: { shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
            android: { elevation: 1 },
        }),
    },
    publishButton: { alignSelf: "flex-end", marginTop: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: color.blue },
    publishText: { fontWeight: "600", color: color.white, fontSize: 12 },
});

export const webNoOutlineStyle = { outlineStyle: "none", outlineWidth: 0 } as const;

export const activityListStyles = StyleSheet.create({
    loadingWrap: { ...center, minHeight: 200 },
    emptyWrap: { paddingTop: 8 },
    emptyText: { marginTop: 8, fontSize: 13, color: color.textMuted, textAlign: "center" },
});

export const feedScreenStyles = StyleSheet.create({
    composerCard: {
        minHeight: 200,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: color.white,
        marginTop: 12,
        marginBottom: 6,
        borderRadius: 12,
        overflow: "hidden",
        ...Platform.select({
            ios: { shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
});

export const userRowStyles = StyleSheet.create({
    rootBase: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    identityRow: rowCenter,
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
    nameText: { fontWeight: "500", color: color.textSlate },
    deleteButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    followButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
    followRow: rowCenter,
    followText: { fontWeight: "600", fontSize: 12, marginLeft: 6 },
});

export const userRowCardStyle = (isCompact: boolean) =>
    isCompact
        ? { paddingVertical: 4, paddingHorizontal: 0 }
        : { backgroundColor: color.white, marginHorizontal: 12, marginVertical: 6, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, ...tinyCardShadow };

export const userRowNameSizeStyle = (isCompact: boolean) => ({ fontSize: isCompact ? 13 : 14 });
export const userRowDeleteIconStyle = (isDeleteHovered: boolean) => ({ transform: [{ translateY: isDeleteHovered ? -1 : 0 }, { rotate: isDeleteHovered && Platform.OS === "web" ? "-12deg" : "0deg" }, { scale: isDeleteHovered ? 1.06 : 1 }] });
export const userRowFollowButtonToneStyle = (followedByMe: boolean) => ({ backgroundColor: followedByMe ? "#e0e7ff" : "#f0f9ff", borderColor: followedByMe ? "#c7d2fe" : "#bfdbfe" });
export const userRowFollowTextToneStyle = (followedByMe: boolean) => ({ color: followedByMe ? color.blue : "#0284c7" });
