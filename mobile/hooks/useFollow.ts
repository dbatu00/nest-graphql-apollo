/*
Kind:
Hook

Role:
Encapsulate follow/unfollow mutations with optimistic updates

Responsibility:
- Accept caller's state shape via apply function
- Toggle followedByMe on any state, on any user reference
- Handle errors with rollback (never leave UI in inconsistent state)
- Dispatch mutations to backend

Owns:
- Follow mutations (followUser, unfollowUser)
- Optimistic apply logic
- Error handling

Delegates:
- State management to caller (feed, modal, profile, etc)
- Network → graphql/client

Used by:
- useActivities (for feed state)
- useActivityRow (for likedUsers modal state)
- useProfile (for profile user state, future)

Pattern:
Accepts any state container via apply closure. Caller computes the transform
from their *current* state. Returns just toggleFollow function (no state exposed,
caller owns state).
*/

import { useCallback } from "react";
import { followUser, unfollowUser } from "@/graphql/client";
import { optimisticToggle } from "@/utils/optimisticUpdate";

export type UseFollowArgs<T> = {
    /**
     * Factory that computes optimistic state transform given username + target state.
     * Returns a function that transforms the current state for the given username.
     */
    apply: (username: string, shouldFollow: boolean) => (prev: T) => T;
    /**
     * State setter (setState dispatch). Can be from useState or any state management.
     */
    setState: (newState: T | ((prev: T) => T)) => void;
    /**
     * Optional: restore exact prior state on mutation failure.
     * If not provided, optimisticToggle falls back to setState(previousState).
     */
    rollback?: (prev: T) => void;
};

/**
 * Follow/unfollow a user with optimistic UI updates.
 *
 * Caller provides an apply factory that knows how to update their state shape
 * for a given username. useFollow handles the mutation + optimistic toggle logic.
 *
 * Usage:
 *   const { toggleFollow } = useFollow({
 *     apply: (username, shouldFollow) => (prev) => ({
 *       ...prev,
 *       users: prev.users.map(u => 
 *         u.username === username ? { ...u, followedByMe: shouldFollow } : u
 *       )
 *     }),
 *     setState: setUsers,
 *   });
 *
 *   await toggleFollow("alice", true);   // follow alice
 *   await toggleFollow("bob", false);    // unfollow bob
 */
export function useFollow<T>(args: UseFollowArgs<T>) {
    const { apply, setState, rollback } = args;

    const toggleFollow = useCallback(
        async (username: string, shouldFollow: boolean) => {
            await optimisticToggle(
                apply(username, shouldFollow),
                !shouldFollow,  // isOn = currentState (invert because shouldFollow is target state)
                () => followUser(username),
                () => unfollowUser(username),
                setState,
                rollback
            );
        },
        [apply, setState, rollback]
    );

    return { toggleFollow };
}
