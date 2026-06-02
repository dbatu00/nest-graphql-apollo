/**
 * useActivityRow.ts
 *
 * Local UI state hook for ActivityRow.tsx.
 * Extracted purely for readability — ActivityRow.tsx was getting long,
 * so the stateful logic (likes modal, comment input) lives here to keep
 * the component file focused on rendering.
 */
import { useState } from "react";
import { fetchCommentLikedUsers, fetchLikedUsers } from "@/graphql/client";

export type LikedUser = {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    followedByMe?: boolean;
};

type UseActivityRowOptions = {
    onToggleFollow?: (username: string, shouldFollow: boolean) => void;
    onAddComment?: (postId: number, content: string) => Promise<void>;
    targetPostId?: number;
};

export const useActivityRow = ({
    onToggleFollow,
    onAddComment,
    targetPostId,
}: UseActivityRowOptions) => {
    /* ---------- LIKES MODAL STATE ---------- */
    const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
    const [likedModalVisible, setLikedModalVisible] = useState(false);
    const [likedLoading, setLikedLoading] = useState(false);

    /* ---------- COMMENT INPUT STATE ---------- */
    const [commentText, setCommentText] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);

    const handleOpenLikesModal = async (postId: number) => {
        try {
            setLikedLoading(true);
            setLikedModalVisible(true);
            const users = await fetchLikedUsers(postId);
            setLikedUsers(users);
        } catch (err: unknown) {
            console.error("[ActivityRow] failed to load liked users", err);
            setLikedUsers([]);
        } finally {
            setLikedLoading(false);
        }
    };

    const handleOpenCommentLikesModal = async (commentId: number) => {
        try {
            setLikedLoading(true);
            setLikedModalVisible(true);
            const users = await fetchCommentLikedUsers(commentId);
            setLikedUsers(users);
        } catch (err: unknown) {
            console.error("[ActivityRow] failed to load comment liked users", err);
            setLikedUsers([]);
        } finally {
            setLikedLoading(false);
        }
    };

    const handleToggleFollowInModal = async (username: string, shouldFollow: boolean) => {
        setLikedUsers(prev =>
            prev.map(u => u.username === username ? { ...u, followedByMe: shouldFollow } : u)
        );
        if (onToggleFollow) await onToggleFollow(username, shouldFollow);
    };

    const handleAddComment = async () => {
        const content = commentText.trim();
        if (!content || !targetPostId || !onAddComment || commentLoading) return;
        try {
            setCommentLoading(true);
            await onAddComment(targetPostId, content);
            setCommentText("");
        } catch (err: unknown) {
            console.error("[ActivityRow] failed to add comment", err);
        } finally {
            setCommentLoading(false);
        }
    };

    const closeLikedModal = () => setLikedModalVisible(false);

    return {
        // likes modal
        likedUsers,
        likedModalVisible,
        likedLoading,
        closeLikedModal,
        handleOpenLikesModal,
        handleOpenCommentLikesModal,
        handleToggleFollowInModal,
        // comment input
        commentText,
        setCommentText,
        commentLoading,
        handleAddComment,
    };
};
