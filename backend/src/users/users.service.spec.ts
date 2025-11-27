import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DeleteResult } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';

// Helper to create a proper DeleteResult
function makeDeleteResult(affected: number): DeleteResult {
    const dr = new DeleteResult();
    dr.affected = affected;
    dr.raw = [];
    return dr;
}

// Fully typed mock repository
type MockRepo<T = any> = {
    find: jest.Mock<Promise<T[]>, []>;
    findOne: jest.Mock<Promise<T | null>, [any]>;
    create: jest.Mock<T, [any]>;
    save: jest.Mock<Promise<T>, [T]>;
    delete: jest.Mock<Promise<DeleteResult>, [any]>;
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
            delete: jest.fn<Promise<DeleteResult>, [any]>(),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: repo },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    // ----------------------------
    // getAllUsers
    // ----------------------------
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



    // // ----------------------------
    // // findUser
    // // ----------------------------
    // describe('findUser', () => {
    //     it('finds user by ID', async () => {
    //         const user = { id: 1, name: 'Alice' } as User;
    //         repo.findOne.mockResolvedValue(user);

    //         const result = await service.findUser(1);
    //         expect(result).toEqual(user);
    //         expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    //     });

    //     it('finds user by name', async () => {
    //         const user = { id: 1, name: 'Alice' } as User;
    //         repo.findOne.mockResolvedValue(user);

    //         const result = await service.findUser('Alice');
    //         expect(result).toEqual(user);
    //         expect(repo.findOne).toHaveBeenCalledWith({ where: { name: 'Alice' } });
    //     });

    //     it('throws InternalServerErrorException on error', async () => {
    //         repo.findOne.mockRejectedValue(new Error('DB error'));
    //         await expect(service.findUser('Alice')).rejects.toThrow(InternalServerErrorException);
    //     });
    // });

    // ----------------------------
    // findUserById
    // ----------------------------
    describe('findUserById', () => {

        it('finds user by ID (no result)', async () => {

            repo.findOne.mockResolvedValue(null);

            const result = await service.findUserById(1);
            expect(result).toEqual(null);
            expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('finds user by ID (single result)', async () => {
            const user = { id: 1, name: 'Alice' } as User;
            repo.findOne.mockResolvedValue(user);

            const result = await service.findUserById(1);
            expect(result).toEqual(user);
            expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        });



        it('throws InternalServerErrorException on error', async () => {
            repo.findOne.mockRejectedValue(new Error('DB error'));
            await expect(service.findUser('Alice')).rejects.toThrow(InternalServerErrorException);
        });
    });

    // ----------------------------
    // findUsersByName
    // ----------------------------
    describe('findUsersByName', () => {

        it('finds user by name(single name, no users)', async () => {

            repo.find.mockResolvedValue([]);

            const result = await service.findUsersByName('Alice');
            expect(result).toEqual(null);
            expect(repo.find).toHaveBeenCalledWith({ where: { name: 'Alice' } });
        });

        it('finds user by name(single name, single user)', async () => {
            const user = [{ id: 1, name: 'Alice' } as User];
            repo.find.mockResolvedValue(user);

            const result = await service.findUsersByName('Alice');
            expect(result).toEqual(user);
            expect(repo.find).toHaveBeenCalledWith({ where: { name: 'Alice' } });
        });

        it('finds users by name(single name, multiple users)', async () => {
            const users = [{ id: 1, name: 'Alice' } as User,
            { id: 2, name: 'Alice' } as User
            ];
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

    // ----------------------------
    // create
    // ----------------------------
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

    // ----------------------------
    // delete
    // ----------------------------
    describe('delete', () => {
        it('returns true when a user is deleted', async () => {
            repo.delete.mockResolvedValue(makeDeleteResult(1));

            const result = await service.delete(1);
            expect(result).toBe(true);
            expect(repo.delete).toHaveBeenCalledWith({ id: 1 });
        });

        it('returns false when no user is deleted', async () => {
            repo.delete.mockResolvedValue(makeDeleteResult(0));

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
