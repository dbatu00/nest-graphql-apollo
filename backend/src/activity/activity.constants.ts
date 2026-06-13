// Shared activity type constants.

export const ACTIVITY_TYPE = {
    POST: "post",
    FOLLOW: "follow",
    LIKE: "like",
    SHARE: "share", //later
    COMMENT: "comment",
} as const;

export type ActivityType =
    typeof ACTIVITY_TYPE[keyof typeof ACTIVITY_TYPE];
