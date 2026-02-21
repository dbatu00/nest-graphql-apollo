import { AuthResolver } from '../auth.resolver';

describe('AuthResolver', () => {
    const authService = {
        signUp: jest.fn(),
        login: jest.fn(),
    };

    let resolver: AuthResolver;

    beforeEach(() => {
        jest.clearAllMocks();
        resolver = new AuthResolver(authService as any);
    });

    it('me returns current user', () => {
        const user = { id: 1, username: 'deniz' };
        expect(resolver.me(user as any)).toBe(user);
    });

    it('me returns undefined when decorator value is missing', () => {
        expect(resolver.me(undefined as any)).toBeUndefined();
    });

    it('signUp forwards credentials to service', async () => {
        const payload = { user: { id: 1 }, token: 'jwt' };
        authService.signUp.mockResolvedValue(payload);

        await expect(resolver.signUp('deniz', 'secret')).resolves.toBe(payload);
        expect(authService.signUp).toHaveBeenCalledWith('deniz', 'secret');
    });

    it('signUp propagates service errors', async () => {
        authService.signUp.mockRejectedValue(new Error('signup failed'));

        await expect(resolver.signUp('deniz', 'secret')).rejects.toThrow('signup failed');
    });

    it('login forwards credentials to service', async () => {
        const payload = { user: { id: 1 }, token: 'jwt' };
        authService.login.mockResolvedValue(payload);

        await expect(resolver.login('deniz', 'secret')).resolves.toBe(payload);
        expect(authService.login).toHaveBeenCalledWith('deniz', 'secret');
    });

    it('login propagates service errors', async () => {
        authService.login.mockRejectedValue(new Error('login failed'));

        await expect(resolver.login('deniz', 'secret')).rejects.toThrow('login failed');
    });
});
