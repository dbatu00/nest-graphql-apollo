export type Post = {
  id: number;
  content: string;
  createdAt: string;
  likes: number;
  shares: number;
  user: {
    id: number;
    name: string;
  };
};