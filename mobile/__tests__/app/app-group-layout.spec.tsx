import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import AppGroupLayout from '../../app/(app)/_layout';
import { useAuth } from '../../hooks/useAuth';

jest.mock('expo-router', () => ({
    Redirect: jest.fn(() => null),
    Stack: jest.fn(() => null),
}));

jest.mock('../../hooks/useAuth', () => ({
    useAuth: jest.fn(),
}));

describe('app group layout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('redirects to login when user is missing', async () => {
        (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });

        render(<AppGroupLayout />);

        await waitFor(() => {
            expect(require('expo-router').Redirect).toHaveBeenCalledWith(
                expect.objectContaining({ href: '/(auth)/login' }),
                undefined,
            );
        });
    });

    it('redirects to verify-mail when user is not verified', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: { id: 1, username: 'alice', emailVerified: false },
            loading: false,
        });

        render(<AppGroupLayout />);

        await waitFor(() => {
            expect(require('expo-router').Redirect).toHaveBeenCalledWith(
                expect.objectContaining({ href: '/(auth)/verify-mail' }),
                undefined,
            );
        });
    });

    it('renders stack for verified user', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: { id: 1, username: 'alice', emailVerified: true },
            loading: false,
        });

        render(<AppGroupLayout />);

        await waitFor(() => {
            expect(require('expo-router').Stack).toHaveBeenCalled();
        });
    });
});
