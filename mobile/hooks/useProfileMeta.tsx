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

import { useAuth } from "@/hooks/useAuth";
import type { ProfileMetaData } from "@/graphql/client";

export function useProfileMeta() {
    const { user, loading, refreshAuth } = useAuth();

    const profileMeta: ProfileMetaData | null = user
        ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            coverUrl: user.coverUrl,
            email: user.email,
        }
        : null;

    return {
        profileMeta,
        loading,
        refreshProfileMeta: refreshAuth,
    };
}
