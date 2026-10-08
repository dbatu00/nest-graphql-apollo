import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import SignUp from '../../app/(auth)/signUp';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import {
    signUp as signUpMutation,
    isUsernameAvailable,
    isEmailUsed,
} from '../../graphql/client';

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
    signUp: jest.fn(),
    isUsernameAvailable: jest.fn(),
    isEmailUsed: jest.fn(),
}));

describe('signup screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        (useAuth as jest.Mock).mockReturnValue({ setSession: jest.fn() });
        (useI18n as jest.Mock).mockReturnValue({
            language: 'en',
            setLanguage: jest.fn().mockResolvedValue(undefined),
            t: (key: string) => key,
        });

        (isUsernameAvailable as jest.Mock).mockResolvedValue(true);
        (isEmailUsed as jest.Mock).mockResolvedValue(false);
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('shows required validation errors on empty submit', async () => {
        const { getByText, getAllByText } = render(<SignUp />);

        fireEvent.press(getByText('auth.signup.submit').parent);

        await waitFor(() => {
            expect(getAllByText('auth.signup.error.required').length).toBeGreaterThan(1);
        });
    });

    it('sets session and routes unverified users to verify mail', async () => {
        const setSession = jest.fn().mockResolvedValue(undefined);
        (useAuth as jest.Mock).mockReturnValue({ setSession });
        (signUpMutation as jest.Mock).mockResolvedValue({
            token: 'token-a',
            refreshToken: 'refresh-b',
            emailVerified: false,
            user: {
                id: 1,
                username: 'alice',
                displayName: 'Alice',
                bio: '',
                avatarUrl: '',
                coverUrl: '',
                email: 'alice@example.com',
            },
        });

        const { getByPlaceholderText, getByText } = render(<SignUp />);

        fireEvent.changeText(getByPlaceholderText('auth.signup.usernamePlaceholder'), 'alice');
        fireEvent.changeText(getByPlaceholderText('auth.signup.emailPlaceholder'), 'alice@example.com');
        fireEvent.changeText(getByPlaceholderText('auth.signup.passwordPlaceholder'), 'password123');
        fireEvent.changeText(getByPlaceholderText('auth.signup.confirmPasswordPlaceholder'), 'password123');

        fireEvent.press(getByText('auth.signup.submit').parent);

        await waitFor(() => {
            expect(signUpMutation).toHaveBeenCalledWith('alice', 'alice@example.com', 'password123');
            expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ token: 'token-a' }));
        });

        await act(async () => {
            jest.advanceTimersByTime(650);
        });

        expect(require('expo-router').router.replace).toHaveBeenCalledWith('/(auth)/verify-mail');
    });

    it('navigates back to login when back link is pressed', async () => {
        const { getByText } = render(<SignUp />);

        fireEvent.press(getByText('auth.signup.backToLogin').parent);

        await waitFor(() => {
            expect(require('expo-router').router.push).toHaveBeenCalledWith('/(auth)/login');
        });
    });
});
