export type Comment = {
    id: number;
    content: string;
    createdAt: string;
    updatedAt?: string;
    likesCount?: number;
    likedByMe?: boolean;
    user: {
        id: number;
        username: string;
        displayName?: string;
        avatarUrl?: string;
    };
};
