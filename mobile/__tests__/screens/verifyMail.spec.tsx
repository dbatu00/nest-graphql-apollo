import React from 'react';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';

import VerifyMail from '../../app/(auth)/verify-mail';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { resendMyVerificationLink } from '../../graphql/client';

jest.mock('expo-router', () => ({
    router: { replace: jest.fn(), push: jest.fn() },
}));

jest.mock('../../hooks/useAuth', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../../hooks/useI18n', () => ({
    useI18n: jest.fn(),
}));

jest.mock('../../graphql/client', () => ({
    resendMyVerificationLink: jest.fn(),
}));

describe('verify-mail screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        (useI18n as jest.Mock).mockReturnValue({
            t: (key: string) => key,
        });

        (useAuth as jest.Mock).mockReturnValue({
            user: {
                id: 1,
                username: 'deniz',
                displayName: 'Deniz',
                bio: '',
                avatarUrl: '',
                coverUrl: '',
                email: 'deniz@example.com',
                emailVerified: false,
            },
            refreshAuth: jest.fn().mockResolvedValue({
                id: 1,
                username: 'deniz',
                displayName: 'Deniz',
                bio: '',
                avatarUrl: '',
                coverUrl: '',
                email: 'deniz@example.com',
                emailVerified: false,
            }),
            logout: jest.fn().mockResolvedValue(undefined),
        });
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('redirects to login when user is missing', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            refreshAuth: jest.fn(),
            logout: jest.fn(),
        });

        render(<VerifyMail />);

        await waitFor(() => {
            expect(require('expo-router').router.replace).toHaveBeenCalledWith('/(auth)/login');
        });
    });

    it('redirects to feed when user is already verified', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: {
                id: 1,
                username: 'deniz',
                displayName: 'Deniz',
                bio: '',
                avatarUrl: '',
                coverUrl: '',
                email: 'deniz@example.com',
                emailVerified: true,
            },
            refreshAuth: jest.fn(),
            logout: jest.fn(),
        });

        render(<VerifyMail />);

        await waitFor(() => {
            expect(require('expo-router').router.replace).toHaveBeenCalledWith('/(app)/feed');
        });
    });

    it('navigates to feed when check status confirms verification', async () => {
        const refreshAuth = jest.fn().mockResolvedValue({
            id: 1,
            username: 'deniz',
            displayName: 'Deniz',
            bio: '',
            avatarUrl: '',
            coverUrl: '',
            email: 'deniz@example.com',
            emailVerified: true,
        });

        (useAuth as jest.Mock).mockReturnValue({
            user: {
                id: 1,
                username: 'deniz',
                displayName: 'Deniz',
                bio: '',
                avatarUrl: '',
                coverUrl: '',
                email: 'deniz@example.com',
                emailVerified: false,
            },
            refreshAuth,
            logout: jest.fn(),
        });

        const { getByText } = render(<VerifyMail />);

        fireEvent.press(getByText('auth.verify.verifiedContinue').parent);

        await act(async () => {
            jest.advanceTimersByTime(950);
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(refreshAuth).toHaveBeenCalled();
            expect(require('expo-router').router.replace).toHaveBeenCalledWith('/(app)/feed');
        });
    });

    it('shows mapped resend message for throttled status', async () => {
        (resendMyVerificationLink as jest.Mock).mockResolvedValue('THROTTLED');

        const { getByText } = render(<VerifyMail />);

        fireEvent.press(getByText('auth.verify.missingCode').parent);

        await act(async () => {
            jest.advanceTimersByTime(950);
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(resendMyVerificationLink).toHaveBeenCalled();
            expect(getByText('auth.verify.info.throttled')).toBeTruthy();
        });
    });

    it('calls logout when back to login is pressed', async () => {
        const logout = jest.fn().mockResolvedValue(undefined);
        (useAuth as jest.Mock).mockReturnValue({
            user: {
                id: 1,
                username: 'deniz',
                displayName: 'Deniz',
                bio: '',
                avatarUrl: '',
                coverUrl: '',
                email: 'deniz@example.com',
                emailVerified: false,
            },
            refreshAuth: jest.fn().mockResolvedValue(null),
            logout,
        });

        const { getByText } = render(<VerifyMail />);

        fireEvent.press(getByText('auth.verify.backToLogin').parent);

        await waitFor(() => {
            expect(logout).toHaveBeenCalled();
        });
    });
});
