import { LikesService } from './likes.service';

describe('LikesService', () => {
    const createLikesRepo = () => ({
        count: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns like meta with likedByMe=false when userId is missing', async () => {
        const likesRepo = createLikesRepo();
        likesRepo.count.mockResolvedValue(5);

        const service = new LikesService(likesRepo as any);

        await expect(service.getLikeMeta('post', 10)).resolves.toEqual({
            likesCount: 5,
            likedByMe: false,
        });
        expect(likesRepo.findOne).not.toHaveBeenCalled();
    });

    it('returns like meta with likedByMe=true when active like exists for user', async () => {
        const likesRepo = createLikesRepo();
        likesRepo.count.mockResolvedValue(2);
        likesRepo.findOne.mockResolvedValue({ id: 42 });

        const service = new LikesService(likesRepo as any);

        await expect(service.getLikeMeta('comment', 7, 1)).resolves.toEqual({
            likesCount: 2,
            likedByMe: true,
        });
    });

    it('maps users from active likes only in getUsersWhoLiked', async () => {
        const likesRepo = createLikesRepo();
        likesRepo.find.mockResolvedValue([
            { user: { id: 1, username: 'alice' } },
            { user: { id: 2, username: 'bob' } },
        ]);

        const service = new LikesService(likesRepo as any);

        await expect(service.getUsersWhoLiked('post', 5)).resolves.toEqual([
            { id: 1, username: 'alice' },
            { id: 2, username: 'bob' },
        ]);
        expect(likesRepo.find).toHaveBeenCalledWith({
            where: { targetType: 'post', targetId: 5, active: true },
            relations: ['user'],
        });
    });

    it('returns changed=true from like when insert/update returns a row', async () => {
        const service = new LikesService(createLikesRepo() as any);
        const manager = {
            query: jest.fn().mockResolvedValue([{ changed: true }]),
        };

        await expect(service.like(1, 'post', 77, manager as any)).resolves.toEqual({ changed: true });
        expect(manager.query).toHaveBeenCalled();
    });

    it('returns changed=false from like when upsert is a no-op', async () => {
        const service = new LikesService(createLikesRepo() as any);
        const manager = {
            query: jest.fn().mockResolvedValue([]),
        };

        await expect(service.like(1, 'post', 77, manager as any)).resolves.toEqual({ changed: false });
    });

    it('returns changed based on affected rows in unlike', async () => {
        const service = new LikesService(createLikesRepo() as any);
        const update = jest.fn()
            .mockResolvedValueOnce({ affected: 1 })
            .mockResolvedValueOnce({ affected: 0 });
        const manager = {
            getRepository: jest.fn().mockReturnValue({ update, delete: jest.fn() }),
        };

        await expect(service.unlike(1, 'comment', 9, manager as any)).resolves.toEqual({ changed: true });
        await expect(service.unlike(1, 'comment', 9, manager as any)).resolves.toEqual({ changed: false });
    });

    it('deletes one target or many targets and skips empty arrays', async () => {
        const service = new LikesService(createLikesRepo() as any);
        const deleteMock = jest.fn().mockResolvedValue(undefined);
        const manager = {
            getRepository: jest.fn().mockReturnValue({ delete: deleteMock }),
        };

        await service.deleteLikes('post', 11, manager as any);
        await service.deleteLikes('post', [1, 2], manager as any);
        await service.deleteLikes('post', [], manager as any);

        expect(deleteMock).toHaveBeenCalledTimes(2);
        expect(deleteMock).toHaveBeenNthCalledWith(1, { targetType: 'post', targetId: 11 });
        expect(deleteMock).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                targetType: 'post',
                targetId: expect.anything(),
            }),
        );
    });
});
