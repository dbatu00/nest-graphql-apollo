export type Post = {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
  };
};
