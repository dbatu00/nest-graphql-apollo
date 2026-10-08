/*
Kind:
Reusable async state mutation helpers

Role:
Encapsulate common patterns for optimistic updates with rollback support

Responsibility:
- Provide generic optimisticToggle for binary state changes (on/off, like/unlike, follow/unfollow)
- Provide generic optimisticDelete for removal operations
- Provide generic optimisticCreate for create/write operations with reconcile
- Decouple optimistic UI patterns from specific state shapes (feed, modal, etc)

Used by:
- useActivities
- useFollow
- Any hook needing optimistic toggle/delete with rollback

Pattern:
All functions accept an `apply` closure that the caller computes from *current* state.
This ensures each caller can transform their own state shape independently.
Rollback receives the exact prior state; no refresh needed (cheaper + no flash).
*/

/**
 * Generic optimistic update for binary toggle operations.
 * 
 * Apply optimistic transform to state immediately, then call either onFn or offFn.
 * On failure, rollback to prior state if provided, otherwise refresh.
 * 
 * @param apply Closure that transforms state to optimistic target
 * @param isOn Current on/off state (determines which endpoint to hit)
 * @param onFn Mutation to call when toggling ON
 * @param offFn Mutation to call when toggling OFF
 * @param setState Function to update state with optimistic result
 * @param rollback Function to revert to prior state on failure
 */
export const optimisticToggle = async <T>(
    apply: (prev: T) => T,
    isOn: boolean,
    onFn: () => Promise<unknown>,
    offFn: () => Promise<unknown>,
    setState: (newState: T | ((prev: T) => T)) => void,
    rollback?: (prev: T) => void
) => {
    let previousState: T | null = null;

    setState(prev => {
        previousState = prev;
        return apply(prev);
    });

    try {
        await (isOn ? offFn() : onFn());
    } catch (err: unknown) {
        console.error("[optimisticToggle] mutation failed", err);
        if (rollback && previousState) {
            rollback(previousState);
        } else if (previousState) {
            setState(previousState);
        }
    }
};

/**
 * Generic optimistic update for delete operations.
 * 
 * Apply optimistic transform to state immediately, then call deleteFn.
 * On failure, rollback to exact prior state (no refresh).
 * 
 * @param apply Closure that transforms state to optimistic delete result
 * @param deleteFn Mutation to call
 * @param setState Function to update state with optimistic result
 */
export const optimisticDelete = async <T>(
    apply: (prev: T) => T,
    deleteFn: () => Promise<unknown>,
    setState: (newState: T | ((prev: T) => T)) => void
) => {
    let previousState: T | null = null;

    setState(prev => {
        previousState = prev;
        return apply(prev);
    });

    try {
        await deleteFn();
    } catch (err: unknown) {
        console.error("[optimisticDelete] delete failed", err);
        if (previousState) {
            setState(previousState);
        }
    }
};

/**
 * Generic optimistic update for create/write operations.
 *
 * Applies a local optimistic insert/update first, then runs the request.
 * On success, caller may reconcile with server response; on failure, state is rolled back.
 */
export const optimisticCreate = async <T, TResult>(
    applyOptimistic: (prev: T) => T,
    request: () => Promise<TResult>,
    setState: (newState: T | ((prev: T) => T)) => void,
    reconcile?: (prev: T, result: TResult) => T,
    rollback?: (prev: T) => void
) => {
    let previousState: T | null = null;

    setState(prev => {
        previousState = prev;
        return applyOptimistic(prev);
    });

    try {
        const result = await request();
        if (reconcile) {
            setState(prev => reconcile(prev, result));
        }
        return result;
    } catch (err: unknown) {
        console.error("[optimisticCreate] mutation failed", err);
        if (rollback && previousState) {
            rollback(previousState);
        } else if (previousState) {
            setState(previousState);
        }
        throw err;
    }
};
