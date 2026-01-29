export type ActivityType = "post" | "like" | "share" | "follow";

export type Activity = {
  id: number;
  type: ActivityType;
  createdAt: string;
  actor: { id: number; username: string; displayName?: string };
  targetUserId?: number;
  targetUser?: { id: number; username: string; displayName?: string };
  targetPost?: { id: number; content: string };
};
