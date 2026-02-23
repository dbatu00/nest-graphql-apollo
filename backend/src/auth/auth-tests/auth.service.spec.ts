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
    const password = 'secret123';
    const hashedPassword = '$argon2id$mocked';

    let service: AuthService;

    const authRepo = {
        createQueryBuilder: jest.fn(),
        save: jest.fn(),
    };

    const dataSource = createDataSourceMock();
    const jwtService = createJwtServiceMock();

    beforeEach(() => {
        jest.clearAllMocks();
        (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
        (argon2.verify as jest.Mock).mockResolvedValue(true);
        service = new AuthService(authRepo as any, dataSource as any, jwtService as any);
    });

    describe('signUp', () => {
        it('creates user and auth record when username is available', async () => {
            const existingUserRepo = {
                findOne: jest.fn<Promise<User | null>, [any]>().mockResolvedValue(null),
            };
            dataSource.getRepository.mockReturnValue(existingUserRepo);

            const manager = createEntityManagerMock();
            const createdUser: Partial<User> = { id: 1, username, displayName: username };
            const createdUserPayload = { username, displayName: username };

            manager.create
                .mockImplementationOnce((_entity, payload) => payload)
                .mockImplementationOnce((_entity, payload) => payload);
            manager.save
                .mockResolvedValueOnce(createdUser)
                .mockResolvedValueOnce({ id: 10, password, user: createdUser } as Auth);

            dataSource.transaction.mockImplementation(async (callback: any) => callback(manager));
            jwtService.sign.mockReturnValue('jwt-token');

            const result = await service.signUp(username, password);

            expect(existingUserRepo.findOne).toHaveBeenCalledWith({ where: { username } });
            expect(manager.create).toHaveBeenNthCalledWith(1, User, {
                username,
                displayName: username,
            });
            expect(manager.create).toHaveBeenNthCalledWith(2, Auth, {
                password: hashedPassword,
                user: {
                    username,
                    displayName: username,
                },
            });
            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ username }),
            );
            expect(result).toEqual({ user: createdUserPayload, token: 'jwt-token' });
        });

        it('throws BadRequestException when password is too short', async () => {
            await expect(service.signUp(username, 'short')).rejects.toBeInstanceOf(BadRequestException);
            expect(dataSource.transaction).not.toHaveBeenCalled();
        });

        it('throws BadRequestException when username already exists', async () => {
            const existingUser = { id: 2, username } as User;
            const existingUserRepo = {
                findOne: jest.fn<Promise<User | null>, [any]>().mockResolvedValue(existingUser),
            };

            dataSource.getRepository.mockReturnValue(existingUserRepo);

            await expect(service.signUp(username, password)).rejects.toBeInstanceOf(BadRequestException);
            expect(dataSource.transaction).not.toHaveBeenCalled();
            expect(jwtService.sign).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('returns user and token for valid credentials', async () => {
            const user = { id: 3, username } as User;
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
            expect(qb.where).toHaveBeenCalledWith('user.username = :username', { username });
            expect(jwtService.sign).toHaveBeenCalledWith({ sub: 3, username });
            expect(result).toEqual({ user, token: 'jwt-token' });
        });

        it('throws UnauthorizedException when credential does not exist', async () => {
            const qb = createQueryBuilderMock<Auth>(null);
            authRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.login(username, password)).rejects.toBeInstanceOf(UnauthorizedException);
            expect(jwtService.sign).not.toHaveBeenCalled();
        });

        it('throws UnauthorizedException when password does not match', async () => {
            const user = { id: 4, username } as User;
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

        it('rehashes and saves legacy plaintext credential on successful login', async () => {
            const user = { id: 5, username } as User;
            const credential = {
                id: 101,
                password,
                user,
            } as Auth;
            const qb = createQueryBuilderMock<Auth>(credential);

            authRepo.createQueryBuilder.mockReturnValue(qb);
            jwtService.sign.mockReturnValue('jwt-token');

            const result = await service.login(username, password);

            expect(argon2.hash).toHaveBeenCalledWith(password);
            expect(authRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ password: hashedPassword }),
            );
            expect(result).toEqual({ user, token: 'jwt-token' });
        });

        it('throws BadRequestException when login password is too short', async () => {
            await expect(service.login(username, 'short')).rejects.toBeInstanceOf(BadRequestException);
            expect(authRepo.createQueryBuilder).not.toHaveBeenCalled();
        });
    });
});
