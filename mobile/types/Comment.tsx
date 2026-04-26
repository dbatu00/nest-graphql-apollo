export type Comment = {
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: number;
        username: string;
        displayName?: string;
        avatarUrl?: string;
    };
};
