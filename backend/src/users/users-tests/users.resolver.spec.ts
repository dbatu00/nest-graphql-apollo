import { UsersResolver } from '../users.resolver';

describe('UsersResolver', () => {
    const usersService = {
        findByUsername: jest.fn(),
        updateMyProfile: jest.fn(),
        isFollowing: jest.fn(),
        countFollowers: jest.fn(),
        countFollowing: jest.fn(),
    };

    let resolver: UsersResolver;

    beforeEach(() => {
        jest.clearAllMocks();
        resolver = new UsersResolver(usersService as any);
    });

    it('userByUsername delegates to service', async () => {
        const user = { id: 1, username: 'deniz' };
        usersService.findByUsername.mockResolvedValue(user);

        await expect(resolver.userByUsername('deniz')).resolves.toBe(user as any);
        expect(usersService.findByUsername).toHaveBeenCalledWith('deniz');
    });

    it('userByUsername returns null when user does not exist', async () => {
        usersService.findByUsername.mockResolvedValue(null);

        await expect(resolver.userByUsername('missing')).resolves.toBeNull();
        expect(usersService.findByUsername).toHaveBeenCalledWith('missing');
    });

    it('updateMyProfile delegates to service with current user id', async () => {
        const updated = { id: 1, username: 'deniz', displayName: 'Deniz', bio: 'hello' };
        usersService.updateMyProfile.mockResolvedValue(updated);

        await expect(
            resolver.updateMyProfile({ id: 1 } as any, 'Deniz', 'hello')
        ).resolves.toBe(updated as any);

        expect(usersService.updateMyProfile).toHaveBeenCalledWith(1, {
            displayName: 'Deniz',
            bio: 'hello',
        });
    });

    it('updateMyProfile propagates service errors', async () => {
        usersService.updateMyProfile.mockRejectedValue(new Error('update failed'));

        await expect(
            resolver.updateMyProfile({ id: 1 } as any, 'Deniz', 'hello')
        ).rejects.toThrow('update failed');
    });

    it('followedByMe returns false when no current user', async () => {
        await expect(resolver.followedByMe({ id: 2 } as any, undefined)).resolves.toBe(false);
        expect(usersService.isFollowing).not.toHaveBeenCalled();
    });

    it('followedByMe returns false for self-profile', async () => {
        await expect(resolver.followedByMe({ id: 2 } as any, { id: 2 } as any)).resolves.toBe(false);
        expect(usersService.isFollowing).not.toHaveBeenCalled();
    });

    it('followedByMe checks follow relationship for other users', async () => {
        usersService.isFollowing.mockResolvedValue(true);

        await expect(resolver.followedByMe({ id: 3 } as any, { id: 1 } as any)).resolves.toBe(true);
        expect(usersService.isFollowing).toHaveBeenCalledWith(1, 3);
    });

    it('followedByMe returns false when service says not-following', async () => {
        usersService.isFollowing.mockResolvedValue(false);

        await expect(resolver.followedByMe({ id: 3 } as any, { id: 1 } as any)).resolves.toBe(false);
        expect(usersService.isFollowing).toHaveBeenCalledWith(1, 3);
    });

    it('followedByMe propagates service errors', async () => {
        usersService.isFollowing.mockRejectedValue(new Error('db failed'));

        await expect(resolver.followedByMe({ id: 3 } as any, { id: 1 } as any)).rejects.toThrow('db failed');
    });

    it('followersCount delegates to service', async () => {
        usersService.countFollowers.mockResolvedValue(5);

        await expect(resolver.followersCount({ id: 7 } as any)).resolves.toBe(5);
        expect(usersService.countFollowers).toHaveBeenCalledWith(7);
    });

    it('followersCount propagates service errors', async () => {
        usersService.countFollowers.mockRejectedValue(new Error('count failed'));

        await expect(resolver.followersCount({ id: 7 } as any)).rejects.toThrow('count failed');
    });

    it('followingCount delegates to service', async () => {
        usersService.countFollowing.mockResolvedValue(9);

        await expect(resolver.followingCount({ id: 7 } as any)).resolves.toBe(9);
        expect(usersService.countFollowing).toHaveBeenCalledWith(7);
    });

    it('followingCount propagates service errors', async () => {
        usersService.countFollowing.mockRejectedValue(new Error('count failed'));

        await expect(resolver.followingCount({ id: 7 } as any)).rejects.toThrow('count failed');
    });
});
