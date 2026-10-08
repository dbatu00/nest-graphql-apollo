import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { ActivityRow } from '../../components/feed/ActivityRow';

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
    MaterialCommunityIcons: () => null,
}));

jest.mock('expo-blur', () => ({
    BlurView: () => null,
}));

jest.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    }),
}));

jest.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: {
            id: 1,
            username: 'me',
            displayName: 'Me',
            avatarUrl: '',
        },
    }),
}));

jest.mock('../../hooks/useFollow', () => ({
    useFollow: () => ({
        users: [],
        loading: false,
        error: null,
        toggleFollow: jest.fn(),
        refresh: jest.fn(),
    }),
}));

jest.mock('../../components/common/ProfileLink', () => ({
    ProfileLink: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../components/user/UserList', () => ({
    UserList: () => null,
}));

describe('ActivityRow', () => {
    const baseActivity: any = {
        id: 10,
        type: 'post',
        createdAt: '2026-01-01T00:00:00.000Z',
        active: true,
        actor: { id: 2, username: 'alice', displayName: 'Alice', avatarUrl: '' },
        targetUser: { id: 2, username: 'alice', displayName: 'Alice', avatarUrl: '' },
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
            likesCount: 1,
            comments: [],
        },
    };

    it('calls onToggleFollow when follow button is pressed', () => {
        const onToggleFollow = jest.fn();

        const { getByText } = render(
            <ActivityRow
                activity={baseActivity}
                onToggleFollow={onToggleFollow}
            />,
        );

        fireEvent.press(getByText('user.follow'));

        expect(onToggleFollow).toHaveBeenCalledWith('alice', true);
    });

    it('submits trimmed comment text when comment input is submitted', async () => {
        const onAddComment = jest.fn().mockResolvedValue(undefined);

        const { getByPlaceholderText } = render(
            <ActivityRow
                activity={baseActivity}
                onAddComment={onAddComment}
            />,
        );

        const input = getByPlaceholderText('activity.comment.placeholder');

        fireEvent.changeText(input, '  hi there  ');
        await act(async () => {
            input.props.onSubmitEditing?.();
        });

        await waitFor(() => {
            expect(onAddComment).toHaveBeenCalledWith(77, 'hi there');
        });
    });

    it('does not submit blank comment text', async () => {
        const onAddComment = jest.fn().mockResolvedValue(undefined);

        const { getByPlaceholderText } = render(
            <ActivityRow
                activity={baseActivity}
                onAddComment={onAddComment}
            />,
        );

        const input = getByPlaceholderText('activity.comment.placeholder');

        fireEvent.changeText(input, '   ');
        await act(async () => {
            input.props.onSubmitEditing?.();
        });

        expect(onAddComment).not.toHaveBeenCalled();
    });

    it('opens post delete confirm and deletes owner post', async () => {
        const onDeletePost = jest.fn();

        const ownerActivity = {
            ...baseActivity,
            targetPost: {
                ...baseActivity.targetPost,
                user: {
                    ...baseActivity.targetPost.user,
                    id: 1,
                    username: 'me',
                    displayName: 'Me',
                },
            },
        };

        const { getByText } = render(
            <ActivityRow
                activity={ownerActivity as any}
                onDeletePost={onDeletePost}
            />,
        );

        fireEvent.press(getByText('✕'));
        fireEvent.press(getByText('activity.confirm.delete'));

        await waitFor(() => {
            expect(onDeletePost).toHaveBeenCalledWith(77);
        });
    });
});
