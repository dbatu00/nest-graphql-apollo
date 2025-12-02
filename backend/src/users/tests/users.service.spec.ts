import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { InternalServerErrorException } from '@nestjs/common';

// Fully typed mock repository
type MockRepo<T = any> = {
    find: jest.Mock<Promise<T[]>, []>;
    findOne: jest.Mock<Promise<T | null>, [any]>;
    create: jest.Mock<T, [any]>;
    save: jest.Mock<Promise<T>, [T]>;
    delete: jest.Mock<Promise<{ affected: number }>, [any]>;
};

describe('UsersService', () => {
    let service: UsersService;
    let repo: MockRepo<User>;

    beforeEach(async () => {
        repo = {
            find: jest.fn<Promise<User[]>, []>(),
            findOne: jest.fn<Promise<User | null>, [any]>(),
            create: jest.fn<User, [any]>(),
            save: jest.fn<Promise<User>, [User]>(),
            delete: jest.fn<Promise<{ affected: number }>, [any]>(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: repo },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);

        jest.spyOn(service['logger'], 'error').mockImplementation(() => { });
    });

    describe('getAllUsers', () => {
        it('returns all users', async () => {
            const users: User[] = [{ id: 1, name: 'Alice' } as User];
            repo.find.mockResolvedValue(users);
            const result = await service.getAllUsers();

            expect(result).toEqual(users);
            expect(repo.find).toHaveBeenCalled();
        });

        it('throws InternalServerErrorException on error', async () => {
            repo.find.mockRejectedValue(new Error('DB error'));
            await expect(service.getAllUsers()).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('findUserById', () => {
        it('returns null if user not found', async () => {
            repo.findOne.mockResolvedValue(null);
            const result = await service.findUserById(1);

            expect(result).toBeNull();
            expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('returns user if found', async () => {
            const user = { id: 1, name: 'Alice' } as User;
            repo.findOne.mockResolvedValue(user);
            const result = await service.findUserById(1);

            expect(result).toEqual(user);
            expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('throws InternalServerErrorException on error', async () => {
            repo.findOne.mockRejectedValue(new Error('DB error'));
            await expect(service.findUserById(1)).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('findUsersByName', () => {
        it('returns null if no users found', async () => {
            repo.find.mockResolvedValue([]);
            const result = await service.findUsersByName('Alice');

            expect(result).toBeNull();
            expect(repo.find).toHaveBeenCalledWith({ where: { name: 'Alice' } });
        });

        it('returns users if found', async () => {
            const users = [{ id: 1, name: 'Alice' } as User, { id: 2, name: 'Alice' } as User];
            repo.find.mockResolvedValue(users);
            const result = await service.findUsersByName('Alice');

            expect(result).toEqual(users);
            expect(repo.find).toHaveBeenCalledWith({ where: { name: 'Alice' } });
        });

        it('throws InternalServerErrorException on error', async () => {
            repo.find.mockRejectedValue(new Error('DB error'));
            await expect(service.findUsersByName('Alice')).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('create', () => {
        it('creates a new user', async () => {
            const user = { id: 1, name: 'Alice' } as User;
            repo.create.mockReturnValue({ name: 'Alice' } as User);
            repo.save.mockResolvedValue(user);

            const result = await service.create('Alice');

            expect(result).toEqual(user);
            expect(repo.create).toHaveBeenCalledWith({ name: 'Alice' });
            expect(repo.save).toHaveBeenCalledWith({ name: 'Alice' });
        });

        it('throws InternalServerErrorException on error', async () => {
            repo.create.mockReturnValue({ name: 'Alice' } as User);
            repo.save.mockRejectedValue(new Error('DB error'));

            await expect(service.create('Alice')).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('delete', () => {
        it('returns true when a user is deleted', async () => {
            repo.delete.mockResolvedValue({ affected: 1 });
            const result = await service.delete(1);

            expect(result).toBe(true);
            expect(repo.delete).toHaveBeenCalledWith({ id: 1 });
        });

        it('returns false when no user is deleted', async () => {
            repo.delete.mockResolvedValue({ affected: 0 });
            const result = await service.delete(2);

            expect(result).toBe(false);
            expect(repo.delete).toHaveBeenCalledWith({ id: 2 });
        });

        it('throws InternalServerErrorException on error', async () => {
            repo.delete.mockRejectedValue(new Error('DB error'));
            await expect(service.delete(3)).rejects.toThrow(InternalServerErrorException);
        });
    });
});
