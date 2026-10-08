import { FollowsResolver } from './follows.resolver';

describe('FollowsResolver', () => {
    const createFollowsService = () => ({
        follow: jest.fn(),
        unfollow: jest.fn(),
        getFollowers: jest.fn(),
        getFollowing: jest.fn(),
        getProfileFollowersView: jest.fn(),
        getProfileFollowingView: jest.fn(),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('delegates follow/unfollow to service', async () => {
        const followsService = createFollowsService();
        const resolver = new FollowsResolver(followsService as any);

        await resolver.followUser({ id: 1 } as any, { username: 'alice' } as any);
        await resolver.unfollowUser({ id: 1 } as any, { username: 'alice' } as any);

        expect(followsService.follow).toHaveBeenCalledWith(1, 'alice');
        expect(followsService.unfollow).toHaveBeenCalledWith(1, 'alice');
    });

    it('maps follower/following rows to user arrays', async () => {
        const followsService = createFollowsService();
        followsService.getFollowers.mockResolvedValue([
            { follower: { id: 1, username: 'alice' } },
            { follower: { id: 2, username: 'bob' } },
        ]);
        followsService.getFollowing.mockResolvedValue([
            { following: { id: 3, username: 'carol' } },
        ]);

        const resolver = new FollowsResolver(followsService as any);

        await expect(resolver.followers({ username: 'deniz' } as any)).resolves.toEqual([
            { id: 1, username: 'alice' },
            { id: 2, username: 'bob' },
        ]);
        await expect(resolver.following({ username: 'deniz' } as any)).resolves.toEqual([
            { id: 3, username: 'carol' },
        ]);
    });

    it('delegates profile view queries with current user id', async () => {
        const followsService = createFollowsService();
        followsService.getProfileFollowersView.mockResolvedValue([{ user: { id: 1 }, followedByMe: true }]);
        followsService.getProfileFollowingView.mockResolvedValue([{ user: { id: 2 }, followedByMe: false }]);

        const resolver = new FollowsResolver(followsService as any);

        await expect(
            resolver.getProfileFollowersView({ username: 'deniz' } as any, { id: 10 } as any),
        ).resolves.toEqual([{ user: { id: 1 }, followedByMe: true }]);

        await expect(
            resolver.getProfileFollowingView({ username: 'deniz' } as any, { id: 10 } as any),
        ).resolves.toEqual([{ user: { id: 2 }, followedByMe: false }]);

        expect(followsService.getProfileFollowersView).toHaveBeenCalledWith('deniz', 10);
        expect(followsService.getProfileFollowingView).toHaveBeenCalledWith('deniz', 10);
    });

    it('followUser returns delegated service result', async () => {
        const followsService = createFollowsService();
        followsService.follow.mockResolvedValue(true);
        const resolver = new FollowsResolver(followsService as any);

        await expect(resolver.followUser({ id: 4 } as any, { username: 'alice' } as any)).resolves.toBe(true);
        expect(followsService.follow).toHaveBeenCalledWith(4, 'alice');
    });

    it('unfollowUser returns delegated service result', async () => {
        const followsService = createFollowsService();
        followsService.unfollow.mockResolvedValue(false);
        const resolver = new FollowsResolver(followsService as any);

        await expect(resolver.unfollowUser({ id: 4 } as any, { username: 'alice' } as any)).resolves.toBe(false);
        expect(followsService.unfollow).toHaveBeenCalledWith(4, 'alice');
    });

    it('followers returns empty array when service returns no rows', async () => {
        const followsService = createFollowsService();
        followsService.getFollowers.mockResolvedValue([]);
        const resolver = new FollowsResolver(followsService as any);

        await expect(resolver.followers({ username: 'deniz' } as any)).resolves.toEqual([]);
    });

    it('following returns empty array when service returns no rows', async () => {
        const followsService = createFollowsService();
        followsService.getFollowing.mockResolvedValue([]);
        const resolver = new FollowsResolver(followsService as any);

        await expect(resolver.following({ username: 'deniz' } as any)).resolves.toEqual([]);
    });

    it('followers maps each row to follower user object only', async () => {
        const followsService = createFollowsService();
        followsService.getFollowers.mockResolvedValue([
            { follower: { id: 1, username: 'a' }, following: { id: 9, username: 'x' } },
            { follower: { id: 2, username: 'b' }, following: { id: 9, username: 'x' } },
        ]);
        const resolver = new FollowsResolver(followsService as any);

        await expect(resolver.followers({ username: 'deniz' } as any)).resolves.toEqual([
            { id: 1, username: 'a' },
            { id: 2, username: 'b' },
        ]);
    });

    it('following maps each row to following user object only', async () => {
        const followsService = createFollowsService();
        followsService.getFollowing.mockResolvedValue([
            { following: { id: 4, username: 'm' }, follower: { id: 1, username: 'deniz' } },
            { following: { id: 5, username: 'n' }, follower: { id: 1, username: 'deniz' } },
        ]);
        const resolver = new FollowsResolver(followsService as any);

        await expect(resolver.following({ username: 'deniz' } as any)).resolves.toEqual([
            { id: 4, username: 'm' },
            { id: 5, username: 'n' },
        ]);
    });
});
