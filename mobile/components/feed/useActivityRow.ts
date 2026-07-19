/*
Kind:
Hook

Role:
Local UI state for ActivityRow(extracted for readability)

Responsibility:
- Own ephemeral, non-persisted UI state for a single ActivityRow: the likes
  modal (post or comment likes) and the comment input
- Fetch liked-users lists on demand and expose loading/data to the view
- Perform optimistic follow-toggle updates against the fetched likes list
- Submit new comments via the injected onAddComment callback

Owns:
- likedUsers, likedModalVisible, likedLoading
- commentText, commentLoading

Delegates:
- Liked-user data fetching → fetchLikedUsers / fetchCommentLikedUsers (graphql/client)
- Follow mutation → onToggleFollow (via props, owned by caller)
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
- handleToggleFollowInModal has no try/catch: the optimistic followedByMe flip
  is never rolled back on failure, and a rejected onToggleFollow becomes an
  unhandled promise rejection at the call site. Wrap in try/catch and revert
  optimistic state on error, consistent with handleAddComment's pattern.
- handleOpenLikesModal and handleOpenCommentLikesModal are identical apart
  from which fetch function they call. Collapse into one helper that takes
  the fetcher as a parameter.
- handleAddComment's !targetPostId check treats postId === 0 as absent.
  Almost certainly never hit with real DB ids, but == null would be more
  precise about intent if that ever changes.
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
