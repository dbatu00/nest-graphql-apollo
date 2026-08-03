/*
Kind:
Hook

Role:
Current user profile metadata selector

Responsibility:
- Expose the current user's profile metadata from auth state
- Keep profile-oriented consumers decoupled from the full auth object

Owns:
- none; derived from useAuth()

Delegates:
- Auth state → useAuth
*/
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { ProfileMetaData } from "@/graphql/client";

export function useProfileMeta() {
    const { user, loading, refreshAuth } = useAuth();

    const profileMeta: ProfileMetaData | null = useMemo(() => {
        if (!user) return null;

        return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            coverUrl: user.coverUrl,
            email: user.email,
        };
    }, [
        user?.id,
        user?.username,
        user?.displayName,
        user?.bio,
        user?.avatarUrl,
        user?.coverUrl,
        user?.email,
    ]);

    return {
        profileMeta,
        loading,
        refreshProfileMeta: refreshAuth,
    };
}