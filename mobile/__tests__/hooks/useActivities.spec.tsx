import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useActivities } from '../../hooks/useActivities';
import { useAuth } from '../../hooks/useAuth';
import {
    addPost,
    addComment,
    fetchFeed,
    likeComment,
    likePost,
    unlikeComment,
    unlikePost,
    followUser,
    unfollowUser,
} from '../../graphql/client';
import { silenceConsole } from '../test-utils/jest';

const translate = (key: string) => key;

jest.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        t: translate,
    }),
}));

jest.mock('../../hooks/useAuth', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../../graphql/client', () => ({
    fetchFeed: jest.fn(),
    addPost: jest.fn(),
    likePost: jest.fn(),
    unlikePost: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
    addComment: jest.fn(),
    likeComment: jest.fn(),
    unlikeComment: jest.fn(),
    deletePost: jest.fn(),
    deleteComment: jest.fn(),
}));

describe('useActivities', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        errorSpy = silenceConsole('error');
        (useAuth as jest.Mock).mockReturnValue({
            user: {
                id: 1,
                username: 'deniz',
                displayName: 'Deniz',
                avatarUrl: '',
            },
        });

        (fetchFeed as jest.Mock).mockResolvedValue([
            {
                id: 10,
                type: 'post',
                createdAt: '2026-01-01T00:00:00.000Z',
                active: true,
                actor: { id: 2, username: 'alice', displayName: 'Alice', avatarUrl: '' },
                targetPost: {
                    id: 77,
                    content: 'hello world',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    user: {
                        id: 2,
                        username: 'alice',
                        displayName: 'Alice',
                        avatarUrl: '',
                        followedByMe: false,
                    },
                    likedByMe: false,
                    likesCount: 3,
                    comments: [],
                },
            },
        ]);
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    it('loads feed activities on mount', async () => {
        const { result } = renderHook(() => useActivities());

        await waitFor(() => {
            expect(result.current.activities).toHaveLength(1);
        });

        expect(fetchFeed).toHaveBeenCalledWith({ types: undefined });
        expect(result.current.activities[0].targetPost?.content).toBe('hello world');
    });

    it('does not publish when post content is blank', async () => {
        const { result } = renderHook(() => useActivities());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await result.current.publishPost('    ');

        expect(addPost).not.toHaveBeenCalled();
    });

    it('calls likePost when toggling an unliked post', async () => {
        (likePost as jest.Mock).mockResolvedValue({ ok: true });

        const { result } = renderHook(() => useActivities());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.togglePostLike(77, false);
        });

        expect(likePost).toHaveBeenCalledWith(77);
        expect(unlikePost).not.toHaveBeenCalled();
    });

    it('calls followUser when toggling follow on', async () => {
        (followUser as jest.Mock).mockResolvedValue(true);

        const { result } = renderHook(() => useActivities());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.toggleFollow('alice', true);
        });

        expect(followUser).toHaveBeenCalledWith('alice');
        expect(unfollowUser).not.toHaveBeenCalled();
    });

    it('sets translated error when feed loading fails', async () => {
        (fetchFeed as jest.Mock).mockRejectedValue(new Error('network error'));

        const { result } = renderHook(() => useActivities());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('feed.error.loadFailed');
        expect(result.current.activities).toEqual([]);
    });

    it('calls unlikePost when toggling a liked post', async () => {
        (unlikePost as jest.Mock).mockResolvedValue({ ok: true });

        const { result } = renderHook(() => useActivities());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.togglePostLike(77, true);
        });

        expect(unlikePost).toHaveBeenCalledWith(77);
        expect(likePost).not.toHaveBeenCalled();
    });

    it('calls unfollowUser when toggling follow off', async () => {
        (unfollowUser as jest.Mock).mockResolvedValue(true);

        const { result } = renderHook(() => useActivities());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.toggleFollow('alice', false);
        });

        expect(unfollowUser).toHaveBeenCalledWith('alice');
        expect(followUser).not.toHaveBeenCalled();
    });

    it('trims content before publishing a post', async () => {
        (addPost as jest.Mock).mockResolvedValue(101);

        const { result } = renderHook(() => useActivities());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.publishPost('   hello world   ');
        });

        expect(addPost).toHaveBeenCalledWith('hello world');
    });

    it('still publishes when user is missing (non-optimistic path)', async () => {
        (useAuth as jest.Mock).mockReturnValue({ user: null });
        (addPost as jest.Mock).mockResolvedValue(88);

        const { result } = renderHook(() => useActivities());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.publishPost('server only');
        });

        expect(addPost).toHaveBeenCalledWith('server only');
    });

    it('does not publish comment when content is blank', async () => {
        const { result } = renderHook(() => useActivities());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.publishComment(77, '   ');
        });

        expect(addComment).not.toHaveBeenCalled();
    });

    it('calls likeComment when toggling an unliked comment', async () => {
        (likeComment as jest.Mock).mockResolvedValue(true);

        const { result } = renderHook(() => useActivities());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.toggleCommentLike(501, 77, false);
        });

        expect(likeComment).toHaveBeenCalledWith(501);
        expect(unlikeComment).not.toHaveBeenCalled();
    });

    it('supports manual refresh calls', async () => {
        const { result } = renderHook(() => useActivities());

        await waitFor(() => {
            expect(fetchFeed).toHaveBeenCalledTimes(1);
        });

        await act(async () => {
            await result.current.refresh();
        });

        expect(fetchFeed).toHaveBeenCalledTimes(2);
    });
});
