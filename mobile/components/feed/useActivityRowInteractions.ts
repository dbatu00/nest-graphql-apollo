/*
Kind:
Hook

Role:
Local UI state for ActivityRow (extracted for readability)

Responsibility:
- Own ephemeral, non-persisted UI state for a single ActivityRow: the likes
  modal (post or comment likes) and the comment input
- Fetch liked-users lists on demand and expose loading/data to the view
- Perform optimistic follow-toggle updates against the fetched likes list with error rollback
- Submit new comments via the injected onAddComment callback

Owns:
- likedUsers, likedModalVisible, likedLoading
- commentText, commentLoading

Delegates:
- Liked-user data fetching → fetchLikedUsers / fetchCommentLikedUsers (graphql/client)
- Follow mutations → useFollow hook
- Comment mutation → onAddComment (via props, owned by caller)

Used by:
- ActivityRow

TODO:
- Guard against stale responses: handleOpenLikesModal and
  handleOpenCommentLikesModal both write into the same likedUsers/likedLoading
  state with no request identity. Opening one modal shortly after another
  (or switching targets before a fetch resolves) can let a stale response
  overwrite a newer one. Add a request-id/ref guard before setting state.
- No user-visible error state on fetch failure. Both handlers swallow errors
  into console.error + likedUsers = [], which is indistinguishable from "zero
  likes" in the UI. Consider returning/exposing an error field.
- handleOpenLikesModal and handleOpenCommentLikesModal are identical apart
  from which fetch function they call. Collapse into one helper that takes
  the fetcher as a parameter.
- handleAddComment's !targetPostId check treats postId === 0 as absent.
  Almost certainly never hit with real DB ids, but == null would be more
  precise about intent if that ever changes.
*/
import { useState, useCallback } from "react";
import { fetchCommentLikedUsers, fetchLikedUsers } from "@/graphql/client";
import { useFollow } from "@/hooks/useFollow";

export type LikedUser = {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    followedByMe?: boolean;
};

type useActivityRowInteractionsOptions = {
    onAddComment?: (postId: number, content: string) => Promise<void>;
    targetPostId?: number;
};

export const useActivityRowInteractions = ({
    onAddComment,
    targetPostId,
}: useActivityRowInteractionsOptions) => {
    /* ---------- LIKES MODAL STATE ---------- */
    const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
    const [likedModalVisible, setLikedModalVisible] = useState(false);
    const [likedLoading, setLikedLoading] = useState(false);

    /* ---------- COMMENT INPUT STATE ---------- */
    const [commentText, setCommentText] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);

    /* ---------- FOLLOW MUTATION ---------- */
    const { toggleFollow } = useFollow({
        apply: (username: string, shouldFollow: boolean) =>
            (prev: LikedUser[]) =>
                prev.map(u =>
                    u.username === username ? { ...u, followedByMe: shouldFollow } : u
                ),
        setState: setLikedUsers,
    });

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

    const handleToggleFollowInModal = useCallback(
        async (username: string, shouldFollow: boolean) => {
            await toggleFollow(username, shouldFollow);
        },
        [toggleFollow]
    );

    const handleAddComment = async () => {
        const content = commentText.trim();
        if (!content || targetPostId == null || !onAddComment || commentLoading) return;
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
