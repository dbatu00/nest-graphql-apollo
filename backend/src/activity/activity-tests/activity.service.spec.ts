import { ActivityService } from '../activity.service';
import { ACTIVITY_TYPE } from '../activity.constants';
import { Activity } from '../activity.entity';

describe('ActivityService', () => {
    const activityRepo = {
        findOne: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const userRepo = {
        findOneBy: jest.fn(),
    };

    let service: ActivityService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ActivityService(activityRepo as any, userRepo as any);
    });

    describe('logActivity', () => {
        it('reuses existing like activity and flips active state', async () => {
            const actor = { id: 1 } as any;
            const targetPost = { id: 10 } as any;
            const existing = {
                id: 99,
                active: true,
                createdAt: new Date('2020-01-01T00:00:00.000Z'),
            } as Activity;

            activityRepo.findOne.mockResolvedValue(existing);
            activityRepo.save.mockResolvedValue(existing);

            await expect(
                service.logActivity({
                    type: ACTIVITY_TYPE.LIKE,
                    actor,
                    targetPost,
                    active: false,
                }),
            ).resolves.toBe(existing);

            expect(activityRepo.findOne).toHaveBeenCalledWith({
                where: {
                    actorId: 1,
                    targetPostId: 10,
                    type: 'like',
                },
            });
            expect(existing.active).toBe(false);
            expect(activityRepo.save).toHaveBeenCalledWith(existing);
        });

        it('reuses existing follow activity and flips active state', async () => {
            const actor = { id: 1 } as any;
            const targetUser = { id: 20 } as any;
            const existing = { id: 100, active: true, createdAt: new Date() } as Activity;

            activityRepo.findOne.mockResolvedValue(existing);
            activityRepo.save.mockResolvedValue(existing);

            await expect(
                service.logActivity({
                    type: ACTIVITY_TYPE.FOLLOW,
                    actor,
                    targetUser,
                    active: false,
                }),
            ).resolves.toBe(existing);

            expect(activityRepo.findOne).toHaveBeenCalledWith({
                where: {
                    actorId: 1,
                    targetUserId: 20,
                    type: 'follow',
                },
            });
            expect(existing.active).toBe(false);
            expect(activityRepo.save).toHaveBeenCalledWith(existing);
        });

        it('creates a new activity row with default active=true when not provided', async () => {
            const actor = { id: 1 } as any;
            const targetPost = { id: 10 } as any;

            activityRepo.findOne.mockResolvedValue(null);
            activityRepo.save.mockResolvedValue({ id: 101 });

            await service.logActivity({
                type: ACTIVITY_TYPE.LIKE,
                actor,
                targetPost,
            });

            expect(activityRepo.save).toHaveBeenCalledWith({
                type: 'like',
                actor,
                actorId: 1,
                targetPost,
                targetPostId: 10,
                targetUser: undefined,
                targetUserId: undefined,
                active: true,
            });
        });

        it('uses manager repository when manager is provided', async () => {
            const actor = { id: 1 } as any;
            const managerRepo = {
                findOne: jest.fn().mockResolvedValue(null),
                save: jest.fn().mockResolvedValue({ id: 888 }),
            };
            const manager = {
                getRepository: jest.fn().mockReturnValue(managerRepo),
            };

            await service.logActivity(
                {
                    type: ACTIVITY_TYPE.POST,
                    actor,
                    active: false,
                },
                manager as any,
            );

            expect(manager.getRepository).toHaveBeenCalledWith(Activity);
            expect(managerRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'post',
                    actor,
                    actorId: 1,
                    active: false,
                }),
            );
            expect(activityRepo.save).not.toHaveBeenCalled();
        });

        it('propagates repository errors', async () => {
            const actor = { id: 1 } as any;
            activityRepo.save.mockRejectedValue(new Error('save failed'));

            await expect(
                service.logActivity({
                    type: ACTIVITY_TYPE.POST,
                    actor,
                }),
            ).rejects.toThrow('save failed');
        });

        it('currently allows like activity without targetPost and saves a row', async () => {
            const actor = { id: 1 } as any;
            activityRepo.save.mockResolvedValue({ id: 777 });

            await service.logActivity({
                type: ACTIVITY_TYPE.LIKE,
                actor,
            });

            expect(activityRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'like',
                    actorId: 1,
                    targetPost: undefined,
                    targetPostId: undefined,
                }),
            );
        });

        it('currently allows follow activity without targetUser and saves a row', async () => {
            const actor = { id: 1 } as any;
            activityRepo.save.mockResolvedValue({ id: 778 });

            await service.logActivity({
                type: ACTIVITY_TYPE.FOLLOW,
                actor,
            });

            expect(activityRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'follow',
                    actorId: 1,
                    targetUser: undefined,
                    targetUserId: undefined,
                }),
            );
        });
    });

    describe('deleteActivitiesForPost', () => {
        it('deletes activity rows by targetPostId', async () => {
            activityRepo.delete.mockResolvedValue({ affected: 2 });

            await expect(service.deleteActivitiesForPost(10)).resolves.toBeUndefined();
            expect(activityRepo.delete).toHaveBeenCalledWith({ targetPostId: 10 });
        });

        it('propagates delete errors', async () => {
            activityRepo.delete.mockRejectedValue(new Error('delete failed'));

            await expect(service.deleteActivitiesForPost(10)).rejects.toThrow('delete failed');
        });
    });

    describe('getActivityFeed', () => {
        function createQb() {
            const qb = {
                leftJoinAndSelect: jest.fn(),
                where: jest.fn(),
                andWhere: jest.fn(),
                orderBy: jest.fn(),
                take: jest.fn(),
                getMany: jest.fn(),
            };
            qb.leftJoinAndSelect.mockReturnValue(qb);
            qb.where.mockReturnValue(qb);
            qb.andWhere.mockReturnValue(qb);
            qb.orderBy.mockReturnValue(qb);
            qb.take.mockReturnValue(qb);
            return qb;
        }

        it('builds base feed query and returns rows', async () => {
            const qb = createQb();
            qb.getMany.mockResolvedValue([{ id: 1 }]);
            activityRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.getActivityFeed()).resolves.toEqual([{ id: 1 }]);
            expect(activityRepo.createQueryBuilder).toHaveBeenCalledWith('a');
            expect(qb.take).toHaveBeenCalledWith(50);
            expect(qb.getMany).toHaveBeenCalled();
        });

        it('applies type filter when types are provided', async () => {
            const qb = createQb();
            qb.getMany.mockResolvedValue([]);
            activityRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getActivityFeed(undefined, ['post', 'like']);

            expect(qb.andWhere).toHaveBeenCalledWith('a.type IN (:...types)', {
                types: ['post', 'like'],
            });
        });

        it('does not apply type filter when types is empty', async () => {
            const qb = createQb();
            qb.getMany.mockResolvedValue([]);
            activityRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getActivityFeed(undefined, []);

            const hasTypeFilterCall = qb.andWhere.mock.calls.some(
                (args: any[]) => args[0] === 'a.type IN (:...types)',
            );
            expect(hasTypeFilterCall).toBe(false);
        });

        it('returns empty array when username filter user does not exist', async () => {
            const qb = createQb();
            activityRepo.createQueryBuilder.mockReturnValue(qb);
            userRepo.findOneBy.mockResolvedValue(null);

            await expect(service.getActivityFeed('missing')).resolves.toEqual([]);
            expect(userRepo.findOneBy).toHaveBeenCalledWith({ username: 'missing' });
            expect(qb.getMany).not.toHaveBeenCalled();
        });

        it('applies actor filter when username exists', async () => {
            const qb = createQb();
            qb.getMany.mockResolvedValue([{ id: 2 }]);
            activityRepo.createQueryBuilder.mockReturnValue(qb);
            userRepo.findOneBy.mockResolvedValue({ id: 7 });

            await expect(service.getActivityFeed('deniz')).resolves.toEqual([{ id: 2 }]);
            expect(qb.andWhere).toHaveBeenCalledWith('a.actor.id = :userId', { userId: 7 });
        });

        it('uses custom limit when provided', async () => {
            const qb = createQb();
            qb.getMany.mockResolvedValue([]);
            activityRepo.createQueryBuilder.mockReturnValue(qb);

            await service.getActivityFeed(undefined, undefined, 10);

            expect(qb.take).toHaveBeenCalledWith(10);
        });

        it('propagates query errors', async () => {
            activityRepo.createQueryBuilder.mockImplementation(() => {
                throw new Error('query failed');
            });

            await expect(service.getActivityFeed()).rejects.toThrow('query failed');
        });
    });
});
