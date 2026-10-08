import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { CommentsService } from './comments.service';
import { COMMENT_CONTENT_MAX_LENGTH } from 'src/common/validation/input-limits';
import { lockEntityByIdOrThrow } from 'src/common/row-lock';

jest.mock('src/common/row-lock', () => ({
    lockEntityByIdOrThrow: jest.fn(),
}));

describe('CommentsService', () => {
    const createCommentsRepo = () => {
        const manager = {
            transaction: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            exists: jest.fn(),
        };

        manager.transaction.mockImplementation(async (cb: (m: any) => Promise<unknown>) => cb(manager));

        return {
            findOne: jest.fn(),
            find: jest.fn(),
            manager,
        };
    };

    const createLikesService = () => ({
        deleteLikes: jest.fn(),
        getLikeMeta: jest.fn(),
        getUsersWhoLiked: jest.fn(),
        like: jest.fn(),
        unlike: jest.fn(),
    });

    const createActivityService = () => ({
        logActivity: jest.fn(),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('throws NotFoundException when findById does not find a comment', async () => {
        const commentsRepo = createCommentsRepo();
        commentsRepo.findOne.mockResolvedValue(null);

        const service = new CommentsService(
            commentsRepo as any,
            createLikesService() as any,
            createActivityService() as any,
        );

        await expect(service.findById(404)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('queries comments by post in ascending creation order with user relation', async () => {
        const commentsRepo = createCommentsRepo();
        commentsRepo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);

        const service = new CommentsService(
            commentsRepo as any,
            createLikesService() as any,
            createActivityService() as any,
        );

        await expect(service.getCommentsByPost(77)).resolves.toEqual([{ id: 1 }, { id: 2 }]);
        expect(commentsRepo.find).toHaveBeenCalledWith({
            where: { postId: 77 },
            relations: ['user'],
            order: { createdAt: 'ASC' },
        });
    });

    it('rejects addComment when content is blank', async () => {
        const commentsRepo = createCommentsRepo();

        const service = new CommentsService(
            commentsRepo as any,
            createLikesService() as any,
            createActivityService() as any,
        );

        await expect(service.addComment(1, 7, '    ')).rejects.toBeInstanceOf(BadRequestException);
        expect(commentsRepo.manager.transaction).not.toHaveBeenCalled();
    });

    it('rejects addComment when content exceeds max length', async () => {
        const commentsRepo = createCommentsRepo();

        const service = new CommentsService(
            commentsRepo as any,
            createLikesService() as any,
            createActivityService() as any,
        );

        await expect(
            service.addComment(1, 7, 'a'.repeat(COMMENT_CONTENT_MAX_LENGTH + 1)),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(commentsRepo.manager.transaction).not.toHaveBeenCalled();
    });

    it('adds comment with trimmed content and logs comment activity', async () => {
        const commentsRepo = createCommentsRepo();
        const likesService = createLikesService();
        const activityService = createActivityService();

        const user = { id: 1, username: 'alice' };
        const post = { id: 7 };
        const comment = { id: 12, content: 'hello', userId: 1, postId: 7 };

        commentsRepo.manager.findOne
            .mockResolvedValueOnce(user)
            .mockResolvedValueOnce(post);
        commentsRepo.manager.save.mockResolvedValue(comment);

        const service = new CommentsService(
            commentsRepo as any,
            likesService as any,
            activityService as any,
        );

        const result = await service.addComment(1, 7, '  hello  ');

        expect(commentsRepo.manager.save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            content: 'hello',
            user,
            post,
            userId: 1,
            postId: 7,
        }));
        expect(activityService.logActivity).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'comment',
                actor: user,
                targetPost: post,
                targetComment: comment,
            }),
            commentsRepo.manager,
        );
        expect(result).toEqual(comment);
    });

    it('throws ForbiddenException when deleting another user comment', async () => {
        const commentsRepo = createCommentsRepo();
        const likesService = createLikesService();

        (lockEntityByIdOrThrow as jest.Mock).mockResolvedValue({
            id: 9,
            user: { id: 2 },
        });

        const service = new CommentsService(
            commentsRepo as any,
            likesService as any,
            createActivityService() as any,
        );

        await expect(service.deleteComment(9, 1)).rejects.toBeInstanceOf(ForbiddenException);
        expect(likesService.deleteLikes).not.toHaveBeenCalled();
    });

    it('deletes likes and comment for own comment', async () => {
        const commentsRepo = createCommentsRepo();
        const likesService = createLikesService();

        const lockedComment = { id: 9, user: { id: 1 } };
        (lockEntityByIdOrThrow as jest.Mock).mockResolvedValue(lockedComment);

        const service = new CommentsService(
            commentsRepo as any,
            likesService as any,
            createActivityService() as any,
        );

        await expect(service.deleteComment(9, 1)).resolves.toBe(true);
        expect(likesService.deleteLikes).toHaveBeenCalledWith('comment', 9, commentsRepo.manager);
        expect(commentsRepo.manager.remove).toHaveBeenCalledWith(expect.anything(), lockedComment);
    });

    it('delegates like metadata and liked users lookup to likes service', async () => {
        const commentsRepo = createCommentsRepo();
        const likesService = createLikesService();
        likesService.getLikeMeta.mockResolvedValue({ likedByMe: false, likesCount: 2 });
        likesService.getUsersWhoLiked.mockResolvedValue([{ id: 4, username: 'bob' }]);

        const service = new CommentsService(
            commentsRepo as any,
            likesService as any,
            createActivityService() as any,
        );

        await expect(service.getLikeMeta(5, 1)).resolves.toEqual({ likedByMe: false, likesCount: 2 });
        await expect(service.getUsersWhoLiked(5)).resolves.toEqual([{ id: 4, username: 'bob' }]);

        expect(likesService.getLikeMeta).toHaveBeenCalledWith('comment', 5, 1);
        expect(likesService.getUsersWhoLiked).toHaveBeenCalledWith('comment', 5);
    });
});
