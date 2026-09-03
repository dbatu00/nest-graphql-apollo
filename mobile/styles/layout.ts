import { Platform, StyleSheet } from "react-native";
import { color, rowCenter } from "./tokens";

export const profileLinkStyles = StyleSheet.create({ defaultText: { fontWeight: "600" } });

export const logoutButtonStyles = StyleSheet.create({
    contentRow: rowCenter,
    text: { fontWeight: "600", fontSize: 13, marginLeft: 6 },
});

export const settingsButtonStyles = StyleSheet.create({
    contentRow: rowCenter,
    text: { fontWeight: "600", fontSize: 13, marginLeft: 6 },
});

const baseActionButton = { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: "center" as const };

export const buildLogoutButtonContainerStyle = (minWidth: number) => ({
    ...baseActionButton,
    paddingHorizontal: 10,
    borderWidth: 0,
    borderColor: color.transparent,
    backgroundColor: color.transparent,
    minWidth,
});

export const buildSettingsButtonContainerStyle = (minWidth: number, borderColor: string, backgroundColor: string) => ({
    ...baseActionButton,
    borderWidth: 1,
    borderColor,
    backgroundColor,
    minWidth,
});

export const pageShellStyles = StyleSheet.create({
    scrollFill: { flex: 1 },
    contentPadding: { paddingBottom: 24 },
    inner: { width: "100%", maxWidth: 960, alignSelf: "center", paddingHorizontal: 16 },
});

export const pageShellWebScrollbar = { scrollbarColor: "#bfdbfe #2563eb", scrollbarWidth: "thin", scrollbarGutter: "stable", overflowY: "scroll" } as const;

export const headerStyles = StyleSheet.create({
    root: {
        width: "100%",
        flexDirection: "column",
        paddingHorizontal: 16,
        paddingVertical: 9,
        backgroundColor: color.blue,
        ...Platform.select({
            ios: { shadowColor: color.blueDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
    },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    rowCenter,
    titlePressableBase: rowCenter,
    titleText: { fontWeight: "700", fontSize: 18, color: color.white, letterSpacing: 0.3 },
    refreshIndicator: { marginLeft: 8 },
    profileButton: { paddingHorizontal: 14, paddingVertical: 6, borderWidth: 0, borderColor: color.transparent, borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.92)", minWidth: 80, alignItems: "center" },
    profileText: { fontWeight: "600", color: color.blueDark, fontSize: 13, marginLeft: 6 },
    logoutMargin: { marginLeft: 8 },
    languageMiddleMargin: { marginLeft: 10, marginRight: 0 },
    languageMenuRoot: { position: "relative", zIndex: 20 },
    languageIconPressable: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: color.transparent },
    languageDropdown: {
        position: "absolute",
        top: 32,
        right: 0,
        minWidth: 130,
        borderWidth: 1,
        borderColor: color.border,
        borderRadius: 8,
        backgroundColor: color.white,
        overflow: "hidden",
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 4 },
        }),
    },
    languageDropdownItem: { paddingVertical: 9, paddingHorizontal: 12 },
    languageDropdownItemActive: { backgroundColor: "#eff6ff" },
    languageDropdownItemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    languageDropdownFlag: { width: 16, height: 12, marginLeft: 8, borderRadius: 1 },
    languageDropdownItemText: { color: color.textSlate, fontWeight: "500", fontSize: 13 },
    languageDropdownItemTextActive: { color: color.blue, fontWeight: "700" },
});

export const titlePressableOpacityStyle = (isRefreshing: boolean, onRefresh?: () => void | Promise<void>) => ({ opacity: isRefreshing && onRefresh ? 0.75 : 1 });
