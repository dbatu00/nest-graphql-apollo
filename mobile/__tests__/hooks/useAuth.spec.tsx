import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AuthProvider, useAuth } from '../../hooks/useAuth';
import { getCurrentUser } from '../../utils/currentUser';
import { getToken, getRefreshToken, clearToken, saveToken, saveRefreshToken } from '../../utils/token';
import { refreshAuth as refreshAuthMutation } from '../../graphql/client';

jest.mock('../../utils/currentUser', () => ({
    getCurrentUser: jest.fn(),
}));

jest.mock('../../utils/token', () => ({
    getToken: jest.fn(),
    getRefreshToken: jest.fn(),
    saveToken: jest.fn(),
    saveRefreshToken: jest.fn(),
    clearToken: jest.fn(),
}));

jest.mock('../../utils/graphqlFetch', () => ({
    registerAuthFailureHandler: jest.fn(() => () => undefined),
}));

jest.mock('../../graphql/client', () => ({
    refreshAuth: jest.fn(),
}));

describe('useAuth', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
    );

    beforeEach(() => {
        jest.clearAllMocks();
        (getToken as jest.Mock).mockResolvedValue(null);
        (getRefreshToken as jest.Mock).mockResolvedValue(null);
    });

    it('restores a stored session on mount', async () => {
        (getToken as jest.Mock).mockResolvedValue('token-1');
        (getRefreshToken as jest.Mock).mockResolvedValue('refresh-1');
        (getCurrentUser as jest.Mock).mockResolvedValue({
            id: 1,
            username: 'alice',
            displayName: 'Alice',
            bio: '',
            avatarUrl: '',
            coverUrl: '',
            email: 'alice@example.com',
            emailVerified: true,
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.user?.username).toBe('alice');
        });

        expect(result.current.loading).toBe(false);
        expect(getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('clears the user when no token exists', async () => {
        (getToken as jest.Mock).mockResolvedValue(null);
        (getRefreshToken as jest.Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.user).toBeNull();
    });

    it('recovers session using refresh token when access token is missing', async () => {
        (getToken as jest.Mock).mockResolvedValue(null);
        (getRefreshToken as jest.Mock).mockResolvedValue('refresh-1');
        (refreshAuthMutation as jest.Mock).mockResolvedValue({
            token: 'new-access',
            refreshToken: 'new-refresh',
            emailVerified: true,
            user: {
                id: 5,
                username: 'bob',
                displayName: 'Bob',
                bio: '',
                avatarUrl: '',
                coverUrl: '',
                email: 'bob@example.com',
            },
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.user?.username).toBe('bob');
        });

        expect(saveToken).toHaveBeenCalledWith('new-access');
        expect(saveRefreshToken).toHaveBeenCalledWith('new-refresh');
    });

    it('setSession updates user and persists provided tokens', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.setSession({
                token: 'manual-token',
                refreshToken: 'manual-refresh',
                emailVerified: false,
                user: {
                    id: 9,
                    username: 'carol',
                    displayName: 'Carol',
                    bio: '',
                    avatarUrl: '',
                    coverUrl: '',
                    email: 'carol@example.com',
                },
            });
        });

        await waitFor(() => {
            expect(result.current.user?.username).toBe('carol');
        });

        expect(saveToken).toHaveBeenCalledWith('manual-token');
        expect(saveRefreshToken).toHaveBeenCalledWith('manual-refresh');
    });

    it('logout clears token and user state', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.setSession({
                token: 'token-1',
                emailVerified: true,
                user: {
                    id: 11,
                    username: 'dina',
                    displayName: 'Dina',
                    bio: '',
                    avatarUrl: '',
                    coverUrl: '',
                    email: 'dina@example.com',
                },
            });
        });

        await waitFor(() => {
            expect(result.current.user?.username).toBe('dina');
        });

        await act(async () => {
            await result.current.logout();
        });

        expect(clearToken).toHaveBeenCalled();
        expect(result.current.user).toBeNull();
    });

    it('keeps existing user on transient getCurrentUser failure', async () => {
        (getToken as jest.Mock).mockResolvedValue('token-1');
        (getRefreshToken as jest.Mock).mockResolvedValue('refresh-1');
        (getCurrentUser as jest.Mock)
            .mockResolvedValueOnce({
                id: 1,
                username: 'alice',
                displayName: 'Alice',
                bio: '',
                avatarUrl: '',
                coverUrl: '',
                email: 'alice@example.com',
                emailVerified: true,
            })
            .mockRejectedValueOnce(new Error('network')); // explicit transient failure path

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.user?.username).toBe('alice');
        });

        await act(async () => {
            const refreshed = await result.current.refreshAuth();
            expect(refreshed?.username).toBe('alice');
        });

        expect(result.current.user?.username).toBe('alice');
    });
});
