export type ActivityType = "post" | "like" | "share" | "follow";
import { Post } from "@/types/Post";

export type Activity = {
  id: number;
  type: ActivityType;
  createdAt: string;
  actor: {
    id: number;
    username: string;
    displayName?: string;
  };
  targetUserId?: number;
  targetUser?: {
    id: number;
    username: string;
    displayName?: string;
    followedByMe?: boolean;
  };
  targetPost?: Post; // ✅ FIX
};
