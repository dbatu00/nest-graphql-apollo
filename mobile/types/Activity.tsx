export type ActivityType = "post" | "like" | "share" | "follow";
import { Post } from "@/types/Post";

export type Activity = {
  id: number;
  type: ActivityType;
  createdAt: string;
  active: boolean;
  actor: { id: number; username: string; displayName?: string };
  targetUser?: {
    id: number;
    username: string;
    displayName?: string;
    followedByMe?: boolean;
    active?: boolean;
  };
  targetPost?: Post; // now includes likesCount and likedByMe
};
