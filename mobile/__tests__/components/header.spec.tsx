import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { Header } from '../../components/layout/Header';
import { useAuth } from '../../hooks/useAuth';

jest.mock('expo-router', () => ({
    router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
}));

jest.mock('../../hooks/useAuth', () => ({
    useAuth: jest.fn(),
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

describe('Header', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({
            user: { id: 1, username: 'alice' },
            logout: jest.fn().mockResolvedValue(undefined),
        });
    });

    it('pressing title navigates to feed when no onRefresh is provided', () => {
        const { getByText } = render(<Header />);

        fireEvent.press(getByText('BookBook'));

        expect(require('expo-router').router.replace).toHaveBeenCalledWith('/feed');
    });

    it('pressing title calls onRefresh when provided', () => {
        const onRefresh = jest.fn();
        const { getByText } = render(<Header onRefresh={onRefresh} />);

        fireEvent.press(getByText('BookBook'));

        expect(onRefresh).toHaveBeenCalled();
        expect(require('expo-router').router.replace).not.toHaveBeenCalled();
    });

    it('default profile button navigates to current user profile', () => {
        const { getByText } = render(<Header />);

        fireEvent.press(getByText('Profile'));

        expect(require('expo-router').router.push).toHaveBeenCalledWith({
            pathname: '/profile/[username]',
            params: { username: 'alice' },
        });
    });

    it('logout button calls logout action', async () => {
        const logout = jest.fn().mockResolvedValue(undefined);
        (useAuth as jest.Mock).mockReturnValue({
            user: { id: 1, username: 'alice' },
            logout,
        });

        const { getByText } = render(<Header />);

        fireEvent.press(getByText('logout-btn'));

        await waitFor(() => {
            expect(logout).toHaveBeenCalled();
        });
    });
});
