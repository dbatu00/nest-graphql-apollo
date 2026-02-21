import { FollowsResolver } from '../follows.resolver';

describe('FollowsResolver', () => {
    const followsService = {
        follow: jest.fn(),
        unfollow: jest.fn(),
        getFollowers: jest.fn(),
        getFollowing: jest.fn(),
        getFollowersWithFollowState: jest.fn(),
        getFollowingWithFollowState: jest.fn(),
    };

    let resolver: FollowsResolver;

    beforeEach(() => {
        jest.clearAllMocks();
        resolver = new FollowsResolver(followsService as any);
    });

    it('followUser delegates to service with user id + username', async () => {
        followsService.follow.mockResolvedValue(true);

        await expect(resolver.followUser({ id: 1 } as any, 'alice')).resolves.toBe(true);
        expect(followsService.follow).toHaveBeenCalledWith(1, 'alice');
    });

    it('followUser propagates service errors', async () => {
        followsService.follow.mockRejectedValue(new Error('follow failed'));

        await expect(resolver.followUser({ id: 1 } as any, 'alice')).rejects.toThrow('follow failed');
    });

    it('unfollowUser delegates to service with user id + username', async () => {
        followsService.unfollow.mockResolvedValue(true);

        await expect(resolver.unfollowUser({ id: 1 } as any, 'alice')).resolves.toBe(true);
        expect(followsService.unfollow).toHaveBeenCalledWith(1, 'alice');
    });

    it('unfollowUser propagates service errors', async () => {
        followsService.unfollow.mockRejectedValue(new Error('unfollow failed'));

        await expect(resolver.unfollowUser({ id: 1 } as any, 'alice')).rejects.toThrow('unfollow failed');
    });

    it('followers maps follow rows to follower users', async () => {
        followsService.getFollowers.mockResolvedValue([
            { follower: { id: 2 } },
            { follower: { id: 3 } },
        ]);

        await expect(resolver.followers('alice')).resolves.toEqual([{ id: 2 }, { id: 3 }]);
    });

    it('followers propagates service errors', async () => {
        followsService.getFollowers.mockRejectedValue(new Error('followers failed'));

        await expect(resolver.followers('alice')).rejects.toThrow('followers failed');
    });

    it('following maps follow rows to following users', async () => {
        followsService.getFollowing.mockResolvedValue([
            { following: { id: 2 } },
            { following: { id: 3 } },
        ]);

        await expect(resolver.following('deniz')).resolves.toEqual([{ id: 2 }, { id: 3 }]);
    });

    it('following propagates service errors', async () => {
        followsService.getFollowing.mockRejectedValue(new Error('following failed'));

        await expect(resolver.following('deniz')).rejects.toThrow('following failed');
    });

    it('followersWithFollowState normalizes boolean/string raw values', async () => {
        followsService.getFollowersWithFollowState.mockResolvedValue({
            entities: [{ id: 2 }, { id: 3 }],
            raw: [{ followedByMe: true }, { followedByMe: 'true' }],
        });

        await expect(resolver.followersWithFollowState('alice', { id: 1 } as any)).resolves.toEqual([
            { user: { id: 2 }, followedByMe: true },
            { user: { id: 3 }, followedByMe: true },
        ]);
        expect(followsService.getFollowersWithFollowState).toHaveBeenCalledWith('alice', 1);
    });

    it('followersWithFollowState maps unknown raw values to false', async () => {
        followsService.getFollowersWithFollowState.mockResolvedValue({
            entities: [{ id: 2 }],
            raw: [{ followedByMe: '1' }],
        });

        await expect(resolver.followersWithFollowState('alice', { id: 1 } as any)).resolves.toEqual([
            { user: { id: 2 }, followedByMe: false },
        ]);
    });

    it('followersWithFollowState propagates service errors', async () => {
        followsService.getFollowersWithFollowState.mockRejectedValue(new Error('state failed'));

        await expect(resolver.followersWithFollowState('alice', { id: 1 } as any)).rejects.toThrow('state failed');
    });

    it('followersWithFollowState currently throws when raw/entities lengths mismatch', async () => {
        followsService.getFollowersWithFollowState.mockResolvedValue({
            entities: [{ id: 2 }, { id: 3 }],
            raw: [{ followedByMe: true }],
        });

        await expect(resolver.followersWithFollowState('alice', { id: 1 } as any)).rejects.toThrow();
    });

    it('followingWithFollowState normalizes false raw values', async () => {
        followsService.getFollowingWithFollowState.mockResolvedValue({
            entities: [{ id: 2 }, { id: 3 }],
            raw: [{ followedByMe: false }, { followedByMe: 'false' }],
        });

        await expect(resolver.followingWithFollowState('alice', { id: 1 } as any)).resolves.toEqual([
            { user: { id: 2 }, followedByMe: false },
            { user: { id: 3 }, followedByMe: false },
        ]);
        expect(followsService.getFollowingWithFollowState).toHaveBeenCalledWith('alice', 1);
    });

    it('followingWithFollowState propagates service errors', async () => {
        followsService.getFollowingWithFollowState.mockRejectedValue(new Error('state failed'));

        await expect(resolver.followingWithFollowState('alice', { id: 1 } as any)).rejects.toThrow('state failed');
    });

    it('followingWithFollowState currently throws when raw/entities lengths mismatch', async () => {
        followsService.getFollowingWithFollowState.mockResolvedValue({
            entities: [{ id: 2 }, { id: 3 }],
            raw: [{ followedByMe: false }],
        });

        await expect(resolver.followingWithFollowState('alice', { id: 1 } as any)).rejects.toThrow();
    });
});
