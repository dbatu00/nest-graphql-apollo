// users.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { InternalServerErrorException } from '@nestjs/common';
import { AddUserInput } from './add-user.input';
import { AddUserOutput } from './add-user.output';

describe('UsersResolver', () => {
    let resolver: UsersResolver;
    let service: jest.Mocked<UsersService>;

    beforeEach(async () => {
        const mockService: Partial<jest.Mocked<UsersService>> = {
            getAllUsers: jest.fn(),
            findUser: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersResolver,
                { provide: UsersService, useValue: mockService },
            ],
        }).compile();

        resolver = module.get<UsersResolver>(UsersResolver);
        service = module.get(UsersService);
    });

    // ----------------------------
    // getAllUsers
    // ----------------------------
    describe('getAllUsers', () => {
        it('returns all users', async () => {
            const users = [{ id: 1, name: 'Alice' }] as User[];
            service.getAllUsers.mockResolvedValue(users);

            const result = await resolver.getAllUsers();

            expect(result).toEqual(users);
            expect(service.getAllUsers).toHaveBeenCalled();
        });

        it('throws InternalServerErrorException on error', async () => {
            service.getAllUsers.mockRejectedValue(new Error('DB error'));
            await expect(resolver.getAllUsers()).rejects.toThrow(InternalServerErrorException);
        });
    });

    // ----------------------------
    // addUser
    // ----------------------------
    describe('addUser', () => {
        it('creates a new user when not found', async () => {
            const input: AddUserInput = { name: 'Alice', force: false };
            const user = { id: 1, name: 'Alice' } as User;

            service.findUser.mockResolvedValue(null);
            service.create.mockResolvedValue(user);

            const result = await resolver.addUser(input);
            expect(result.user).toEqual(user);
            expect(result.userExists).toBe(undefined);
            expect(service.findUser).toHaveBeenCalledWith('Alice');
            expect(service.create).toHaveBeenCalledWith('Alice');
        });

        it('sets userExists when already exists and not forced', async () => {
            const input: AddUserInput = { name: 'Alice', force: false };
            const existing = { id: 1, name: 'Alice' } as User;

            service.findUser.mockResolvedValue(existing);

            const result = await resolver.addUser(input);
            expect(result.userExists).toBe(true);
            expect(service.create).not.toHaveBeenCalled();
        });

        it('creates new user when force = true', async () => {
            const input: AddUserInput = { name: 'Alice', force: true };
            const existing = { id: 1, name: 'Alice' } as User;
            const newUser = { id: 2, name: 'Alice' } as User;

            service.findUser.mockResolvedValue(existing);
            service.create.mockResolvedValue(newUser);

            const result = await resolver.addUser(input);
            expect(result.user).toEqual(newUser);
            expect(service.create).toHaveBeenCalled();
        });

        it('throws InternalServerErrorException on error', async () => {
            const input: AddUserInput = { name: 'Alice', force: false };
            service.findUser.mockRejectedValue(new Error('DB error'));

            await expect(resolver.addUser(input)).rejects.toThrow(InternalServerErrorException);
        });
    });
});
