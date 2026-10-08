import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AppHeaderActions } from '../../components/layout/AppHeaderActions';
import { useAuth } from '../../hooks/useAuth';

jest.mock('expo-router', () => ({
    router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('../../hooks/useAuth', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    }),
}));

jest.mock('../../components/common/LanguageMenu', () => ({
    HeaderLanguageMenu: () => null,
}));

jest.mock('../../components/common/LogoutButton', () => ({
    FeedLogoutButton: ({ onPress }: { onPress: () => void }) => {
        const { Pressable, Text } = require('react-native');
        return (
            <Pressable onPress={onPress}>
                <Text>logout-btn</Text>
            </Pressable>
        );
    },
}));

jest.mock('../../components/common/SettingsButton', () => ({
    UserSettingsButton: ({ onPress, label }: { onPress: () => void; label?: string }) => {
        const { Pressable, Text } = require('react-native');
        return (
            <Pressable onPress={onPress}>
                <Text>{label ?? 'settings-btn'}</Text>
            </Pressable>
        );
    },
}));

describe('AppHeaderActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({
            user: { id: 1, username: 'alice' },
            logout: jest.fn().mockResolvedValue(undefined),
        });
    });

    it('in feed mode, profile button navigates to current user profile', () => {
        const { getByText } = render(<AppHeaderActions mode="feed" />);

        fireEvent.press(getByText('common.profile'));

        expect(require('expo-router').router.push).toHaveBeenCalledWith({
            pathname: '/profile/[username]',
            params: { username: 'alice' },
        });
    });

    it('in profile mode, home button navigates to feed and settings opens when own profile', () => {
        const { getByText } = render(
            <AppHeaderActions mode="profile" username="alice" isOwnProfile />,
        );

        fireEvent.press(getByText('common.home'));
        fireEvent.press(getByText('settings-btn'));

        expect(require('expo-router').router.push).toHaveBeenCalledWith('/feed');
        expect(require('expo-router').router.push).toHaveBeenCalledWith({
            pathname: '/profile/[username]/settings',
            params: { username: 'alice' },
        });
    });

    it('in settings mode, profile button uses provided username', () => {
        const { getByText } = render(
            <AppHeaderActions mode="settings" username="bob" />,
        );

        fireEvent.press(getByText('common.profile'));

        expect(require('expo-router').router.push).toHaveBeenCalledWith({
            pathname: '/profile/[username]',
            params: { username: 'bob' },
        });
    });

    it('logout button triggers logout action', async () => {
        const logout = jest.fn().mockResolvedValue(undefined);
        (useAuth as jest.Mock).mockReturnValue({
            user: { id: 1, username: 'alice' },
            logout,
        });

        const { getByText } = render(<AppHeaderActions mode="feed" />);

        fireEvent.press(getByText('logout-btn'));

        await waitFor(() => {
            expect(logout).toHaveBeenCalled();
        });
    });
});
