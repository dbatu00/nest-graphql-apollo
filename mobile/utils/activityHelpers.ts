export const resolveAvatarUri = (label: string, avatarUrl?: string, size = 128) => {
    //show real photo if they have one
    const trimmed = avatarUrl?.trim();
    if (trimmed && /^https?:\/\//i.test(trimmed)) return trimmed;

    //generate placeholder with initials
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=e5e7eb&color=374151&size=${size}`;
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
