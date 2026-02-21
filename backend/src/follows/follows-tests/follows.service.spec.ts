import { FollowsService } from '../follows.service';
import { Follow } from '../follow.entity';
import { User } from '../../users/user.entity';
import { createEntityManagerMock } from '../../test-utils/typeorm.mocks';

describe('FollowsService', () => {
    let service: FollowsService;

    const followRepo = {
        manager: {
            transaction: jest.fn(),
        },
        find: jest.fn(),
    };

    const userRepo = {
        createQueryBuilder: jest.fn(),
    };

    const activityService = {
        logActivity: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        service = new FollowsService(
            followRepo as any,
            userRepo as any,
            activityService as any,
        );
    });

    describe('follow', () => {
        it('returns false when follower does not exist', async () => {
            const manager = createEntityManagerMock();
            manager.findOne.mockResolvedValueOnce(null);
            followRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.follow(1, 'alice')).resolves.toBe(false);
            expect(activityService.logActivity).not.toHaveBeenCalled();
        });

        it('returns true idempotently when relation already exists', async () => {
            const follower = { id: 1, username: 'deniz' } as User;
            const following = { id: 2, username: 'alice' } as User;
            const manager = createEntityManagerMock();

            manager.findOne
                .mockResolvedValueOnce(follower)
                .mockResolvedValueOnce(following)
                .mockResolvedValueOnce({ id: 10 } as Follow);

            followRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.follow(1, 'alice')).resolves.toBe(true);
            expect(manager.save).not.toHaveBeenCalled();
            expect(activityService.logActivity).not.toHaveBeenCalled();
        });

        it('returns false when trying to follow self', async () => {
            const sameUser = { id: 1, username: 'deniz' } as User;
            const manager = createEntityManagerMock();

            manager.findOne
                .mockResolvedValueOnce(sameUser)
                .mockResolvedValueOnce(sameUser);

            followRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.follow(1, 'deniz')).resolves.toBe(false);
            expect(manager.save).not.toHaveBeenCalled();
            expect(activityService.logActivity).not.toHaveBeenCalled();
        });

        it('creates relation and logs active follow activity', async () => {
            const follower = { id: 1, username: 'deniz' } as User;
            const following = { id: 2, username: 'alice' } as User;
            const manager = createEntityManagerMock();

            manager.findOne
                .mockResolvedValueOnce(follower)
                .mockResolvedValueOnce(following)
                .mockResolvedValueOnce(null);
            manager.save.mockResolvedValue({ id: 11 } as Follow);

            followRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.follow(1, 'alice')).resolves.toBe(true);
            expect(manager.save).toHaveBeenCalledWith(Follow, { follower, following });
            expect(activityService.logActivity).toHaveBeenCalledWith(
                {
                    type: 'follow',
                    actor: follower,
                    targetUser: following,
                    active: true,
                },
                manager,
            );
        });

        it('returns true for unique violation during concurrent insert', async () => {
            const follower = { id: 1, username: 'deniz' } as User;
            const following = { id: 2, username: 'alice' } as User;
            const manager = createEntityManagerMock();

            manager.findOne
                .mockResolvedValueOnce(follower)
                .mockResolvedValueOnce(following)
                .mockResolvedValueOnce(null);
            manager.save.mockRejectedValue({ code: '23505' });
            followRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.follow(1, 'alice')).resolves.toBe(true);
            expect(activityService.logActivity).not.toHaveBeenCalled();
        });
    });

    describe('unfollow', () => {
        it('returns false when follower/following does not exist', async () => {
            const manager = createEntityManagerMock();
            manager.findOne.mockResolvedValueOnce(null);
            followRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.unfollow(1, 'alice')).resolves.toBe(false);
            expect(manager.remove).not.toHaveBeenCalled();
        });

        it('returns true idempotently when relation does not exist', async () => {
            const follower = { id: 1, username: 'deniz' } as User;
            const following = { id: 2, username: 'alice' } as User;
            const manager = createEntityManagerMock();

            manager.findOne
                .mockResolvedValueOnce(follower)
                .mockResolvedValueOnce(following)
                .mockResolvedValueOnce(null);

            followRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.unfollow(1, 'alice')).resolves.toBe(true);
            expect(manager.remove).not.toHaveBeenCalled();
            expect(activityService.logActivity).not.toHaveBeenCalled();
        });

        it('removes relation and logs inactive follow activity', async () => {
            const follower = { id: 1, username: 'deniz' } as User;
            const following = { id: 2, username: 'alice' } as User;
            const existing = { id: 10 } as Follow;
            const manager = {
                ...createEntityManagerMock(),
                remove: jest.fn().mockResolvedValue(undefined),
            };

            manager.findOne
                .mockResolvedValueOnce(follower)
                .mockResolvedValueOnce(following)
                .mockResolvedValueOnce(existing);

            followRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.unfollow(1, 'alice')).resolves.toBe(true);
            expect(manager.remove).toHaveBeenCalledWith(existing);
            expect(activityService.logActivity).toHaveBeenCalledWith(
                {
                    type: 'follow',
                    actor: follower,
                    targetUser: following,
                    active: false,
                },
                manager,
            );
        });
    });

    describe('getFollowers', () => {
        it('reads followers list by target username', async () => {
            const rows = [{ id: 1 }];
            followRepo.find.mockResolvedValue(rows);

            await expect(service.getFollowers('alice')).resolves.toBe(rows);
            expect(followRepo.find).toHaveBeenCalledWith({
                where: { following: { username: 'alice' } },
                relations: ['follower'],
            });
        });
    });

    describe('getFollowing', () => {
        it('reads following list by source username', async () => {
            const rows = [{ id: 1 }];
            followRepo.find.mockResolvedValue(rows);

            await expect(service.getFollowing('deniz')).resolves.toBe(rows);
            expect(followRepo.find).toHaveBeenCalledWith({
                where: { follower: { username: 'deniz' } },
                relations: ['following'],
            });
        });
    });

    describe('getFollowersWithFollowState', () => {
        it('builds query and returns raw + entities', async () => {
            const qb = {
                innerJoin: jest.fn(),
                leftJoin: jest.fn(),
                where: jest.fn(),
                select: jest.fn(),
                addSelect: jest.fn(),
                getRawAndEntities: jest.fn().mockResolvedValue({ raw: [], entities: [] }),
            };
            qb.innerJoin.mockReturnValue(qb);
            qb.leftJoin.mockReturnValue(qb);
            qb.where.mockReturnValue(qb);
            qb.select.mockReturnValue(qb);
            qb.addSelect.mockReturnValue(qb);

            userRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.getFollowersWithFollowState('alice', 1)).resolves.toEqual({ raw: [], entities: [] });
            expect(userRepo.createQueryBuilder).toHaveBeenCalledWith('u');
            expect(qb.getRawAndEntities).toHaveBeenCalled();
        });
    });

    describe('getFollowingWithFollowState', () => {
        it('builds query and returns raw + entities', async () => {
            const qb = {
                innerJoin: jest.fn(),
                leftJoin: jest.fn(),
                where: jest.fn(),
                select: jest.fn(),
                addSelect: jest.fn(),
                getRawAndEntities: jest.fn().mockResolvedValue({ raw: [], entities: [] }),
            };
            qb.innerJoin.mockReturnValue(qb);
            qb.leftJoin.mockReturnValue(qb);
            qb.where.mockReturnValue(qb);
            qb.select.mockReturnValue(qb);
            qb.addSelect.mockReturnValue(qb);

            userRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.getFollowingWithFollowState('alice', 1)).resolves.toEqual({ raw: [], entities: [] });
            expect(userRepo.createQueryBuilder).toHaveBeenCalledWith('u');
            expect(qb.getRawAndEntities).toHaveBeenCalled();
        });
    });
});
