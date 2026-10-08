import {
    fetchFeed,
    isUsernameAvailable,
    login,
    signUp,
} from '../../graphql/client';
import { graphqlFetch } from '../../utils/graphqlFetch';
import { getStoredAppLanguage } from '../../utils/appLanguage';

jest.mock('../../utils/graphqlFetch', () => ({
    graphqlFetch: jest.fn(),
}));

jest.mock('../../utils/appLanguage', () => ({
    getStoredAppLanguage: jest.fn(),
}));

describe('graphql client contracts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getStoredAppLanguage as jest.Mock).mockResolvedValue(null);
    });

    it('login trims identifier and calls graphqlFetch', async () => {
        (graphqlFetch as jest.Mock).mockResolvedValue({
            login: {
                token: 'a',
                refreshToken: 'b',
                emailVerified: true,
                user: {
                    id: 1,
                    username: 'alice',
                    displayName: 'Alice',
                    bio: '',
                    avatarUrl: '',
                    coverUrl: '',
                    email: 'alice@example.com',
                },
            },
        });

        await login('  alice@example.com  ', 'password123');

        expect(graphqlFetch).toHaveBeenCalledWith(
            expect.anything(),
            { identifier: 'alice@example.com', password: 'password123' },
        );
    });

    it('login throws when identifier is empty after trim', async () => {
        await expect(login('   ', 'password123')).rejects.toThrow('Identifier is required');
        expect(graphqlFetch).not.toHaveBeenCalled();
    });

    it('signUp normalizes username/email and sends app-language header when available', async () => {
        (getStoredAppLanguage as jest.Mock).mockResolvedValue('tr');
        (graphqlFetch as jest.Mock).mockResolvedValue({
            signUp: {
                token: 'a',
                refreshToken: 'b',
                emailVerified: false,
                user: {
                    id: 2,
                    username: 'alice',
                    displayName: 'Alice',
                    bio: '',
                    avatarUrl: '',
                    coverUrl: '',
                    email: 'alice@example.com',
                },
            },
        });

        await signUp('  alice  ', '  ALICE@EXAMPLE.COM  ', 'password123');

        expect(graphqlFetch).toHaveBeenCalledWith(
            expect.anything(),
            {
                username: 'alice',
                email: 'alice@example.com',
                password: 'password123',
            },
            { headers: { 'x-app-language': 'tr' } },
        );
    });

    it('isUsernameAvailable returns true when profile query fails', async () => {
        (graphqlFetch as jest.Mock).mockRejectedValue(new Error('network'));

        await expect(isUsernameAvailable('alice')).resolves.toBe(true);
    });

    it('fetchFeed uppercases input types and normalizes response types to lowercase', async () => {
        (graphqlFetch as jest.Mock).mockResolvedValue({
            feed: [
                {
                    id: 10,
                    type: 'POST',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    active: true,
                    actor: { id: 1, username: 'alice', displayName: 'Alice', avatarUrl: '' },
                    targetPost: {
                        id: 77,
                        content: 'hello',
                        createdAt: '2026-01-01T00:00:00.000Z',
                        user: {
                            id: 1,
                            username: 'alice',
                            displayName: 'Alice',
                            avatarUrl: '',
                            followedByMe: false,
                        },
                        likedByMe: false,
                        likesCount: 0,
                        comments: [],
                    },
                },
            ],
        });

        const feed = await fetchFeed({ username: '  alice  ', types: ['post', 'like'] as any });

        expect(graphqlFetch).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ username: 'alice', types: ['POST', 'LIKE'] }),
        );
        expect(feed[0].type).toBe('post');
    });
});
