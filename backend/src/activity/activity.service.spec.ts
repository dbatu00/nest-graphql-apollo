import { ActivityService } from './activity.service';

describe('ActivityService', () => {
    it('builds the feed query with filters and limit', async () => {
        const leftJoinAndSelect = jest.fn().mockReturnThis();
        const where = jest.fn().mockReturnThis();
        const andWhere = jest.fn().mockReturnThis();
        const orderBy = jest.fn().mockReturnThis();
        const take = jest.fn().mockReturnThis();
        const getMany = jest.fn().mockResolvedValue([{ id: 4 }]);

        const repo = {
            createQueryBuilder: jest.fn().mockReturnValue({
                leftJoinAndSelect,
                where,
                andWhere,
                orderBy,
                take,
                getMany,
            }),
        } as any;

        const service = new ActivityService(repo);
        const result = await service.getActivityFeed('deniz', ['post'], 25);

        expect(result).toEqual([{ id: 4 }]);
        expect(where).toHaveBeenCalledWith('(a.type != :followType OR a.active = true)', { followType: 'follow' });
        expect(andWhere).toHaveBeenCalledWith('(a.type != :likeType OR (a.active = true AND a.targetCommentId IS NULL))', { likeType: 'like' });
        expect(andWhere).toHaveBeenCalledWith('a.type IN (:...types)', { types: ['post'] });
        expect(andWhere).toHaveBeenCalledWith('actor.username = :username', { username: 'deniz' });
        expect(take).toHaveBeenCalledWith(25);
    });

    it('validates like targets before writing a like activity', async () => {
        const repo = {
            query: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
        } as any;

        const service = new ActivityService(repo);

        await expect(
            service.logActivity(
                {
                    type: 'like',
                    actor: { id: 1 } as any,
                } as any,
                { getRepository: jest.fn().mockReturnValue(repo) } as any,
            ),
        ).rejects.toThrow('Like activity requires a target post or comment');
    });
});
