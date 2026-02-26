import { BadRequestException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Auth } from '../auth.entity';
import { User } from '../../users/user.entity';
import * as argon2 from 'argon2';
import {
    createDataSourceMock,
    createEntityManagerMock,
    createJwtServiceMock,
    createQueryBuilderMock,
} from '../../test-utils/typeorm.mocks';

jest.mock('argon2', () => ({
    hash: jest.fn(),
    verify: jest.fn(),
}));

describe('AuthService', () => {
    const username = 'deniz';
    const email = 'deniz@example.com';
    const password = 'secret123';
    const hashedPassword = '$argon2id$mocked';

    let service: AuthService;

    const authRepo = {
        createQueryBuilder: jest.fn(),
        save: jest.fn(),
    };

    const verificationTokenRepo = {
        createQueryBuilder: jest.fn(),
    };

    const dataSource = createDataSourceMock();
    const jwtService = createJwtServiceMock();
    const configService = {
        get: jest.fn(),
    };
    const verificationEmailService = {
        sendVerificationEmail: jest.fn(),
        isConfigured: jest.fn().mockReturnValue(false),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
        (argon2.verify as jest.Mock).mockResolvedValue(true);
        configService.get.mockImplementation((key: string) => {
            const defaults: Record<string, number> = {
                AUTH_MIN_PASSWORD_LENGTH: 8,
                EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: 86400,
                EMAIL_VERIFICATION_RESEND_COOLDOWN_MS: 60000,
                EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR: 5,
                EMAIL_VERIFICATION_RESEND_FREE_ATTEMPTS: 5,
            };
            return defaults[key];
        });
        verificationEmailService.isConfigured.mockReturnValue(false);
        verificationEmailService.sendVerificationEmail.mockResolvedValue(undefined);
        service = new AuthService(
            authRepo as any,
            verificationTokenRepo as any,
            dataSource as any,
            jwtService as any,
            verificationEmailService as any,
            configService as any,
        );
    });

    describe('signUp', () => {
        it('creates user and auth record when username/email is available', async () => {
            const existingUserRepo = {
                findOne: jest
                    .fn<Promise<User | null>, [any]>()
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null),
            };
            dataSource.getRepository.mockReturnValue(existingUserRepo);

            const manager = createEntityManagerMock();
            const createdUser: Partial<User> = { id: 1, username, displayName: username, email, emailVerified: false };
            const createdUserPayload = { username, displayName: username, email, emailVerified: false };

            manager.create
                .mockImplementationOnce((_entity, payload) => payload)
                .mockImplementationOnce((_entity, payload) => payload)
                .mockImplementationOnce((_entity, payload) => payload);
            manager.save
                .mockResolvedValueOnce(createdUser)
                .mockResolvedValueOnce({ id: 10, password, user: createdUser } as Auth)
                .mockResolvedValueOnce({ id: 99, type: 'email_verification', user: createdUser } as any);

            dataSource.transaction.mockImplementation(async (callback: any) => callback(manager));
            jwtService.sign.mockReturnValue('jwt-token');

            const result = await service.signUp(username, email, password);

            expect(existingUserRepo.findOne).toHaveBeenNthCalledWith(1, { where: { username } });
            expect(existingUserRepo.findOne).toHaveBeenNthCalledWith(2, { where: { email } });
            expect(manager.create).toHaveBeenNthCalledWith(1, User, {
                username,
                displayName: username,
                email,
                emailVerified: false,
            });
            expect(manager.create).toHaveBeenNthCalledWith(2, Auth, {
                password: hashedPassword,
                user: {
                    username,
                    displayName: username,
                    email,
                    emailVerified: false,
                },
            });
            expect(manager.create).toHaveBeenNthCalledWith(
                3,
                expect.anything(),
                expect.objectContaining({ type: 'email_verification' }),
            );
            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ username }),
            );
            expect(verificationEmailService.sendVerificationEmail).toHaveBeenCalledWith(
                email,
                expect.any(String),
                username,
            );
            expect(result).toEqual(expect.objectContaining({ user: createdUserPayload, token: 'jwt-token', emailVerified: false }));
        });

        it('omits raw verification token when SMTP delivery is configured', async () => {
            verificationEmailService.isConfigured.mockReturnValue(true);

            const existingUserRepo = {
                findOne: jest
                    .fn<Promise<User | null>, [any]>()
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null),
            };
            dataSource.getRepository.mockReturnValue(existingUserRepo);

            const manager = createEntityManagerMock();
            const createdUser: Partial<User> = { id: 1, username, displayName: username, email, emailVerified: false };

            manager.create
                .mockImplementationOnce((_entity, payload) => payload)
                .mockImplementationOnce((_entity, payload) => payload)
                .mockImplementationOnce((_entity, payload) => payload);
            manager.save
                .mockResolvedValueOnce(createdUser)
                .mockResolvedValueOnce({ id: 10, password, user: createdUser } as Auth)
                .mockResolvedValueOnce({ id: 99, type: 'email_verification', user: createdUser } as any);

            dataSource.transaction.mockImplementation(async (callback: any) => callback(manager));
            jwtService.sign.mockReturnValue('jwt-token');

            const result = await service.signUp(username, email, password);

            expect(verificationEmailService.sendVerificationEmail).toHaveBeenCalled();
            expect(result).toEqual(expect.objectContaining({ token: 'jwt-token', emailVerified: false }));
            expect(result).not.toHaveProperty('verificationToken');
        });

        it('returns signup payload even when verification email delivery fails', async () => {
            const existingUserRepo = {
                findOne: jest
                    .fn<Promise<User | null>, [any]>()
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null),
            };
            dataSource.getRepository.mockReturnValue(existingUserRepo);

            const manager = createEntityManagerMock();
            const createdUser: Partial<User> = { id: 1, username, displayName: username, email, emailVerified: false };

            manager.create
                .mockImplementationOnce((_entity, payload) => payload)
                .mockImplementationOnce((_entity, payload) => payload)
                .mockImplementationOnce((_entity, payload) => payload);
            manager.save
                .mockResolvedValueOnce(createdUser)
                .mockResolvedValueOnce({ id: 10, password, user: createdUser } as Auth)
                .mockResolvedValueOnce({ id: 99, type: 'email_verification', user: createdUser } as any);

            dataSource.transaction.mockImplementation(async (callback: any) => callback(manager));
            jwtService.sign.mockReturnValue('jwt-token');
            verificationEmailService.sendVerificationEmail.mockRejectedValueOnce(new Error('smtp down'));

            await expect(service.signUp(username, email, password)).resolves.toEqual(
                expect.objectContaining({ token: 'jwt-token', emailVerified: false }),
            );
        });

        it('throws BadRequestException when password is too short', async () => {
            await expect(service.signUp(username, email, 'short')).rejects.toBeInstanceOf(BadRequestException);
            expect(dataSource.transaction).not.toHaveBeenCalled();
        });

        it('throws BadRequestException when email is invalid', async () => {
            await expect(service.signUp(username, 'invalid-email', password)).rejects.toBeInstanceOf(BadRequestException);
            expect(dataSource.transaction).not.toHaveBeenCalled();
        });

        it('throws BadRequestException when username already exists', async () => {
            const existingUser = { id: 2, username } as User;
            const existingUserRepo = {
                findOne: jest.fn<Promise<User | null>, [any]>().mockResolvedValue(existingUser),
            };

            dataSource.getRepository.mockReturnValue(existingUserRepo);

            await expect(service.signUp(username, email, password)).rejects.toBeInstanceOf(BadRequestException);
            expect(dataSource.transaction).not.toHaveBeenCalled();
            expect(jwtService.sign).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('returns user and token for verified credentials', async () => {
            const user = { id: 3, username, emailVerified: true } as User;
            const qb = createQueryBuilderMock<Auth>({
                id: 99,
                password: hashedPassword,
                user,
            } as Auth);

            authRepo.createQueryBuilder.mockReturnValue(qb);
            jwtService.sign.mockReturnValue('jwt-token');

            const result = await service.login(username, password);

            expect(authRepo.createQueryBuilder).toHaveBeenCalledWith('auth');
            expect(qb.innerJoinAndSelect).toHaveBeenCalledWith('auth.user', 'user');
            expect(qb.where).toHaveBeenCalledWith('user.username = :identifier OR LOWER(user.email) = LOWER(:identifier)', { identifier: username });
            expect(jwtService.sign).toHaveBeenCalledWith({ sub: 3, username });
            expect(result).toEqual({ user, token: 'jwt-token', emailVerified: true });
        });

        it('returns user and token when credentials are valid but email is not verified', async () => {
            const user = { id: 8, username, emailVerified: false } as User;
            const qb = createQueryBuilderMock<Auth>({
                id: 108,
                password: hashedPassword,
                user,
            } as Auth);

            authRepo.createQueryBuilder.mockReturnValue(qb);
            jwtService.sign.mockReturnValue('jwt-token');

            await expect(service.login(username, password)).resolves.toEqual({
                user,
                token: 'jwt-token',
                emailVerified: false,
            });
        });

        it('throws UnauthorizedException when credential does not exist', async () => {
            const qb = createQueryBuilderMock<Auth>(null);
            authRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.login(username, password)).rejects.toBeInstanceOf(UnauthorizedException);
            expect(jwtService.sign).not.toHaveBeenCalled();
        });

        it('throws UnauthorizedException when password does not match', async () => {
            const user = { id: 4, username, emailVerified: true } as User;
            const qb = createQueryBuilderMock<Auth>({
                id: 100,
                password: '$argon2id$bad-hash',
                user,
            } as Auth);

            (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

            authRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.login(username, password)).rejects.toBeInstanceOf(UnauthorizedException);
            expect(jwtService.sign).not.toHaveBeenCalled();
        });

        it('rejects legacy plaintext credentials even when password matches', async () => {
            const user = { id: 5, username, emailVerified: true } as User;
            const credential = {
                id: 101,
                password,
                user,
            } as Auth;
            const qb = createQueryBuilderMock<Auth>(credential);

            authRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.login(username, password)).rejects.toBeInstanceOf(UnauthorizedException);
            expect(jwtService.sign).not.toHaveBeenCalled();
            expect(authRepo.save).not.toHaveBeenCalled();
        });

        it('throws BadRequestException when login password is too short', async () => {
            await expect(service.login(username, 'short')).rejects.toBeInstanceOf(BadRequestException);
            expect(authRepo.createQueryBuilder).not.toHaveBeenCalled();
        });
    });

    describe('verifyEmail', () => {
        it('verifies token and updates user', async () => {
            const tokenRecord = {
                id: 1,
                type: 'email_verification',
                tokenHash: 'hash',
                expiresAt: new Date(Date.now() + 60_000),
                consumedAt: null,
                user: { id: 1, username, emailVerified: false },
            };

            const qb = createQueryBuilderMock<any>(tokenRecord);
            verificationTokenRepo.createQueryBuilder.mockReturnValue(qb);
            dataSource.transaction.mockImplementation(async (callback: any) => callback({ save: jest.fn().mockResolvedValue(undefined) }));

            await expect(service.verifyEmail('token123')).resolves.toBe(true);
        });

        it('returns specific error for missing token record', async () => {
            const qb = createQueryBuilderMock<any>(null);
            verificationTokenRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.verifyEmail('missing-token')).rejects.toThrow(
                'Verification token is invalid',
            );
        });

        it('returns specific error for consumed token', async () => {
            const tokenRecord = {
                id: 2,
                type: 'email_verification',
                tokenHash: 'hash',
                expiresAt: new Date(Date.now() + 60_000),
                consumedAt: new Date(),
                user: { id: 2, username, emailVerified: false },
            };

            const qb = createQueryBuilderMock<any>(tokenRecord);
            verificationTokenRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.verifyEmail('used-token')).rejects.toThrow(
                'Verification token has already been used',
            );
        });

        it('returns specific error for expired token', async () => {
            const tokenRecord = {
                id: 3,
                type: 'email_verification',
                tokenHash: 'hash',
                expiresAt: new Date(Date.now() - 60_000),
                consumedAt: null,
                user: { id: 3, username, emailVerified: false },
            };

            const qb = createQueryBuilderMock<any>(tokenRecord);
            verificationTokenRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.verifyEmail('expired-token')).rejects.toThrow(
                'Verification token has expired',
            );
        });
    });

    describe('resendMyVerificationEmail', () => {
        it('throws UnauthorizedException when user is missing', async () => {
            const userRepo = {
                findOne: jest.fn<Promise<User | null>, [any]>().mockResolvedValue(null),
            };
            dataSource.getRepository.mockReturnValue(userRepo);

            await expect(service.resendMyVerificationEmail(77)).rejects.toBeInstanceOf(UnauthorizedException);
        });

        it('returns true without sending when user email is already verified', async () => {
            const verifiedUser = { id: 10, username, email, emailVerified: true } as User;
            const userRepo = {
                findOne: jest.fn<Promise<User | null>, [any]>().mockResolvedValue(verifiedUser),
            };
            dataSource.getRepository.mockReturnValue(userRepo);

            await expect(service.resendMyVerificationEmail(verifiedUser.id)).resolves.toBe(true);
            expect(verificationEmailService.sendVerificationEmail).not.toHaveBeenCalled();
            expect(dataSource.transaction).not.toHaveBeenCalled();
        });

        it('applies cooldown throttle and returns clear throttling error after free resend window', async () => {
            const unverifiedUser = { id: 12, username, email, emailVerified: false } as User;
            const userRepo = {
                findOne: jest.fn<Promise<User | null>, [any]>().mockResolvedValue(unverifiedUser),
            };
            dataSource.getRepository.mockReturnValue(userRepo);

            const latestTokenQb = createQueryBuilderMock<any>({ createdAt: new Date() } as any);
            const sentLastHourQb = createQueryBuilderMock<any>(null as any);
            sentLastHourQb.getCount.mockResolvedValue(6);

            verificationTokenRepo.createQueryBuilder
                .mockReturnValueOnce(latestTokenQb)
                .mockReturnValueOnce(sentLastHourQb);

            await expect(service.resendMyVerificationEmail(unverifiedUser.id)).rejects.toMatchObject({
                status: HttpStatus.TOO_MANY_REQUESTS,
            });
            expect(verificationEmailService.sendVerificationEmail).not.toHaveBeenCalled();
            expect(dataSource.transaction).not.toHaveBeenCalled();
        });

        it('applies hourly max throttle and returns clear throttling error when limit is reached', async () => {
            const unverifiedUser = { id: 13, username, email, emailVerified: false } as User;
            const userRepo = {
                findOne: jest.fn<Promise<User | null>, [any]>().mockResolvedValue(unverifiedUser),
            };
            dataSource.getRepository.mockReturnValue(userRepo);

            const latestTokenQb = createQueryBuilderMock<any>({ createdAt: new Date(Date.now() - 61_000) } as any);
            const sentLastHourQb = createQueryBuilderMock<any>(null as any);
            sentLastHourQb.getCount.mockResolvedValue(7);

            verificationTokenRepo.createQueryBuilder
                .mockReturnValueOnce(latestTokenQb)
                .mockReturnValueOnce(sentLastHourQb);

            await expect(service.resendMyVerificationEmail(unverifiedUser.id)).rejects.toMatchObject({
                status: HttpStatus.TOO_MANY_REQUESTS,
            });
            expect(verificationEmailService.sendVerificationEmail).not.toHaveBeenCalled();
            expect(dataSource.transaction).not.toHaveBeenCalled();
        });

        it('bypasses throttle checks for first free resend attempts', async () => {
            const unverifiedUser = { id: 14, username, email, emailVerified: false } as User;
            const userRepo = {
                findOne: jest.fn<Promise<User | null>, [any]>().mockResolvedValue(unverifiedUser),
            };
            dataSource.getRepository.mockReturnValue(userRepo);

            const latestTokenQb = createQueryBuilderMock<any>({ createdAt: new Date() } as any);
            const sentLastHourQb = createQueryBuilderMock<any>(null as any);
            sentLastHourQb.getCount.mockResolvedValue(3);

            verificationTokenRepo.createQueryBuilder
                .mockReturnValueOnce(latestTokenQb)
                .mockReturnValueOnce(sentLastHourQb);

            const manager = {
                createQueryBuilder: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                }),
                create: jest.fn().mockImplementation((_entity, payload) => payload),
                save: jest.fn().mockResolvedValue(undefined),
            };
            dataSource.transaction.mockImplementation(async (callback: any) => callback(manager));

            await expect(service.resendMyVerificationEmail(unverifiedUser.id)).resolves.toBe(true);
            expect(verificationEmailService.sendVerificationEmail).toHaveBeenCalled();
        });

        it('rotates old tokens and sends new verification email for unverified user', async () => {
            const unverifiedUser = { id: 11, username, email, emailVerified: false } as User;
            const userRepo = {
                findOne: jest.fn<Promise<User | null>, [any]>().mockResolvedValue(unverifiedUser),
            };
            dataSource.getRepository.mockReturnValue(userRepo);

            const latestTokenQb = createQueryBuilderMock<any>({ createdAt: new Date(Date.now() - 61_000) } as any);
            latestTokenQb.getCount.mockResolvedValue(0);
            verificationTokenRepo.createQueryBuilder.mockReturnValue(latestTokenQb);

            const oldToken = {
                id: 51,
                tokenHash: 'old-hash',
                type: 'email_verification',
                user: unverifiedUser,
                expiresAt: new Date(Date.now() + 60_000),
                consumedAt: null,
            };

            const manager = {
                createQueryBuilder: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([oldToken]),
                }),
                create: jest.fn().mockImplementation((_entity, payload) => payload),
                save: jest.fn().mockResolvedValue(undefined),
            };
            dataSource.transaction.mockImplementation(async (callback: any) => callback(manager));

            await expect(service.resendMyVerificationEmail(unverifiedUser.id)).resolves.toBe(true);
            expect(verificationEmailService.sendVerificationEmail).toHaveBeenCalledWith(
                email,
                expect.any(String),
                username,
            );
        });

        it('returns service unavailable when resend delivery fails and rolls back token mutation', async () => {
            const unverifiedUser = { id: 15, username, email, emailVerified: false } as User;
            const userRepo = {
                findOne: jest.fn<Promise<User | null>, [any]>().mockResolvedValue(unverifiedUser),
            };
            dataSource.getRepository.mockReturnValue(userRepo);

            const latestTokenQb = createQueryBuilderMock<any>({ createdAt: new Date(Date.now() - 61_000) } as any);
            const sentLastHourQb = createQueryBuilderMock<any>(null as any);
            sentLastHourQb.getCount.mockResolvedValue(0);
            verificationTokenRepo.createQueryBuilder
                .mockReturnValueOnce(latestTokenQb)
                .mockReturnValueOnce(sentLastHourQb);

            const issueManager = {
                createQueryBuilder: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([{ id: 77, consumedAt: null }]),
                }),
                create: jest.fn().mockImplementation((_entity, payload) => payload),
                save: jest
                    .fn()
                    .mockResolvedValueOnce(undefined)
                    .mockResolvedValueOnce({ id: 123 }),
            };

            const rollbackUpdateExecute = jest.fn().mockResolvedValue(undefined);
            const rollbackWhereInIds = jest.fn().mockReturnValue({
                execute: rollbackUpdateExecute,
            });
            const rollbackSet = jest.fn().mockReturnValue({
                whereInIds: rollbackWhereInIds,
            });
            const rollbackUpdate = jest.fn().mockReturnValue({
                set: rollbackSet,
            });
            const rollbackManager = {
                delete: jest.fn().mockResolvedValue(undefined),
                createQueryBuilder: jest.fn().mockReturnValue({
                    update: rollbackUpdate,
                }),
            };

            dataSource.transaction
                .mockImplementationOnce(async (callback: any) => callback(issueManager))
                .mockImplementationOnce(async (callback: any) => callback(rollbackManager));

            verificationEmailService.sendVerificationEmail.mockRejectedValueOnce(new Error('smtp down'));

            await expect(service.resendMyVerificationEmail(unverifiedUser.id)).rejects.toMatchObject({
                status: HttpStatus.SERVICE_UNAVAILABLE,
            });

            expect(rollbackManager.delete).toHaveBeenCalledWith(expect.anything(), { id: 123 });
            expect(rollbackUpdate).toHaveBeenCalledWith(expect.anything());
            expect(rollbackSet).toHaveBeenCalledWith({ consumedAt: expect.any(Function) });
            expect(rollbackWhereInIds).toHaveBeenCalledWith([77]);
            expect(rollbackUpdateExecute).toHaveBeenCalled();
        });
    });

    describe('processVerificationLink', () => {
        it('returns verified and marks token consumed when token is valid', async () => {
            const tokenRecord = {
                id: 61,
                type: 'email_verification',
                tokenHash: 'hash',
                expiresAt: new Date(Date.now() + 60_000),
                consumedAt: null,
                user: { id: 90, username, email, emailVerified: false },
            };

            const verificationQb = createQueryBuilderMock<any>(tokenRecord);
            verificationTokenRepo.createQueryBuilder.mockReturnValue(verificationQb);
            dataSource.transaction.mockImplementation(async (callback: any) => callback({ save: jest.fn().mockResolvedValue(undefined) }));

            await expect(service.processVerificationLink('valid-token')).resolves.toEqual({ status: 'verified' });
        });

        it('returns expired_resent and sends new token when expired and throttle allows', async () => {
            const user = { id: 42, username, email, emailVerified: false } as User;
            const expiredToken = {
                id: 62,
                type: 'email_verification',
                tokenHash: 'hash',
                expiresAt: new Date(Date.now() - 60_000),
                consumedAt: null,
                user,
            };

            const verificationQb = createQueryBuilderMock<any>(expiredToken);
            const latestTokenQb = createQueryBuilderMock<any>({ createdAt: new Date(Date.now() - 61_000) } as any);
            const sentLastHourQb = createQueryBuilderMock<any>(null as any);
            sentLastHourQb.getCount.mockResolvedValue(0);

            verificationTokenRepo.createQueryBuilder
                .mockReturnValueOnce(verificationQb)
                .mockReturnValueOnce(latestTokenQb)
                .mockReturnValueOnce(sentLastHourQb);

            const manager = {
                createQueryBuilder: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                }),
                create: jest.fn().mockImplementation((_entity, payload) => payload),
                save: jest.fn().mockResolvedValue(undefined),
            };
            dataSource.transaction.mockImplementation(async (callback: any) => callback(manager));

            await expect(service.processVerificationLink('expired-token')).resolves.toEqual({ status: 'expired_resent' });
            expect(verificationEmailService.sendVerificationEmail).toHaveBeenCalledWith(
                email,
                expect.any(String),
                username,
            );
        });

        it('returns expired_throttled when expired and resend is throttled', async () => {
            configService.get.mockImplementation((key: string) => {
                const defaults: Record<string, number> = {
                    EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: 86400,
                    EMAIL_VERIFICATION_RESEND_COOLDOWN_MS: 60000,
                    EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR: 5,
                    EMAIL_VERIFICATION_RESEND_FREE_ATTEMPTS: 0,
                };
                return defaults[key];
            });

            const user = { id: 43, username, email, emailVerified: false } as User;
            const expiredToken = {
                id: 63,
                type: 'email_verification',
                tokenHash: 'hash',
                expiresAt: new Date(Date.now() - 60_000),
                consumedAt: null,
                user,
            };

            const verificationQb = createQueryBuilderMock<any>(expiredToken);
            const latestTokenQb = createQueryBuilderMock<any>({ createdAt: new Date() } as any);
            const sentLastHourQb = createQueryBuilderMock<any>(null as any);
            sentLastHourQb.getCount.mockResolvedValue(1);

            verificationTokenRepo.createQueryBuilder
                .mockReturnValueOnce(verificationQb)
                .mockReturnValueOnce(latestTokenQb)
                .mockReturnValueOnce(sentLastHourQb);

            await expect(service.processVerificationLink('expired-throttled-token')).resolves.toEqual({ status: 'expired_throttled' });
            expect(verificationEmailService.sendVerificationEmail).not.toHaveBeenCalled();
        });

        it('returns expired_delivery_failed when expired and resend delivery fails', async () => {
            const user = { id: 44, username, email, emailVerified: false } as User;
            const expiredToken = {
                id: 64,
                type: 'email_verification',
                tokenHash: 'hash',
                expiresAt: new Date(Date.now() - 60_000),
                consumedAt: null,
                user,
            };

            const verificationQb = createQueryBuilderMock<any>(expiredToken);
            const latestTokenQb = createQueryBuilderMock<any>({ createdAt: new Date(Date.now() - 61_000) } as any);
            const sentLastHourQb = createQueryBuilderMock<any>(null as any);
            sentLastHourQb.getCount.mockResolvedValue(0);

            verificationTokenRepo.createQueryBuilder
                .mockReturnValueOnce(verificationQb)
                .mockReturnValueOnce(latestTokenQb)
                .mockReturnValueOnce(sentLastHourQb);

            const issueManager = {
                createQueryBuilder: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]),
                }),
                create: jest.fn().mockImplementation((_entity, payload) => payload),
                save: jest.fn().mockResolvedValueOnce({ id: 124 }),
            };

            const rollbackManager = {
                delete: jest.fn().mockResolvedValue(undefined),
                createQueryBuilder: jest.fn().mockReturnValue({
                    update: jest.fn().mockReturnValue({
                        set: jest.fn().mockReturnValue({
                            whereInIds: jest.fn().mockReturnValue({
                                execute: jest.fn().mockResolvedValue(undefined),
                            }),
                        }),
                    }),
                }),
            };

            dataSource.transaction
                .mockImplementationOnce(async (callback: any) => callback(issueManager))
                .mockImplementationOnce(async (callback: any) => callback(rollbackManager));

            verificationEmailService.sendVerificationEmail.mockRejectedValueOnce(new Error('smtp down'));

            await expect(service.processVerificationLink('expired-delivery-failed-token')).resolves.toEqual({ status: 'expired_delivery_failed' });
        });
    });
});
