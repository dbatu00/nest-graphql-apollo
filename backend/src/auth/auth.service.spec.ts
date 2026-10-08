import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { VerificationLinkResult } from './verification/verification-link-result.enum';
import { EmailSendResult } from './verification/verification-email-send-result.enum';

describe('AuthService', () => {
    const createConfig = (overrides: Record<string, unknown> = {}) => {
        const defaults: Record<string, unknown> = {
            EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: 3600,
            EMAIL_VERIFICATION_RESEND_COOLDOWN_MS: 30000,
            EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR: 5,
            AUTH_MIN_PASSWORD_LENGTH: 8,
            AUTH_MAX_LOGIN_ATTEMPTS: 5,
            AUTH_LOGIN_LOCKOUT_MINUTES: 15,
            JWT_SECRET: 'secret',
            JWT_REFRESH_EXPIRES_IN: '30d',
        };

        const values = { ...defaults, ...overrides };

        return {
            get: jest.fn((key: string) => values[key]),
            getOrThrow: jest.fn((key: string) => {
                const value = values[key];
                if (value == null) {
                    throw new Error(`missing ${key}`);
                }
                return value;
            }),
        };
    };

    const createDeps = () => {
        const dataSource = {
            transaction: jest.fn(async (cb: (manager: any) => Promise<unknown>) =>
                cb({ save: jest.fn() }),
            ),
        };

        const userRepo = {
            findOne: jest.fn(),
            exists: jest.fn(),
            save: jest.fn(),
        };

        const authRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
        };

        const tokenRepo = {
            findOne: jest.fn(),
            count: jest.fn(),
        };

        const jwt = {
            verify: jest.fn(),
            sign: jest.fn(),
        };

        const emailService = {
            sendVerificationEmail: jest.fn(),
        };

        const config = createConfig();

        return { dataSource, userRepo, authRepo, tokenRepo, jwt, emailService, config };
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('refreshAuth throws when refresh token verification fails', async () => {
        const deps = createDeps();
        deps.jwt.verify.mockImplementation(() => {
            throw new Error('bad token');
        });

        const service = new AuthService(
            deps.dataSource as any,
            deps.userRepo as any,
            deps.authRepo as any,
            deps.tokenRepo as any,
            deps.jwt as any,
            deps.emailService as any,
            deps.config as any,
        );

        await expect(service.refreshAuth('bad')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('refreshAuth throws when payload type is not refresh', async () => {
        const deps = createDeps();
        deps.jwt.verify.mockReturnValue({ sub: 1, type: 'access' });

        const service = new AuthService(
            deps.dataSource as any,
            deps.userRepo as any,
            deps.authRepo as any,
            deps.tokenRepo as any,
            deps.jwt as any,
            deps.emailService as any,
            deps.config as any,
        );

        await expect(service.refreshAuth('token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('refreshAuth throws when user does not exist', async () => {
        const deps = createDeps();
        deps.jwt.verify.mockReturnValue({ sub: 9, type: 'refresh' });
        deps.userRepo.findOne.mockResolvedValue(null);

        const service = new AuthService(
            deps.dataSource as any,
            deps.userRepo as any,
            deps.authRepo as any,
            deps.tokenRepo as any,
            deps.jwt as any,
            deps.emailService as any,
            deps.config as any,
        );

        await expect(service.refreshAuth('token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('refreshAuth returns auth payload for valid refresh token', async () => {
        const deps = createDeps();
        deps.jwt.verify.mockReturnValue({ sub: 2, type: 'refresh' });
        deps.userRepo.findOne.mockResolvedValue({ id: 2, username: 'alice', emailVerified: true });
        deps.jwt.sign
            .mockReturnValueOnce('access-token')
            .mockReturnValueOnce('refresh-token');

        const service = new AuthService(
            deps.dataSource as any,
            deps.userRepo as any,
            deps.authRepo as any,
            deps.tokenRepo as any,
            deps.jwt as any,
            deps.emailService as any,
            deps.config as any,
        );

        await expect(service.refreshAuth('token')).resolves.toEqual(
            expect.objectContaining({
                token: 'access-token',
                refreshToken: 'refresh-token',
                emailVerified: true,
                user: expect.objectContaining({ id: 2, username: 'alice' }),
            }),
        );
    });

    it('isEmailUsed normalizes email before exists check', async () => {
        const deps = createDeps();
        deps.userRepo.exists.mockResolvedValue(true);

        const service = new AuthService(
            deps.dataSource as any,
            deps.userRepo as any,
            deps.authRepo as any,
            deps.tokenRepo as any,
            deps.jwt as any,
            deps.emailService as any,
            deps.config as any,
        );

        await expect(service.isEmailUsed('  ALICE@EXAMPLE.COM  ')).resolves.toBe(true);
        expect(deps.userRepo.exists).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } });
    });

    it('processVerificationLink returns INVALID when token is missing or consumed', async () => {
        const deps = createDeps();

        const service = new AuthService(
            deps.dataSource as any,
            deps.userRepo as any,
            deps.authRepo as any,
            deps.tokenRepo as any,
            deps.jwt as any,
            deps.emailService as any,
            deps.config as any,
        );

        deps.tokenRepo.findOne.mockResolvedValueOnce(null);
        await expect(service.processVerificationLink('raw')).resolves.toBe(VerificationLinkResult.INVALID);

        deps.tokenRepo.findOne.mockResolvedValueOnce({ consumedAt: new Date(), user: { emailVerified: false } });
        await expect(service.processVerificationLink('raw')).resolves.toBe(VerificationLinkResult.INVALID);
    });

    it('processVerificationLink returns ALREADY_VERIFIED when user is already verified', async () => {
        const deps = createDeps();
        deps.tokenRepo.findOne.mockResolvedValue({
            consumedAt: null,
            expiresAt: new Date(Date.now() + 60_000),
            user: { id: 1, emailVerified: true },
        });

        const service = new AuthService(
            deps.dataSource as any,
            deps.userRepo as any,
            deps.authRepo as any,
            deps.tokenRepo as any,
            deps.jwt as any,
            deps.emailService as any,
            deps.config as any,
        );

        await expect(service.processVerificationLink('raw')).resolves.toBe(VerificationLinkResult.ALREADY_VERIFIED);
    });

    it('processVerificationLink maps expired resend outcomes', async () => {
        const deps = createDeps();
        deps.tokenRepo.findOne.mockResolvedValue({
            consumedAt: null,
            expiresAt: new Date(Date.now() - 1),
            user: { id: 1, emailVerified: false, email: 'a@example.com', username: 'alice' },
        });

        const service = new AuthService(
            deps.dataSource as any,
            deps.userRepo as any,
            deps.authRepo as any,
            deps.tokenRepo as any,
            deps.jwt as any,
            deps.emailService as any,
            deps.config as any,
        );

        jest.spyOn(service as any, 'issueVerificationTokenAndSendEmail')
            .mockResolvedValueOnce(EmailSendResult.SENT)
            .mockResolvedValueOnce(EmailSendResult.THROTTLED)
            .mockResolvedValueOnce(EmailSendResult.FAILED);

        await expect(service.processVerificationLink('raw-1')).resolves.toBe(VerificationLinkResult.EXPIRED_RESENT);
        await expect(service.processVerificationLink('raw-2')).resolves.toBe(VerificationLinkResult.EXPIRED_THROTTLED);
        await expect(service.processVerificationLink('raw-3')).resolves.toBe(VerificationLinkResult.EXPIRED_DELIVERY_FAILED);
    });

    it('processVerificationLink returns VERIFIED and persists token/user changes', async () => {
        const deps = createDeps();
        const token = {
            consumedAt: null,
            expiresAt: new Date(Date.now() + 60_000),
            user: { id: 1, emailVerified: false },
        };
        deps.tokenRepo.findOne.mockResolvedValue(token);

        const service = new AuthService(
            deps.dataSource as any,
            deps.userRepo as any,
            deps.authRepo as any,
            deps.tokenRepo as any,
            deps.jwt as any,
            deps.emailService as any,
            deps.config as any,
        );

        await expect(service.processVerificationLink('raw')).resolves.toBe(VerificationLinkResult.VERIFIED);
        expect(token.user.emailVerified).toBe(true);
        expect(token.consumedAt).toBeInstanceOf(Date);
    });

    it('throws config error when required positive integer config is invalid', () => {
        const deps = createDeps();
        deps.config = createConfig({ AUTH_MAX_LOGIN_ATTEMPTS: 0 });

        expect(
            () =>
                new AuthService(
                    deps.dataSource as any,
                    deps.userRepo as any,
                    deps.authRepo as any,
                    deps.tokenRepo as any,
                    deps.jwt as any,
                    deps.emailService as any,
                    deps.config as any,
                ),
        ).toThrow(InternalServerErrorException);
    });
});
import {
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import { AuthService } from './auth.service';
import { EmailSendResult } from './verification/verification-email-send-result.enum';

jest.mock('argon2', () => ({
    verify: jest.fn(),
    hash: jest.fn(),
}));

describe('AuthService', () => {
    const createConfig = () => {
        const values: Record<string, unknown> = {
            EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: 3600,
            EMAIL_VERIFICATION_RESEND_COOLDOWN_MS: 60_000,
            EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR: 3,
            AUTH_MIN_PASSWORD_LENGTH: 8,
            AUTH_MAX_LOGIN_ATTEMPTS: 3,
            AUTH_LOGIN_LOCKOUT_MINUTES: 15,
            JWT_SECRET: 'secret',
            JWT_REFRESH_EXPIRES_IN: '30d',
        };

        return {
            get: jest.fn((key: string) => values[key]),
            getOrThrow: jest.fn((key: string) => values[key]),
        };
    };

    const createRepos = () => {
        const authQb = {
            innerJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
        };

        const userRepo = {
            exists: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const authRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(authQb),
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const tokenRepo = {
            findOne: jest.fn(),
            count: jest.fn(),
        };

        return { userRepo, authRepo, tokenRepo, authQb };
    };

    const createDataSource = () => {
        const manager = {
            create: jest.fn(),
            save: jest.fn(),
        };

        return {
            manager,
            transaction: jest.fn(async (cb: (m: any) => Promise<unknown>) => cb(manager)),
        };
    };

    const createJwt = () => ({
        verify: jest.fn(),
        sign: jest.fn(),
    });

    const createEmailService = () => ({
        sendVerificationEmail: jest.fn(),
    });

    const setup = () => {
        const dataSource = createDataSource();
        const { userRepo, authRepo, tokenRepo, authQb } = createRepos();
        const jwt = createJwt();
        const emailService = createEmailService();
        const config = createConfig();

        const service = new AuthService(
            dataSource as any,
            userRepo as any,
            authRepo as any,
            tokenRepo as any,
            jwt as any,
            emailService as any,
            config as any,
        );

        return { service, dataSource, userRepo, authRepo, tokenRepo, authQb, jwt, emailService, config };
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('refreshAuth throws when token verify fails', async () => {
        const { service, jwt } = setup();
        jwt.verify.mockImplementation(() => {
            throw new Error('bad token');
        });

        await expect(service.refreshAuth('bad')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('refreshAuth throws when token type is not refresh', async () => {
        const { service, jwt } = setup();
        jwt.verify.mockReturnValue({ sub: 1, type: 'access' });

        await expect(service.refreshAuth('x')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('refreshAuth returns new auth payload for valid refresh token', async () => {
        const { service, jwt, userRepo } = setup();
        const user = { id: 3, username: 'alice', emailVerified: true };
        jwt.verify.mockReturnValue({ sub: 3, type: 'refresh' });
        userRepo.findOne.mockResolvedValue(user);
        jwt.sign
            .mockReturnValueOnce('access-token')
            .mockReturnValueOnce('refresh-token');

        await expect(service.refreshAuth('ok')).resolves.toEqual(
            expect.objectContaining({
                user,
                token: 'access-token',
                refreshToken: 'refresh-token',
                emailVerified: true,
            }),
        );
    });

    it('login throws localized too-many-attempts when currently locked', async () => {
        const { service, authQb } = setup();
        authQb.getOne.mockResolvedValue({
            password: 'hash',
            loginLockedUntil: new Date(Date.now() + 60_000),
            failedLoginAttempts: 3,
            user: { id: 1, username: 'alice' },
        });

        await expect(service.login('alice', 'password123', 'en')).rejects.toBeInstanceOf(UnauthorizedException);
        expect((argon2.verify as jest.Mock)).not.toHaveBeenCalled();
    });

    it('login increments failed attempts and locks account at threshold', async () => {
        const { service, authQb, authRepo } = setup();
        const credential = {
            password: 'stored-hash',
            loginLockedUntil: null,
            failedLoginAttempts: 2,
            user: { id: 1, username: 'alice' },
        };
        authQb.getOne.mockResolvedValue(credential);
        (argon2.verify as jest.Mock).mockResolvedValue(false);

        await expect(service.login('alice', 'wrong-password', 'en')).rejects.toBeInstanceOf(UnauthorizedException);
        expect(authRepo.save).toHaveBeenCalled();
        expect(credential.failedLoginAttempts).toBe(3);
        expect(credential.loginLockedUntil).toBeInstanceOf(Date);
    });

    it('changeMyPassword validates new password length before repo lookup', async () => {
        const { service, authRepo } = setup();

        await expect(service.changeMyPassword(1, 'oldpass123', 'short')).rejects.toBeInstanceOf(BadRequestException);
        expect(authRepo.findOne).not.toHaveBeenCalled();
    });

    it('resendVerification returns already-verified without sending email', async () => {
        const { service, userRepo, emailService } = setup();
        userRepo.findOne.mockResolvedValue({ id: 1, emailVerified: true });

        await expect(service.resendVerification(1, 'en')).resolves.toBe(EmailSendResult.ALREADY_VERIFIED);
        expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('isEmailUsed normalizes input email before exists query', async () => {
        const { service, userRepo } = setup();
        userRepo.exists.mockResolvedValue(true);

        await expect(service.isEmailUsed('  ALICE@EXAMPLE.COM  ')).resolves.toBe(true);
        expect(userRepo.exists).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } });
    });
});
