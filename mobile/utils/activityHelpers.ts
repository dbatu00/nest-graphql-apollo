type DisplayLabelUser = {
    displayName?: string;
    username?: string;
};

export const getDisplayLabel = (user?: DisplayLabelUser, fallback = "Unknown user") => {
    const displayName = user?.displayName?.trim();
    if (displayName) return displayName;

    const username = user?.username?.trim();
    if (username) return username;

    return fallback;
};

export const isSameId = (left?: number | string, right?: number | string) => {
    if (left == null || right == null) return false;
    return Number(left) === Number(right);
};

export const resolveAvatarUri = (avatarUrl: string | undefined, label: string, size = 128) => {
    const trimmed = avatarUrl?.trim();
    if (trimmed && /^https?:\/\//i.test(trimmed)) return trimmed;

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=e5e7eb&color=374151&size=${size}`;
};

export const getAbsoluteDateLabel = (date: string) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleString();
};

export const getRelativeDateLabel = (date: string) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";

    const diffMs = Math.max(0, Date.now() - parsed.getTime());
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)}h`;
    if (diffMs < week) return `${Math.floor(diffMs / day)}d`;
    if (diffMs < month) return `${Math.floor(diffMs / week)}w`;
    if (diffMs < year) return parsed.toLocaleString("en-US", { month: "short" });

    return parsed.toLocaleString("en-US", { year: "numeric" });
};
