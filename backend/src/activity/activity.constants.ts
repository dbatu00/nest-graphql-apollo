export const ACTIVITY_TYPE = {
    POST: "post",
    FOLLOW: "follow",
    LIKE: "like",
    SHARE: "share",
} as const;

export type ActivityType =
    typeof ACTIVITY_TYPE[keyof typeof ACTIVITY_TYPE];
