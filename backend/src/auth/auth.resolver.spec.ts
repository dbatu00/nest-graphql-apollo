import { AuthResolver } from './auth.resolver';

describe('AuthResolver', () => {
    const createAuthService = () => ({
        signUp: jest.fn(),
        login: jest.fn(),
        refreshAuth: jest.fn(),
        changeMyPassword: jest.fn(),
        changeMyEmail: jest.fn(),
        deleteMyAccount: jest.fn(),
        isEmailUsed: jest.fn(),
        resendVerification: jest.fn(),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns current user for me()', () => {
        const resolver = new AuthResolver(createAuthService() as any);
        const user = { id: 1, username: 'alice' } as any;

        expect(resolver.me(user)).toBe(user);
    });

    it('passes language header to signUp/login/changeMyEmail/resendMyVerificationLink', async () => {
        const authService = createAuthService();
        const resolver = new AuthResolver(authService as any);

        await resolver.signUp(
            { username: 'alice', email: 'alice@example.com', password: 'password123' } as any,
            { req: { headers: { 'x-app-language': 'tr' } } } as any,
        );
        await resolver.login(
            { identifier: 'alice', password: 'password123' } as any,
            { req: { headers: { 'x-app-language': ['de'] } } } as any,
        );
        await resolver.changeMyEmail(
            { id: 2 } as any,
            { newEmail: 'new@example.com', currentPassword: 'password123' } as any,
            { req: { headers: {} } } as any,
        );
        await resolver.resendMyVerificationLink(
            { id: 2 } as any,
            { req: { headers: { 'x-app-language': 'en' } } } as any,
        );

        expect(authService.signUp).toHaveBeenCalledWith('alice', 'alice@example.com', 'password123', 'tr');
        expect(authService.login).toHaveBeenCalledWith('alice', 'password123', 'de');
        expect(authService.changeMyEmail).toHaveBeenCalledWith(2, 'new@example.com', 'password123', undefined);
        expect(authService.resendVerification).toHaveBeenCalledWith(2, 'en');
    });

    it('delegates refresh/password/delete/isEmailUsed methods', async () => {
        const authService = createAuthService();
        const resolver = new AuthResolver(authService as any);

        await resolver.refreshAuth('refresh-token');
        await resolver.changeMyPassword(
            { id: 8 } as any,
            { currentPassword: 'oldpassword', newPassword: 'newpassword' } as any,
        );
        await resolver.deleteMyAccount(
            { id: 8 } as any,
            { currentPassword: 'oldpassword' } as any,
        );
        await resolver.isEmailUsed({ email: 'x@example.com' } as any);

        expect(authService.refreshAuth).toHaveBeenCalledWith('refresh-token');
        expect(authService.changeMyPassword).toHaveBeenCalledWith(8, 'oldpassword', 'newpassword');
        expect(authService.deleteMyAccount).toHaveBeenCalledWith(8, 'oldpassword');
        expect(authService.isEmailUsed).toHaveBeenCalledWith('x@example.com');
    });

    it('signUp forwards undefined language when context is missing', async () => {
        const authService = createAuthService();
        authService.signUp.mockResolvedValue({ token: 't' });
        const resolver = new AuthResolver(authService as any);

        await expect(
            resolver.signUp(
                { username: 'alice', email: 'alice@example.com', password: 'password123' } as any,
                {} as any,
            ),
        ).resolves.toEqual({ token: 't' });

        expect(authService.signUp).toHaveBeenCalledWith('alice', 'alice@example.com', 'password123', undefined);
    });

    it('signUp uses first language value when header is an array', async () => {
        const authService = createAuthService();
        const resolver = new AuthResolver(authService as any);

        await resolver.signUp(
            { username: 'alice', email: 'alice@example.com', password: 'password123' } as any,
            { req: { headers: { 'x-app-language': ['de', 'tr'] } } } as any,
        );

        expect(authService.signUp).toHaveBeenCalledWith('alice', 'alice@example.com', 'password123', 'de');
    });

    it('login forwards identifier, password, and scalar language', async () => {
        const authService = createAuthService();
        const resolver = new AuthResolver(authService as any);

        await resolver.login(
            { identifier: 'alice', password: 'password123' } as any,
            { req: { headers: { 'x-app-language': 'tr' } } } as any,
        );

        expect(authService.login).toHaveBeenCalledWith('alice', 'password123', 'tr');
    });

    it('refreshAuth returns delegated auth payload', async () => {
        const authService = createAuthService();
        authService.refreshAuth.mockResolvedValue({ token: 'new-token' });
        const resolver = new AuthResolver(authService as any);

        await expect(resolver.refreshAuth('refresh-token')).resolves.toEqual({ token: 'new-token' });
    });

    it('changeMyPassword forwards current and new password', async () => {
        const authService = createAuthService();
        authService.changeMyPassword.mockResolvedValue(true);
        const resolver = new AuthResolver(authService as any);

        await expect(
            resolver.changeMyPassword(
                { id: 15 } as any,
                { currentPassword: 'oldpassword', newPassword: 'newpassword' } as any,
            ),
        ).resolves.toBe(true);

        expect(authService.changeMyPassword).toHaveBeenCalledWith(15, 'oldpassword', 'newpassword');
    });

    it('changeMyEmail forwards undefined language when header object is empty', async () => {
        const authService = createAuthService();
        authService.changeMyEmail.mockResolvedValue(true);
        const resolver = new AuthResolver(authService as any);

        await expect(
            resolver.changeMyEmail(
                { id: 22 } as any,
                { newEmail: 'new@example.com', currentPassword: 'password123' } as any,
                { req: { headers: {} } } as any,
            ),
        ).resolves.toBe(true);

        expect(authService.changeMyEmail).toHaveBeenCalledWith(22, 'new@example.com', 'password123', undefined);
    });

    it('deleteMyAccount returns delegated boolean result', async () => {
        const authService = createAuthService();
        authService.deleteMyAccount.mockResolvedValue(false);
        const resolver = new AuthResolver(authService as any);

        await expect(
            resolver.deleteMyAccount(
                { id: 9 } as any,
                { currentPassword: 'password123' } as any,
            ),
        ).resolves.toBe(false);
    });

    it('resendMyVerificationLink forwards language from array header', async () => {
        const authService = createAuthService();
        authService.resendVerification.mockResolvedValue('SENT');
        const resolver = new AuthResolver(authService as any);

        await expect(
            resolver.resendMyVerificationLink(
                { id: 2 } as any,
                { req: { headers: { 'x-app-language': ['en', 'tr'] } } } as any,
            ),
        ).resolves.toBe('SENT');

        expect(authService.resendVerification).toHaveBeenCalledWith(2, 'en');
    });
});
