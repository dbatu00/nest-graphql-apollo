import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import Login from '../../app/(auth)/login';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { login as loginMutation } from '../../graphql/client';

jest.mock('expo-router', () => ({
    router: { replace: jest.fn(), push: jest.fn() },
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
}));

jest.mock('../../hooks/useAuth', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../../hooks/useI18n', () => ({
    useI18n: jest.fn(),
}));

jest.mock('../../graphql/client', () => ({
    login: jest.fn(),
}));

describe('login screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({ setSession: jest.fn() });
        (useI18n as jest.Mock).mockReturnValue({
            language: 'en',
            setLanguage: jest.fn(),
            t: (key: string) => key,
        });
    });

    it('shows validation errors when required fields are missing', async () => {
        const { getByText } = render(<Login />);

        fireEvent.press(getByText('auth.login.submit').parent);

        await waitFor(() => {
            expect(getByText('auth.login.error.identifierRequired')).toBeTruthy();
            expect(getByText('auth.login.error.passwordRequired')).toBeTruthy();
        });
    });

    it('sets the session and redirects verified users to the feed', async () => {
        const setSession = jest.fn();
        (useAuth as jest.Mock).mockReturnValue({ setSession });
        (loginMutation as jest.Mock).mockResolvedValue({
            token: 'a',
            refreshToken: 'b',
            emailVerified: true,
            user: { id: 1, username: 'alice', displayName: 'Alice', bio: '', avatarUrl: '', coverUrl: '', email: 'alice@example.com' },
        });

        const { getByPlaceholderText, getByText } = render(<Login />);

        fireEvent.changeText(getByPlaceholderText('auth.login.identifierPlaceholder'), 'alice');
        fireEvent.changeText(getByPlaceholderText('auth.login.passwordPlaceholder'), 'password123');
        fireEvent.press(getByText('auth.login.submit').parent);

        await waitFor(() => {
            expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ token: 'a' }));
            expect(require('expo-router').router.replace).toHaveBeenCalledWith('/(app)/feed');
        });
    });
});
