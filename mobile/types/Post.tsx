export type Post = {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    displayName?: string;
    followedByMe: boolean;
  };
  likedByMe?: boolean; // ✅ optional for activity feed
  likesCount?: number; // ✅ optional for activity feed
};
