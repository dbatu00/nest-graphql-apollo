import { Platform, StyleSheet } from "react-native";
import { avatarBase, center, color, coverPanelBase, formInputBase, rowCenter, softCardShadow, tinyCardShadow } from "./tokens";

export const profileUsernameStyles = StyleSheet.create({
    profileCard: { paddingTop: 12, marginBottom: 12 },
    coverContainer: { ...coverPanelBase, ...center, marginBottom: 16 },
    fullSize: { width: "100%", height: "100%" },
    coverPlaceholderText: { marginTop: 6, color: "#60a5fa", fontWeight: "500", fontSize: 12 },
    avatarContainer: avatarBase,
    profileInfo: { paddingHorizontal: 4 },
    displayName: { fontSize: 20, fontWeight: "700", color: color.textSlate },
    usernameText: { fontSize: 13, fontWeight: "500", color: "#6b7280", marginTop: 2 },
    bioText: { marginTop: 8, fontSize: 13 },
    tabsContainer: { marginBottom: 4, backgroundColor: "#f9fafb", borderRadius: 10, padding: 4, ...softCardShadow },
    tabsRow: { flexDirection: "row", gap: 4 },
    tabButton: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, backgroundColor: "transparent", alignItems: "center" },
    tabButtonActive: { backgroundColor: color.white, ...Platform.select({ ios: { shadowColor: color.blue, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 }, android: { elevation: 2 } }) },
    tabText: { fontWeight: "500", color: color.textMuted, fontSize: 11, textAlign: "center" },
    tabTextActive: { fontWeight: "600", color: color.blue },
    followListContainer: { flex: 1 },
    followLoadingContainer: { ...center, minHeight: 200 },
    followListInner: { paddingTop: 8 },
    followUserCard: { backgroundColor: color.white, marginVertical: 6, borderRadius: 10, ...tinyCardShadow },
    actionSpacing: { marginLeft: 8 },
    emptyText: { marginTop: 8, fontSize: 13, color: color.textMuted, textAlign: "center" },
});

export const profileLinkContainerStyles = StyleSheet.create({
    shrinkWrap: { alignSelf: "flex-start", flexGrow: 0, flexShrink: 0 },
});

export const profileBioColorStyle = (hasBio: boolean) => ({ color: hasBio ? "#374151" : color.textMuted });

const settingsCoverHeight = 240;
const settingsLabel = { fontWeight: "600", color: "#374151" } as const;

export const profileSettingsStyles = StyleSheet.create({
    flex1: { flex: 1 },
    successNotice: { position: "absolute", top: 12, left: 16, right: 16, zIndex: 20, backgroundColor: "#ecfdf5", borderColor: "#86efac", borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, ...rowCenter },
    successNoticeText: { color: "#166534", fontWeight: "600", marginLeft: 8 },
    tabsRow: { flexDirection: "row", marginTop: 8, marginBottom: 8 },
    tabButton: { flex: 1, paddingVertical: 10, borderBottomWidth: 2, alignItems: "center" },
    tabButtonActive: { borderBottomColor: color.blue },
    tabButtonInactive: { borderBottomColor: "#e5e7eb" },
    tabLabelActive: { color: color.blue, fontWeight: "700", fontSize: 15 },
    tabLabelInactive: { color: "#6b7280", fontWeight: "500", fontSize: 15 },
    aboutScrollContent: { paddingTop: 12, paddingBottom: 24 },
    coverContainer: { ...coverPanelBase, height: settingsCoverHeight, marginBottom: 16 },
    coverImage: { width: "100%", height: "100%" },
    coverGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: "100%" },
    coverEditButton: { position: "absolute", right: 14, top: 14, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 16, padding: 6, ...center },
    avatarWrapper: { ...avatarBase, zIndex: 2, elevation: 6 },
    avatarImage: { width: "100%", height: "100%" },
    avatarGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: "100%", borderBottomLeftRadius: 42, borderBottomRightRadius: 42 },
    avatarEditButton: { position: "absolute", right: 8, bottom: 8, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 14, padding: 5, ...center },
    card: { backgroundColor: color.white, borderRadius: 12, padding: 16, ...softCardShadow },
    fieldLabel: { ...settingsLabel, marginBottom: 8 },
    fieldLabelTight: { ...settingsLabel, marginBottom: 4 },
    textInput: { ...formInputBase, marginBottom: 14 },
    bioInput: { ...formInputBase, minHeight: 120 },
    errorText: { color: "#dc2626", marginTop: 12 },
    errorTextSmall: { color: "#dc2626", fontSize: 13, marginBottom: 8 },
    successText: { marginTop: 12 },
    primaryButton: { backgroundColor: color.blue, borderRadius: 10, ...center, paddingVertical: 12 },
    primaryButtonText: { color: color.white, fontWeight: "600", fontSize: 14 },
    buttonSaving: { opacity: 0.7 },
    saveButton: { marginTop: 16 },
    accountScrollContent: { paddingTop: 20, paddingBottom: 24 },
    accountCard: { backgroundColor: color.white, borderRadius: 12, padding: 16, marginBottom: 18, ...softCardShadow },
    usernameValue: { fontSize: 16, color: "#1e293b", fontWeight: "700", marginBottom: 2 },
    usernameHint: { color: "#6b7280", fontSize: 12, marginBottom: 18 },
    currentEmailValue: { fontSize: 16, color: "#1e293b", fontWeight: "700", marginBottom: 18 },
    accountInput: { ...formInputBase, marginBottom: 8 },
    passwordFieldWrapper: { position: "relative", marginBottom: 8 },
    passwordInput: { paddingRight: 44 },
    eyeButton: { position: "absolute", right: 12, top: 10 },
    changeEmailButton: { marginBottom: 24 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.45)", ...center },
    modalCard: { backgroundColor: color.white, borderRadius: 12, padding: 14 },
    modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10 },
    modalGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    pickerItem: { overflow: "hidden", marginBottom: 10 },
    pickerItemImage: { width: "100%", height: "100%" },
    modalCloseButton: { alignSelf: "flex-end", marginTop: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#f3f4f6" },
    modalCloseText: { color: "#374151", fontWeight: "600" },
    contentFlexGrow: { flexGrow: 1 },
});

export const profileSettingsSuccessToneStyle = (isUpdated: boolean) => ({ color: isUpdated ? "#16a34a" : "#fbbf24" });
export const profileSettingsAccountInputToneStyle = (hasValue: boolean) => ({ color: hasValue ? "#1e293b" : color.textMuted });
export const profileSettingsModalSizeStyle = (screenWidth: number, screenHeight: number) => ({ maxWidth: Math.round(screenWidth * 0.85), width: Math.round(screenWidth * 0.85), maxHeight: Math.round(screenHeight * 0.7) });
export const profileSettingsPickerItemStyle = (imageSize: number, isCover: boolean, selected: boolean) => ({ width: imageSize, height: isCover ? Math.round((imageSize * 9) / 16) : imageSize, borderRadius: isCover ? 8 : 999, borderWidth: selected ? 2 : 1, borderColor: selected ? color.blue : color.border });
