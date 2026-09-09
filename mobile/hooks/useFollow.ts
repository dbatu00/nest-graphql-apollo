import { useCallback, useEffect, useRef, useState } from "react";
import {
    fetchCommentLikedUsers,
    fetchFollowers,
    fetchFollowing,
    fetchLikedUsers,
    FollowUser,
    followUser,
    unfollowUser,
} from "@/graphql/client";

type ProfileFollowArgs = {
    type: "followers" | "following";
    username?: string;
    enabled?: boolean;
};

type LikedByArgs = {
    type: "likedBy";
    postId?: number;
    commentId?: number;
    enabled?: boolean;
};

export type UseFollowArgs = ProfileFollowArgs | LikedByArgs;

export function useFollow(args: UseFollowArgs) {
    const { enabled = true, type } = args;
    const username = type === "followers" || type === "following" ? args.username : undefined;
    const postId = type === "likedBy" ? args.postId : undefined;
    const commentId = type === "likedBy" ? args.commentId : undefined;

    const [users, setUsers] = useState<FollowUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    const sourceKey = `${type}:${username ?? ""}:${postId ?? ""}:${commentId ?? ""}`;

    useEffect(() => {
        requestIdRef.current += 1;

        if (!enabled) {
            setUsers([]);
            setError(null);
            setLoading(false);
            return;
        }

        setUsers([]);
        setError(null);
    }, [enabled, sourceKey]);

    const refresh = useCallback(async () => {
        if (!enabled) return;
        const requestId = ++requestIdRef.current;

        if (type === "followers" || type === "following") {
            if (!username) {
                if (requestId === requestIdRef.current) {
                    setUsers([]);
                    setError(null);
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const nextUsers = type === "followers"
                    ? await fetchFollowers(username)
                    : await fetchFollowing(username);
                if (requestId !== requestIdRef.current) return;
                setUsers(nextUsers);
            } catch (err: unknown) {
                if (requestId !== requestIdRef.current) return;
                console.error("[useFollow] failed to refresh users", err);
                setUsers([]);
                setError(err instanceof Error ? err.message : "Failed to load users");
            } finally {
                if (requestId !== requestIdRef.current) return;
                setLoading(false);
            }

            return;
        }

        if (postId == null && commentId == null) {
            if (requestId === requestIdRef.current) {
                setUsers([]);
                setError(null);
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let nextUsers: FollowUser[] = [];

            if (commentId != null) {
                nextUsers = await fetchCommentLikedUsers(commentId);
            } else if (postId != null) {
                nextUsers = await fetchLikedUsers(postId);
            }

            if (requestId !== requestIdRef.current) return;
            setUsers(nextUsers);
        } catch (err: unknown) {
            if (requestId !== requestIdRef.current) return;
            console.error("[useFollow] failed to refresh users", err);
            setUsers([]);
            setError(err instanceof Error ? err.message : "Failed to load users");
        } finally {
            if (requestId !== requestIdRef.current) return;
            setLoading(false);
        }
    }, [commentId, enabled, postId, type, username]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const toggleFollow = useCallback(
        async (username: string, shouldFollow: boolean) => {
            let previousUsers: FollowUser[] = [];

            setUsers(prev => {
                previousUsers = prev;
                return prev.map(user =>
                    user.username === username
                        ? { ...user, followedByMe: shouldFollow }
                        : user
                );
            });

            try {
                if (shouldFollow) {
                    await followUser(username);
                } else {
                    await unfollowUser(username);
                }
            } catch (err: unknown) {
                console.error("[useFollow] failed to toggle follow", err);
                setUsers(previousUsers);
            }
        },
        []
    );

    return { users, loading, error, toggleFollow, refresh };
}
