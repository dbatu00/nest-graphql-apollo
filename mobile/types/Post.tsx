export type Post = {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    followedByMe: boolean;
  };
  likedByMe?: boolean; // ✅ optional for activity feed
  likesCount?: number; // ✅ optional for activity feed
};
