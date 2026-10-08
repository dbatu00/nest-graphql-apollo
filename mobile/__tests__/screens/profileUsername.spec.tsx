import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import UsernameScreen from '../../app/(app)/profile/[username]';
import { useAuth } from '../../hooks/useAuth';
import { useActivities } from '../../hooks/useActivities';
import { useFollow } from '../../hooks/useFollow';
import { fetchUserProfileMeta } from '../../graphql/client';

jest.mock('expo-router', () => ({
    useLocalSearchParams: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
}));

jest.mock('../../hooks/useAuth', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    }),
}));

jest.mock('../../hooks/useActivities', () => ({
    useActivities: jest.fn(),
}));

jest.mock('../../hooks/useFollow', () => ({
    useFollow: jest.fn(),
}));

jest.mock('../../graphql/client', () => ({
    fetchUserProfileMeta: jest.fn(),
}));

jest.mock('../../components/layout/PageShell', () => ({
    PageShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../components/layout/Header', () => ({
    Header: () => null,
}));

jest.mock('../../components/layout/AppHeaderActions', () => ({
    AppHeaderActions: () => null,
}));

jest.mock('../../components/feed/ActivityList', () => ({
    ActivityList: () => null,
}));

jest.mock('../../components/user/UserList', () => ({
    UserList: () => null,
}));

describe('profile username screen', () => {
    const followResult = {
        users: [],
        loading: false,
        error: null,
        toggleFollow: jest.fn(),
        refresh: jest.fn(),
    };

    const activityResult = {
        activities: [],
        visibleActivities: [],
        loading: false,
        error: null,
        refresh: jest.fn(),
        toggleFollow: jest.fn(),
        togglePostLike: jest.fn(),
        toggleCommentLike: jest.fn(),
        deletePost: jest.fn(),
        deleteComment: jest.fn(),
        publishPost: jest.fn(),
        publishComment: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (require('expo-router').useLocalSearchParams as jest.Mock).mockReturnValue({ username: 'alice' });

        (useAuth as jest.Mock).mockReturnValue({
            user: {
                id: 42,
                username: 'alice',
                emailVerified: true,
            },
        });

        (useActivities as jest.Mock).mockReturnValue(activityResult);
        (useFollow as jest.Mock).mockImplementation(() => followResult);

        (fetchUserProfileMeta as jest.Mock).mockResolvedValue({
            displayName: 'Alice A.',
            bio: 'About Alice',
            avatarUrl: '',
            coverUrl: '',
        });
    });

    it('hydrates and renders profile metadata for username', async () => {
        const { getByText } = render(<UsernameScreen />);

        await waitFor(() => {
            expect(fetchUserProfileMeta).toHaveBeenCalledWith('alice');
            expect(getByText('Alice A.')).toBeTruthy();
            expect(getByText('@alice')).toBeTruthy();
            expect(getByText('About Alice')).toBeTruthy();
        });
    });

    it('wires posts tab feed with own-profile includeSelfLikes', async () => {
        render(<UsernameScreen />);

        await waitFor(() => {
            expect(useActivities).toHaveBeenCalledWith({
                types: ['post'],
                scopeUsername: 'alice',
                includeSelfLikes: true,
            });
        });
    });

    it('switches to likes tab and requests like activities', async () => {
        const { getByText } = render(<UsernameScreen />);

        fireEvent.press(getByText('profile.tab.likes'));

        await waitFor(() => {
            expect(useActivities).toHaveBeenLastCalledWith({
                types: ['like'],
                scopeUsername: 'alice',
                includeSelfLikes: true,
            });
        });
    });

    it('enables followers source when followers tab is selected', async () => {
        const { getByText } = render(<UsernameScreen />);

        fireEvent.press(getByText('profile.tab.followers'));

        await waitFor(() => {
            expect(useFollow).toHaveBeenCalledWith({
                type: 'followers',
                username: 'alice',
                enabled: true,
            });
        });

        expect(useFollow).toHaveBeenCalledWith({
            type: 'following',
            username: 'alice',
            enabled: false,
        });
    });
});
