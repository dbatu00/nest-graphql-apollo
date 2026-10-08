import { renderHook } from '@testing-library/react-native';

import { useProfileMeta } from '../../hooks/useProfileMeta';
import { useAuth } from '../../hooks/useAuth';

jest.mock('../../hooks/useAuth', () => ({
    useAuth: jest.fn(),
}));

describe('useProfileMeta', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns mapped profile metadata and forwards loading/refresh', () => {
        const refreshAuth = jest.fn();
        (useAuth as jest.Mock).mockReturnValue({
            user: {
                id: 7,
                username: 'alice',
                displayName: 'Alice',
                bio: 'hello',
                avatarUrl: 'https://img/alice.png',
                coverUrl: 'https://img/cover.png',
                email: 'alice@example.com',
                emailVerified: false,
            },
            loading: true,
            refreshAuth,
        });

        const { result } = renderHook(() => useProfileMeta());

        expect(result.current.profileMeta).toEqual({
            id: 7,
            username: 'alice',
            displayName: 'Alice',
            bio: 'hello',
            avatarUrl: 'https://img/alice.png',
            coverUrl: 'https://img/cover.png',
            email: 'alice@example.com',
        });
        expect(result.current.loading).toBe(true);
        expect(result.current.refreshProfileMeta).toBe(refreshAuth);
    });

    it('returns null profile metadata when auth user is missing', () => {
        const refreshAuth = jest.fn();
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            loading: false,
            refreshAuth,
        });

        const { result } = renderHook(() => useProfileMeta());

        expect(result.current.profileMeta).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.refreshProfileMeta).toBe(refreshAuth);
    });
});
