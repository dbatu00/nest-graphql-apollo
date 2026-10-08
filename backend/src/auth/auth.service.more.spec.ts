import { BadRequestException, HttpException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

import { AuthService } from './auth.service';
import { EmailSendResult } from './verification/verification-email-send-result.enum';

jest.mock('argon2', () => ({
    verify: jest.fn(),
    hash: jest.fn(),
}));

describe('AuthService additional branches', () => {
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

    const createDataSource = () => {
        const likeDelete = jest.fn().mockResolvedValue(undefined);

        const manager = {
            save: jest.fn(),
            delete: jest.fn().mockResolvedValue(undefined),
            getRepository: jest.fn((entity: any) => {
                const name = entity?.name;

                if (name === 'Like') {
                    return { delete: likeDelete };
                }

                return {
                    createQueryBuilder: jest.fn((alias: string) => {
                        const getRawMany = jest.fn();
                        if (alias === 'post') {
                            getRawMany.mockResolvedValue([{ id: 11 }, { id: 12 }]);
                        } else {
                            getRawMany.mockResolvedValue([{ id: 21 }]);
                        }

                        return {
                            select: jest.fn().mockReturnThis(),
                            where: jest.fn().mockReturnThis(),
                            getRawMany,
                        };
                    }),
                };
            }),
        };

        return {
            manager,
            likeDelete,
            transaction: jest.fn(async (cb: (m: any) => Promise<unknown>) => cb(manager)),
        };
    };

    const setup = () => {
        const dataSource = createDataSource();
        const userRepo = {
            exists: jest.fn(),
            findOne: jest.fn(),
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

        const service = new AuthService(
            dataSource as any,
            userRepo as any,
            authRepo as any,
            tokenRepo as any,
            jwt as any,
            emailService as any,
            config as any,
        );

        return { service, dataSource, userRepo, authRepo, tokenRepo, jwt, emailService };
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('resendVerification throws BadRequest when user does not exist', async () => {
        const { service, userRepo } = setup();
        userRepo.findOne.mockResolvedValue(null);

        await expect(service.resendVerification(99, 'en')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('changeMyEmail is throttled before password verification', async () => {
        const { service, authRepo } = setup();
        authRepo.findOne.mockResolvedValue({
            password: 'stored-hash',
            user: { id: 5, email: 'old@example.com', emailVerified: true },
        });

        jest.spyOn(service as any, 'isThrottled').mockResolvedValue(true);

        await expect(
            service.changeMyEmail(5, 'new@example.com', 'wrong-password', 'en'),
        ).rejects.toBeInstanceOf(HttpException);

        expect((argon2.verify as jest.Mock)).not.toHaveBeenCalled();
    });

    it('changeMyEmail throws Unauthorized when password is invalid', async () => {
        const { service, authRepo } = setup();
        authRepo.findOne.mockResolvedValue({
            password: 'stored-hash',
            user: { id: 5, email: 'old@example.com', emailVerified: true },
        });

        jest.spyOn(service as any, 'isThrottled').mockResolvedValue(false);
        (argon2.verify as jest.Mock).mockResolvedValue(false);

        await expect(
            service.changeMyEmail(5, 'new@example.com', 'wrong-password', 'en'),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('changeMyEmail still returns true when verification email send fails', async () => {
        const { service, authRepo, userRepo } = setup();
        const user = { id: 5, email: 'old@example.com', emailVerified: true };
        authRepo.findOne.mockResolvedValue({ password: 'stored-hash', user });

        jest.spyOn(service as any, 'isThrottled').mockResolvedValue(false);
        jest.spyOn(service as any, 'issueVerificationTokenAndSendEmail').mockResolvedValue(EmailSendResult.FAILED);
        (argon2.verify as jest.Mock).mockResolvedValue(true);
        userRepo.save.mockResolvedValue({ ...user, email: 'new@example.com', emailVerified: false });

        await expect(
            service.changeMyEmail(5, 'New@Example.com', 'password123', 'en'),
        ).resolves.toBe(true);

        expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            email: 'new@example.com',
            emailVerified: false,
        }));
    });

    it('deleteMyAccount throws Unauthorized when auth record is missing', async () => {
        const { service, authRepo } = setup();
        authRepo.findOne.mockResolvedValue(null);

        await expect(service.deleteMyAccount(3, 'password123')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('deleteMyAccount throws Unauthorized for wrong password', async () => {
        const { service, authRepo } = setup();
        authRepo.findOne.mockResolvedValue({ password: 'stored-hash', user: { id: 3 } });
        (argon2.verify as jest.Mock).mockResolvedValue(false);

        await expect(service.deleteMyAccount(3, 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('deleteMyAccount removes likes for owned posts/comments and deletes user', async () => {
        const { service, authRepo, dataSource } = setup();
        authRepo.findOne.mockResolvedValue({ password: 'stored-hash', user: { id: 3 } });
        (argon2.verify as jest.Mock).mockResolvedValue(true);

        await expect(service.deleteMyAccount(3, 'password123')).resolves.toBe(true);

        expect(dataSource.likeDelete).toHaveBeenCalledTimes(2);
        expect(dataSource.manager.delete).toHaveBeenCalledWith(expect.anything(), { id: 3 });
    });
});
