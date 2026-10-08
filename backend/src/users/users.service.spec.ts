import { NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service';

describe('UsersService', () => {
    const createUserRepo = () => ({
        findOne: jest.fn(),
        update: jest.fn(),
    });

    const createFollowRepo = () => ({
        findOne: jest.fn(),
        count: jest.fn(),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns true from isFollowing when follow row exists', async () => {
        const userRepo = createUserRepo();
        const followRepo = createFollowRepo();
        followRepo.findOne.mockResolvedValue({ id: 1 });

        const service = new UsersService(userRepo as any, followRepo as any);

        await expect(service.isFollowing(10, 20)).resolves.toBe(true);
        expect(followRepo.findOne).toHaveBeenCalledWith({
            where: {
                follower: { id: 10 },
                following: { id: 20 },
            },
            select: { id: true },
        });
    });

    it('returns false from isFollowing when no follow row exists', async () => {
        const userRepo = createUserRepo();
        const followRepo = createFollowRepo();
        followRepo.findOne.mockResolvedValue(null);

        const service = new UsersService(userRepo as any, followRepo as any);

        await expect(service.isFollowing(10, 20)).resolves.toBe(false);
    });

    it('throws NotFoundException when updateMyProfile target user does not exist', async () => {
        const userRepo = createUserRepo();
        const followRepo = createFollowRepo();
        userRepo.findOne.mockResolvedValue(null);

        const service = new UsersService(userRepo as any, followRepo as any);

        await expect(
            service.updateMyProfile(99, { displayName: 'Alice' }),
        ).rejects.toBeInstanceOf(NotFoundException);

        expect(userRepo.update).not.toHaveBeenCalled();
    });

    it('normalizes profile fields and returns reloaded user', async () => {
        const userRepo = createUserRepo();
        const followRepo = createFollowRepo();

        userRepo.findOne
            .mockResolvedValueOnce({ id: 7, username: 'alice' })
            .mockResolvedValueOnce({
                id: 7,
                username: 'alice',
                displayName: 'Alice',
                bio: null,
                avatarUrl: 'https://img/a.png',
                coverUrl: null,
            });

        const service = new UsersService(userRepo as any, followRepo as any);

        const result = await service.updateMyProfile(7, {
            displayName: '  Alice  ',
            bio: '   ',
            avatarUrl: ' https://img/a.png ',
            coverUrl: '',
        });

        expect(userRepo.update).toHaveBeenCalledWith(
            { id: 7 },
            {
                displayName: 'Alice',
                bio: null,
                avatarUrl: 'https://img/a.png',
                coverUrl: null,
            },
        );
        expect(result).toEqual(
            expect.objectContaining({
                id: 7,
                username: 'alice',
                displayName: 'Alice',
            }),
        );
    });

    it('throws when reloading updated user fails after update', async () => {
        const userRepo = createUserRepo();
        const followRepo = createFollowRepo();

        userRepo.findOne
            .mockResolvedValueOnce({ id: 5, username: 'bob' })
            .mockResolvedValueOnce(null);

        const service = new UsersService(userRepo as any, followRepo as any);

        await expect(
            service.updateMyProfile(5, { displayName: 'Bob' }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });
});
