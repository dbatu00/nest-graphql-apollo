import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import Layout from '../../app/_layout';
import { useAuth } from '../../hooks/useAuth';

jest.mock('expo-router', () => ({
    Redirect: jest.fn(() => null),
    Stack: jest.fn(() => null),
    useSegments: jest.fn(),
}));

jest.mock('../../hooks/useI18n', () => ({
    I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useI18n: () => ({ t: (key: string) => key, language: 'en', setLanguage: jest.fn() }),
}));

jest.mock('../../hooks/useAuth', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: jest.fn(),
}));

describe('layout auth gate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('redirects unauthenticated users away from the app group', async () => {
        (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });
        (require('expo-router').useSegments as jest.Mock).mockReturnValue(['(app)', 'feed']);

        render(<Layout />);

        await waitFor(() => {
            expect(require('expo-router').Redirect).toHaveBeenCalledWith(
                expect.objectContaining({ href: '/(auth)/login' }),
                undefined,
            );
        });
    });

    it('redirects verified users out of auth screens', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: { id: 1, username: 'alice', emailVerified: true },
            loading: false,
        });
        (require('expo-router').useSegments as jest.Mock).mockReturnValue(['(auth)', 'login']);

        render(<Layout />);

        await waitFor(() => {
            expect(require('expo-router').Redirect).toHaveBeenCalledWith(
                expect.objectContaining({ href: '/(app)/feed' }),
                undefined,
            );
        });
    });
});
