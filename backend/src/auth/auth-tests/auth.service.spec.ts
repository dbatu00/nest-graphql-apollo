import { BadRequestException, UnauthorizedException } from '@nestjs/common';
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
    const verificationEmailService = {
        sendVerificationEmail: jest.fn(),
        isConfigured: jest.fn().mockReturnValue(false),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
        (argon2.verify as jest.Mock).mockResolvedValue(true);
        verificationEmailService.isConfigured.mockReturnValue(false);
        verificationEmailService.sendVerificationEmail.mockResolvedValue(undefined);
        service = new AuthService(
            authRepo as any,
            verificationTokenRepo as any,
            dataSource as any,
            jwtService as any,
            verificationEmailService as any,
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
            expect(result.verificationToken).toEqual(expect.any(String));
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
            expect(result.verificationToken).toBeUndefined();
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

        it('throws UnauthorizedException when user email is not verified', async () => {
            const user = { id: 8, username, emailVerified: false } as User;
            const qb = createQueryBuilderMock<Auth>({
                id: 108,
                password: hashedPassword,
                user,
            } as Auth);

            authRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.login(username, password)).rejects.toBeInstanceOf(UnauthorizedException);
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

        it('returns standardized error for missing token record', async () => {
            const qb = createQueryBuilderMock<any>(null);
            verificationTokenRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.verifyEmail('missing-token')).rejects.toThrow(
                'Invalid, expired, or already-used verification token',
            );
        });

        it('returns standardized error for consumed token', async () => {
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
                'Invalid, expired, or already-used verification token',
            );
        });

        it('returns standardized error for expired token', async () => {
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
                'Invalid, expired, or already-used verification token',
            );
        });
    });
});
