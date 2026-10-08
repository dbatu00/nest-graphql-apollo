export type Comment = {
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    pending?: boolean;
    likesCount: number;
    likedByMe: boolean;
    user: {
        id: number;
        username: string;
        displayName: string;
        avatarUrl: string;
    };
};
