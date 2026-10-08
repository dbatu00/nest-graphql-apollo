import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useFollow } from '../../hooks/useFollow';
import {
    fetchFollowers,
    fetchFollowing,
    fetchLikedUsers,
    fetchCommentLikedUsers,
    followUser,
    unfollowUser,
} from '../../graphql/client';
import { silenceConsole } from '../test-utils/jest';

jest.mock('../../graphql/client', () => ({
    fetchFollowers: jest.fn(),
    fetchFollowing: jest.fn(),
    fetchLikedUsers: jest.fn(),
    fetchCommentLikedUsers: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
}));

describe('useFollow', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        errorSpy = silenceConsole('error');
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    it('loads followers for a username source', async () => {
        (fetchFollowers as jest.Mock).mockResolvedValue([
            { id: 1, username: 'alice', displayName: 'Alice', followedByMe: false },
        ]);

        const { result } = renderHook(() =>
            useFollow({ type: 'followers', username: 'deniz' }),
        );

        await waitFor(() => {
            expect(result.current.users).toHaveLength(1);
        });

        expect(fetchFollowers).toHaveBeenCalledWith('deniz');
    });

    it('loads liked users for a post in likedBy mode', async () => {
        (fetchLikedUsers as jest.Mock).mockResolvedValue([
            { id: 4, username: 'bob', displayName: 'Bob', followedByMe: true },
        ]);

        const { result } = renderHook(() =>
            useFollow({ type: 'likedBy', postId: 77 }),
        );

        await waitFor(() => {
            expect(result.current.users[0]?.username).toBe('bob');
        });

        expect(fetchLikedUsers).toHaveBeenCalledWith(77);
        expect(fetchCommentLikedUsers).not.toHaveBeenCalled();
    });

    it('loads following users when source type is following', async () => {
        (fetchFollowing as jest.Mock).mockResolvedValue([
            { id: 7, username: 'carol', displayName: 'Carol', followedByMe: false },
        ]);

        const { result } = renderHook(() =>
            useFollow({ type: 'following', username: 'deniz' }),
        );

        await waitFor(() => {
            expect(result.current.users[0]?.username).toBe('carol');
        });

        expect(fetchFollowing).toHaveBeenCalledWith('deniz');
        expect(fetchFollowers).not.toHaveBeenCalled();
    });

    it('loads liked users for a comment in likedBy mode', async () => {
        (fetchCommentLikedUsers as jest.Mock).mockResolvedValue([
            { id: 8, username: 'dina', displayName: 'Dina', followedByMe: true },
        ]);

        const { result } = renderHook(() =>
            useFollow({ type: 'likedBy', commentId: 41 }),
        );

        await waitFor(() => {
            expect(result.current.users[0]?.username).toBe('dina');
        });

        expect(fetchCommentLikedUsers).toHaveBeenCalledWith(41);
        expect(fetchLikedUsers).not.toHaveBeenCalled();
    });

    it('does not fetch followers when username is missing', async () => {
        const { result } = renderHook(() => useFollow({ type: 'followers' }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(fetchFollowers).not.toHaveBeenCalled();
        expect(result.current.users).toEqual([]);
    });

    it('does not fetch liked users when both postId and commentId are missing', async () => {
        const { result } = renderHook(() => useFollow({ type: 'likedBy' }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(fetchLikedUsers).not.toHaveBeenCalled();
        expect(fetchCommentLikedUsers).not.toHaveBeenCalled();
        expect(result.current.users).toEqual([]);
    });

    it('skips fetch and resets state when disabled', async () => {
        const { result } = renderHook(() =>
            useFollow({ type: 'followers', username: 'deniz', enabled: false }),
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(fetchFollowers).not.toHaveBeenCalled();
        expect(result.current.users).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('optimistically updates and rolls back follow state on mutation failure', async () => {
        (fetchFollowers as jest.Mock).mockResolvedValue([
            { id: 2, username: 'alice', displayName: 'Alice', followedByMe: false },
        ]);
        (followUser as jest.Mock).mockRejectedValue(new Error('network down'));

        const { result } = renderHook(() =>
            useFollow({ type: 'followers', username: 'deniz' }),
        );

        await waitFor(() => {
            expect(result.current.users).toHaveLength(1);
        });

        await act(async () => {
            await result.current.toggleFollow('alice', true);
        });

        expect(followUser).toHaveBeenCalledWith('alice');

        await waitFor(() => {
            const alice = result.current.users.find(user => user.username === 'alice');
            expect(alice).toBeDefined();
            expect(alice?.followedByMe).toBe(false);
        });
    });

    it('calls unfollowUser when toggling follow off', async () => {
        (fetchFollowers as jest.Mock).mockResolvedValue([
            { id: 3, username: 'alice', displayName: 'Alice', followedByMe: true },
        ]);
        (unfollowUser as jest.Mock).mockResolvedValue(true);

        const { result } = renderHook(() =>
            useFollow({ type: 'followers', username: 'deniz' }),
        );

        await waitFor(() => {
            expect(result.current.users).toHaveLength(1);
        });

        await act(async () => {
            await result.current.toggleFollow('alice', false);
        });

        expect(unfollowUser).toHaveBeenCalledWith('alice');
    });

    it('sets error message from thrown Error when refresh fails', async () => {
        (fetchFollowers as jest.Mock).mockRejectedValue(new Error('boom'));

        const { result } = renderHook(() =>
            useFollow({ type: 'followers', username: 'deniz' }),
        );

        await waitFor(() => {
            expect(result.current.error).toBe('boom');
        });

        expect(result.current.users).toEqual([]);
    });

    it('supports manual refresh calls', async () => {
        (fetchFollowers as jest.Mock).mockResolvedValue([
            { id: 9, username: 'alice', displayName: 'Alice', followedByMe: false },
        ]);

        const { result } = renderHook(() =>
            useFollow({ type: 'followers', username: 'deniz' }),
        );

        await waitFor(() => {
            expect(fetchFollowers).toHaveBeenCalledTimes(1);
        });

        await act(async () => {
            await result.current.refresh();
        });

        expect(fetchFollowers).toHaveBeenCalledTimes(2);
    });
});
