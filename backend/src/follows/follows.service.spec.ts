import { FollowsService } from './follows.service';

describe('FollowsService', () => {
    const createFollowRepo = () => {
        const manager = {
            transaction: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
        };

        manager.transaction.mockImplementation(async (cb: (m: any) => Promise<unknown>) => cb(manager));

        return {
            manager,
            find: jest.fn(),
        };
    };

    const createUserRepo = () => ({
        createQueryBuilder: jest.fn(),
    });

    const createActivityService = () => ({
        logActivity: jest.fn(),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('follow returns false when follower or following is missing', async () => {
        const followRepo = createFollowRepo();
        const userRepo = createUserRepo();
        const activity = createActivityService();

        followRepo.manager.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: 2, username: 'bob' });

        const service = new FollowsService(followRepo as any, userRepo as any, activity as any);

        await expect(service.follow(1, 'bob')).resolves.toBe(false);
        expect(followRepo.manager.save).not.toHaveBeenCalled();
    });

    it('follow returns false when trying to follow self', async () => {
        const followRepo = createFollowRepo();
        const userRepo = createUserRepo();

        followRepo.manager.findOne
            .mockResolvedValueOnce({ id: 1, username: 'alice' })
            .mockResolvedValueOnce({ id: 1, username: 'alice' });

        const service = new FollowsService(followRepo as any, userRepo as any, createActivityService() as any);

        await expect(service.follow(1, 'alice')).resolves.toBe(false);
    });

    it('follow is idempotent when relation already exists', async () => {
        const followRepo = createFollowRepo();
        const userRepo = createUserRepo();
        const activity = createActivityService();

        followRepo.manager.findOne
            .mockResolvedValueOnce({ id: 1, username: 'alice' })
            .mockResolvedValueOnce({ id: 2, username: 'bob' })
            .mockResolvedValueOnce({ id: 99 });

        const service = new FollowsService(followRepo as any, userRepo as any, activity as any);

        await expect(service.follow(1, 'bob')).resolves.toBe(true);
        expect(followRepo.manager.save).not.toHaveBeenCalled();
        expect(activity.logActivity).not.toHaveBeenCalled();
    });

    it('follow treats unique-violation duplicate insert as success', async () => {
        const followRepo = createFollowRepo();
        const userRepo = createUserRepo();

        followRepo.manager.findOne
            .mockResolvedValueOnce({ id: 1, username: 'alice' })
            .mockResolvedValueOnce({ id: 2, username: 'bob' })
            .mockResolvedValueOnce(null);
        followRepo.manager.save.mockRejectedValue({ code: '23505' });

        const service = new FollowsService(followRepo as any, userRepo as any, createActivityService() as any);

        await expect(service.follow(1, 'bob')).resolves.toBe(true);
    });

    it('follow saves relation and logs active follow activity', async () => {
        const followRepo = createFollowRepo();
        const userRepo = createUserRepo();
        const activity = createActivityService();

        const follower = { id: 1, username: 'alice' };
        const following = { id: 2, username: 'bob' };

        followRepo.manager.findOne
            .mockResolvedValueOnce(follower)
            .mockResolvedValueOnce(following)
            .mockResolvedValueOnce(null);
        followRepo.manager.save.mockResolvedValue({ id: 10 });

        const service = new FollowsService(followRepo as any, userRepo as any, activity as any);

        await expect(service.follow(1, 'bob')).resolves.toBe(true);
        expect(activity.logActivity).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'follow',
                actor: follower,
                targetUser: following,
                shouldBeActive: true,
            }),
            followRepo.manager,
        );
    });

    it('unfollow returns false when follower or following is missing', async () => {
        const followRepo = createFollowRepo();
        const userRepo = createUserRepo();

        followRepo.manager.findOne
            .mockResolvedValueOnce({ id: 1, username: 'alice' })
            .mockResolvedValueOnce(null);

        const service = new FollowsService(followRepo as any, userRepo as any, createActivityService() as any);

        await expect(service.unfollow(1, 'bob')).resolves.toBe(false);
    });

    it('unfollow is idempotent when relation does not exist', async () => {
        const followRepo = createFollowRepo();
        const userRepo = createUserRepo();
        const activity = createActivityService();

        followRepo.manager.findOne
            .mockResolvedValueOnce({ id: 1, username: 'alice' })
            .mockResolvedValueOnce({ id: 2, username: 'bob' })
            .mockResolvedValueOnce(null);

        const service = new FollowsService(followRepo as any, userRepo as any, activity as any);

        await expect(service.unfollow(1, 'bob')).resolves.toBe(true);
        expect(followRepo.manager.remove).not.toHaveBeenCalled();
        expect(activity.logActivity).not.toHaveBeenCalled();
    });

    it('unfollow removes relation and logs inactive follow activity', async () => {
        const followRepo = createFollowRepo();
        const userRepo = createUserRepo();
        const activity = createActivityService();

        const follower = { id: 1, username: 'alice' };
        const following = { id: 2, username: 'bob' };
        const existing = { id: 7, follower, following };

        followRepo.manager.findOne
            .mockResolvedValueOnce(follower)
            .mockResolvedValueOnce(following)
            .mockResolvedValueOnce(existing);

        const service = new FollowsService(followRepo as any, userRepo as any, activity as any);

        await expect(service.unfollow(1, 'bob')).resolves.toBe(true);
        expect(followRepo.manager.remove).toHaveBeenCalledWith(existing);
        expect(activity.logActivity).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'follow',
                actor: follower,
                targetUser: following,
                shouldBeActive: false,
            }),
            followRepo.manager,
        );
    });

    it('delegates getFollowers and getFollowing query shapes', async () => {
        const followRepo = createFollowRepo();
        const userRepo = createUserRepo();
        followRepo.find.mockResolvedValue([]);

        const service = new FollowsService(followRepo as any, userRepo as any, createActivityService() as any);

        await service.getFollowers('alice');
        await service.getFollowing('alice');

        expect(followRepo.find).toHaveBeenNthCalledWith(1, {
            where: { following: { username: 'alice' } },
            relations: ['follower'],
        });
        expect(followRepo.find).toHaveBeenNthCalledWith(2, {
            where: { follower: { username: 'alice' } },
            relations: ['following'],
        });
    });

    it('maps profile followers/following view and normalizes raw followedByMe values', async () => {
        const followRepo = createFollowRepo();
        const userRepo = createUserRepo();
        const qb = {
            innerJoin: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            getRawAndEntities: jest.fn(),
        };

        qb.getRawAndEntities
            .mockResolvedValueOnce({
                entities: [{ id: 1, username: 'alice' }, { id: 2, username: 'bob' }],
                raw: [{ followedByMe: true }, { followedByMe: 'true' }],
            })
            .mockResolvedValueOnce({
                entities: [{ id: 3, username: 'carol' }],
                raw: [{ followedByMe: false }],
            });

        userRepo.createQueryBuilder.mockReturnValue(qb);

        const service = new FollowsService(followRepo as any, userRepo as any, createActivityService() as any);

        await expect(service.getProfileFollowersView('deniz', 9)).resolves.toEqual([
            { user: { id: 1, username: 'alice' }, followedByMe: true },
            { user: { id: 2, username: 'bob' }, followedByMe: true },
        ]);

        await expect(service.getProfileFollowingView('deniz', 9)).resolves.toEqual([
            { user: { id: 3, username: 'carol' }, followedByMe: false },
        ]);
    });
});
