export type ActivityType = "post" | "like" | "share" | "follow" | "comment";

import { Post } from "@/types/Post";

type Actor = {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string;
};

export type Activity = {
  id: number;
  type: ActivityType;
  createdAt: string;
  active: boolean;
  actor: Actor;
  targetUser: Actor;
  targetPost?: Post;
};
