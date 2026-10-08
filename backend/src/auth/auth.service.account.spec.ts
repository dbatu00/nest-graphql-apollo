import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
    verify: jest.fn(),
    hash: jest.fn(),
}));

describe('AuthService account/email flows', () => {
    const createConfig = (overrides: Record<string, unknown> = {}) => {
        const defaults: Record<string, unknown> = {
            EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: 3600,
            EMAIL_VERIFICATION_RESEND_COOLDOWN_MS: 60_000,
            EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR: 3,
            AUTH_MIN_PASSWORD_LENGTH: 8,
            AUTH_MAX_LOGIN_ATTEMPTS: 3,
            AUTH_LOGIN_LOCKOUT_MINUTES: 15,
            JWT_SECRET: 'secret',
            JWT_REFRESH_EXPIRES_IN: '30d',
        };

        const values = { ...defaults, ...overrides };

        return {
            get: jest.fn((key: string) => values[key]),
            getOrThrow: jest.fn((key: string) => values[key]),
        };
    };

    const setup = (configOverrides: Record<string, unknown> = {}) => {
        const manager = {
            create: jest.fn(),
            save: jest.fn(),
            getRepository: jest.fn(),
            delete: jest.fn(),
        };

        const dataSource = {
            manager,
            transaction: jest.fn(async (cb: (m: any) => Promise<unknown>) => cb(manager)),
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

        const config = createConfig(configOverrides);

        const service = new AuthService(
            dataSource as any,
            userRepo as any,
            authRepo as any,
            tokenRepo as any,
            jwt as any,
            emailService as any,
            config as any,
        );

        return { service, dataSource, manager, userRepo, authRepo, tokenRepo, jwt, emailService };
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('changeMyEmail checks throttle before password verification', async () => {
        const { service, authRepo, tokenRepo } = setup({
            EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR: 1,
        });

        authRepo.findOne.mockResolvedValue({
            password: 'stored-hash',
            user: { id: 7, email: 'old@example.com', emailVerified: true },
        });
        tokenRepo.count.mockResolvedValue(1);
        tokenRepo.findOne.mockResolvedValue(null);

        await expect(
            service.changeMyEmail(7, 'new@example.com', 'password123', 'en'),
        ).rejects.toThrow('Too many verification emails sent');

        expect(argon2.verify).not.toHaveBeenCalled();
    });

    it('changeMyEmail throws UnauthorizedException when password is invalid', async () => {
        const { service, authRepo, tokenRepo } = setup();

        authRepo.findOne.mockResolvedValue({
            password: 'stored-hash',
            user: { id: 7, email: 'old@example.com', emailVerified: true },
        });
        tokenRepo.count.mockResolvedValue(0);
        tokenRepo.findOne.mockResolvedValue(null);
        (argon2.verify as jest.Mock).mockResolvedValue(false);

        await expect(
            service.changeMyEmail(7, 'new@example.com', 'wrong-password', 'en'),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('changeMyEmail normalizes email, marks unverified, and triggers verification issue', async () => {
        const { service, authRepo, tokenRepo, userRepo } = setup();

        const auth = {
            password: 'stored-hash',
            user: { id: 7, email: 'old@example.com', emailVerified: true },
        };

        authRepo.findOne.mockResolvedValue(auth);
        tokenRepo.count.mockResolvedValue(0);
        tokenRepo.findOne.mockResolvedValue(null);
        (argon2.verify as jest.Mock).mockResolvedValue(true);
        userRepo.save.mockResolvedValue(auth.user);
        jest.spyOn(service as any, 'issueVerificationTokenAndSendEmail').mockResolvedValue('sent');

        await expect(
            service.changeMyEmail(7, '  NEW@Example.COM  ', 'password123', 'tr'),
        ).resolves.toBe(true);

        expect(auth.user.email).toBe('new@example.com');
        expect(auth.user.emailVerified).toBe(false);
        expect(userRepo.save).toHaveBeenCalledWith(auth.user);
        expect((service as any).issueVerificationTokenAndSendEmail).toHaveBeenCalledWith(auth.user, 'tr');
    });

    it('deleteMyAccount throws UnauthorizedException when password is invalid', async () => {
        const { service, authRepo } = setup();
        authRepo.findOne.mockResolvedValue({ password: 'stored-hash' });
        (argon2.verify as jest.Mock).mockResolvedValue(false);

        await expect(service.deleteMyAccount(9, 'bad-password')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('deleteMyAccount deletes likes for owned posts/comments then deletes user', async () => {
        const { service, authRepo, manager } = setup();
        authRepo.findOne.mockResolvedValue({ password: 'stored-hash' });
        (argon2.verify as jest.Mock).mockResolvedValue(true);

        const postQb = {
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([{ id: 11 }, { id: 12 }]),
        };

        const commentQb = {
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([{ id: 21 }]),
        };

        const likeRepo = {
            delete: jest.fn().mockResolvedValue(undefined),
        };

        manager.getRepository.mockImplementation((entity: any) => {
            const name = entity?.name;
            if (name === 'Post') {
                return { createQueryBuilder: jest.fn().mockReturnValue(postQb) };
            }
            if (name === 'Comment') {
                return { createQueryBuilder: jest.fn().mockReturnValue(commentQb) };
            }
            if (name === 'Like') {
                return likeRepo;
            }
            return {};
        });

        await expect(service.deleteMyAccount(9, 'password123')).resolves.toBe(true);

        expect(likeRepo.delete).toHaveBeenCalledTimes(2);
        expect(manager.delete).toHaveBeenCalledWith(expect.anything(), { id: 9 });
    });
});
