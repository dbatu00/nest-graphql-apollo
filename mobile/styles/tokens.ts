import { Platform } from "react-native";

export const color = {
    white: "#fff",
    transparent: "transparent",
    blue: "#2563eb",
    blueDark: "#1d4ed8",
    textSlate: "#1f2937",
    textMuted: "#9ca3af",
    border: "#d1d5db",
} as const;

export const rowCenter = { flexDirection: "row", alignItems: "center" } as const;
export const center = { justifyContent: "center", alignItems: "center" } as const;

export const tinyCardShadow = Platform.select({
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
    android: { elevation: 1 },
});

export const softCardShadow = Platform.select({
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
    android: { elevation: 1 },
});

export const coverPanelBase = {
    height: 240,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    position: "relative",
    overflow: "hidden",
} as const;

export const avatarBase = {
    position: "absolute",
    left: 14,
    bottom: 12,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: color.white,
    backgroundColor: "#dbeafe",
    ...center,
    overflow: "hidden",
} as const;

export const formInputBase = {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: color.white,
} as const;
