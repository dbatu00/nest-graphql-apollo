import { AuthResolver } from '../auth.resolver';

describe('AuthResolver', () => {
    const authService = {
        signUp: jest.fn(),
        login: jest.fn(),
        isEmailUsed: jest.fn(),
        verifyEmail: jest.fn(),
        resendVerification: jest.fn(),
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

        await expect(resolver.signUp({ username: 'deniz', email: 'deniz@example.com', password: 'secret123' } as any)).resolves.toBe(payload);
        expect(authService.signUp).toHaveBeenCalledWith('deniz', 'deniz@example.com', 'secret123');
    });

    it('signUp propagates service errors', async () => {
        authService.signUp.mockRejectedValue(new Error('signup failed'));

        await expect(resolver.signUp({ username: 'deniz', email: 'deniz@example.com', password: 'secret123' } as any)).rejects.toThrow('signup failed');
    });

    it('login forwards credentials to service', async () => {
        const payload = { user: { id: 1 }, token: 'jwt' };
        authService.login.mockResolvedValue(payload);

        await expect(resolver.login({ identifier: 'deniz', password: 'secret123' } as any)).resolves.toBe(payload);
        expect(authService.login).toHaveBeenCalledWith('deniz', 'secret123');
    });

    it('login propagates service errors', async () => {
        authService.login.mockRejectedValue(new Error('login failed'));

        await expect(resolver.login({ identifier: 'deniz', password: 'secret123' } as any)).rejects.toThrow('login failed');
    });

    it('isEmailUsed forwards email to service', async () => {
        authService.isEmailUsed.mockResolvedValue(true);

        await expect(resolver.isEmailUsed({ email: 'deniz@example.com' } as any)).resolves.toBe(true);
        expect(authService.isEmailUsed).toHaveBeenCalledWith('deniz@example.com');
    });


    it('resendMyVerificationLink forwards current user id to service', async () => {
        authService.resendVerification.mockResolvedValue(true);

        await expect(resolver.resendMyVerificationLink({ id: 7 } as any)).resolves.toBe(true);
        expect(authService.resendVerification).toHaveBeenCalledWith(7);
    });
});
