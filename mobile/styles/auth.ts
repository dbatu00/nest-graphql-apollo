import { StyleSheet } from "react-native";
import { center, color } from "./tokens";

export const commonStyles = StyleSheet.create({
    container: { flex: 1, padding: 0 },
    pageGutter: { paddingHorizontal: 240 },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
    input: { flex: 1, borderWidth: 1, borderColor: color.border, padding: 10, borderRadius: 12, marginRight: 10, backgroundColor: "#f5f5f5" },
    button: { flex: 1, maxWidth: 180, paddingVertical: 14, borderRadius: 12, backgroundColor: color.blue, alignItems: "center" },
    buttonText: { color: "white", fontSize: 16, fontWeight: "500" },
    center,
});

export const authLoadingStyles = StyleSheet.create({
    container: { flex: 1, ...center, paddingHorizontal: 24 },
    text: { marginTop: 12, fontSize: 16, color: "#475569" },
});

export const appLogoStyles = StyleSheet.create({
    container: { alignItems: "center", marginBottom: 24 },
    badge: { width: 68, height: 68, borderRadius: 34, backgroundColor: color.blue, ...center, marginBottom: 10 },
    badgeText: { color: color.white, fontSize: 24, fontWeight: "800", letterSpacing: 0.6 },
    title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
    subtitle: { marginTop: 4, color: "#64748b", fontSize: 13 },
});

export const authFormStyles = StyleSheet.create({
    formWrap: { width: "100%", maxWidth: 360 },
    inputTopGap: { marginTop: 12 },
    actionsCenter: { alignItems: "center", marginTop: 20 },
    submitButton: { width: 180, paddingVertical: 14 },
    errorText: { color: "#dc2626", marginTop: 10, textAlign: "center", fontSize: 14 },
    inlineErrorText: { color: "#dc2626", fontSize: 12, marginTop: 4 },
    successText: { color: "#059669", marginTop: 10, textAlign: "center", fontSize: 14 },
    navLinkWrap: { marginTop: 16 },
    navLinkText: { textAlign: "center", color: color.blue, fontWeight: "500" },
});

export const verifyMailStyles = StyleSheet.create({
    containerTone: { backgroundColor: "#f3f4f6", justifyContent: "center" },
    inner: { alignSelf: "center", width: "100%", maxWidth: 520 },
    title: { fontSize: 42, fontWeight: "800", color: "#0f172a", marginBottom: 10 },
    description: { fontSize: 17, color: "#111827", marginBottom: 28, lineHeight: 24 },
    primaryButton: { height: 58, borderRadius: 999, ...center, backgroundColor: "#1665d8", marginBottom: 14 },
    primaryButtonText: { color: color.white, fontSize: 26, fontWeight: "700" },
    secondaryButton: { height: 58, borderRadius: 999, borderWidth: 1, borderColor: "#cbd5e1", ...center, backgroundColor: color.white },
    secondaryButtonText: { color: "#111827", fontSize: 26, fontWeight: "500" },
    statusText: { marginTop: 12, textAlign: "center", fontSize: 16 },
});

export const verifyMailStatusColorStyle = (isSuccess: boolean) => ({ color: isSuccess ? "#059669" : "#d97706" });
