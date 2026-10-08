import { CommentsResolver } from './comments.resolver';

describe('CommentsResolver', () => {
    const createCommentsService = () => ({
        findById: jest.fn(),
        addComment: jest.fn(),
        deleteComment: jest.fn(),
        getLikeMeta: jest.fn(),
        getUsersWhoLiked: jest.fn(),
        likeComment: jest.fn(),
        unlikeComment: jest.fn(),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('delegates query and mutation methods with expected arguments', async () => {
        const commentsService = createCommentsService();
        const resolver = new CommentsResolver(commentsService as any);

        await resolver.comment({ id: 5 } as any);
        await resolver.addComment({ id: 2 } as any, { postId: 10, content: 'hey' } as any);
        await resolver.deleteComment({ id: 2 } as any, { commentId: 9 } as any);
        await resolver.likeComment({ id: 2 } as any, { commentId: 9 } as any);
        await resolver.unlikeComment({ id: 2 } as any, { commentId: 9 } as any);

        expect(commentsService.findById).toHaveBeenCalledWith(5);
        expect(commentsService.addComment).toHaveBeenCalledWith(2, 10, 'hey');
        expect(commentsService.deleteComment).toHaveBeenCalledWith(9, 2);
        expect(commentsService.likeComment).toHaveBeenCalledWith(2, 9);
        expect(commentsService.unlikeComment).toHaveBeenCalledWith(2, 9);
    });

    it('returns likedByMe=false when context has no user', async () => {
        const commentsService = createCommentsService();
        const resolver = new CommentsResolver(commentsService as any);

        await expect(resolver.likedByMe({ id: 8 } as any, {} as any)).resolves.toBe(false);
        expect(commentsService.getLikeMeta).not.toHaveBeenCalled();
    });

    it('resolves like fields through service when context user exists', async () => {
        const commentsService = createCommentsService();
        commentsService.getLikeMeta
            .mockResolvedValueOnce({ likesCount: 4, likedByMe: false })
            .mockResolvedValueOnce({ likesCount: 4, likedByMe: true });
        commentsService.getUsersWhoLiked.mockResolvedValue([{ id: 4, username: 'bob' }]);

        const resolver = new CommentsResolver(commentsService as any);

        await expect(resolver.likesCount({ id: 8 } as any)).resolves.toBe(4);
        await expect(resolver.likedByMe({ id: 8 } as any, { req: { user: { id: 7 } } } as any)).resolves.toBe(true);
        await expect(resolver.likedUsers({ id: 8 } as any)).resolves.toEqual([{ id: 4, username: 'bob' }]);

        expect(commentsService.getLikeMeta).toHaveBeenNthCalledWith(1, 8);
        expect(commentsService.getLikeMeta).toHaveBeenNthCalledWith(2, 8, 7);
        expect(commentsService.getUsersWhoLiked).toHaveBeenCalledWith(8);
    });

    it('comment() forwards id and returns found comment', async () => {
        const commentsService = createCommentsService();
        commentsService.findById.mockResolvedValue({ id: 5, content: 'hello' });
        const resolver = new CommentsResolver(commentsService as any);

        await expect(resolver.comment({ id: 5 } as any)).resolves.toEqual({ id: 5, content: 'hello' });
        expect(commentsService.findById).toHaveBeenCalledWith(5);
    });

    it('addComment() forwards user id, post id, and content', async () => {
        const commentsService = createCommentsService();
        commentsService.addComment.mockResolvedValue({ id: 13 });
        const resolver = new CommentsResolver(commentsService as any);

        await expect(
            resolver.addComment({ id: 2 } as any, { postId: 10, content: 'hey' } as any),
        ).resolves.toEqual({ id: 13 });

        expect(commentsService.addComment).toHaveBeenCalledWith(2, 10, 'hey');
    });

    it('deleteComment() forwards comment id and user id', async () => {
        const commentsService = createCommentsService();
        commentsService.deleteComment.mockResolvedValue(true);
        const resolver = new CommentsResolver(commentsService as any);

        await expect(
            resolver.deleteComment({ id: 9 } as any, { commentId: 41 } as any),
        ).resolves.toBe(true);

        expect(commentsService.deleteComment).toHaveBeenCalledWith(41, 9);
    });

    it('likesCount() resolves from like metadata', async () => {
        const commentsService = createCommentsService();
        commentsService.getLikeMeta.mockResolvedValue({ likesCount: 12, likedByMe: false });
        const resolver = new CommentsResolver(commentsService as any);

        await expect(resolver.likesCount({ id: 8 } as any)).resolves.toBe(12);
        expect(commentsService.getLikeMeta).toHaveBeenCalledWith(8);
    });

    it('likedByMe returns false when context is undefined', async () => {
        const commentsService = createCommentsService();
        const resolver = new CommentsResolver(commentsService as any);

        await expect(resolver.likedByMe({ id: 8 } as any, undefined as any)).resolves.toBe(false);
        expect(commentsService.getLikeMeta).not.toHaveBeenCalled();
    });

    it('likedByMe returns false when req.user.id is missing', async () => {
        const commentsService = createCommentsService();
        const resolver = new CommentsResolver(commentsService as any);

        await expect(resolver.likedByMe({ id: 8 } as any, { req: { user: {} } } as any)).resolves.toBe(false);
        expect(commentsService.getLikeMeta).not.toHaveBeenCalled();
    });

    it('likeComment() forwards current user id and comment id', async () => {
        const commentsService = createCommentsService();
        commentsService.likeComment.mockResolvedValue(true);
        const resolver = new CommentsResolver(commentsService as any);

        await expect(resolver.likeComment({ id: 4 } as any, { commentId: 9 } as any)).resolves.toBe(true);
        expect(commentsService.likeComment).toHaveBeenCalledWith(4, 9);
    });

    it('unlikeComment() forwards current user id and comment id', async () => {
        const commentsService = createCommentsService();
        commentsService.unlikeComment.mockResolvedValue(true);
        const resolver = new CommentsResolver(commentsService as any);

        await expect(resolver.unlikeComment({ id: 4 } as any, { commentId: 9 } as any)).resolves.toBe(true);
        expect(commentsService.unlikeComment).toHaveBeenCalledWith(4, 9);
    });
});
