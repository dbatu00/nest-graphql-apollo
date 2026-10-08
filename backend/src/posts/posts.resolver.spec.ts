import { PostsResolver } from './posts.resolver';

describe('PostsResolver', () => {
    const createPostsService = () => ({
        getFeed: jest.fn(),
        getLikedPostsByUsername: jest.fn(),
        findById: jest.fn(),
        addPost: jest.fn(),
        deletePost: jest.fn(),
        getLikeMeta: jest.fn(),
        getUsersWhoLiked: jest.fn(),
        likePost: jest.fn(),
        unlikePost: jest.fn(),
    });

    const createCommentsService = () => ({
        getCommentsByPost: jest.fn(),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('delegates root queries and mutations with expected args', async () => {
        const postsService = createPostsService();
        const commentsService = createCommentsService();
        const resolver = new PostsResolver(postsService as any, commentsService as any);

        await resolver.posts();
        await resolver.likedPosts({ username: 'alice' } as any);
        await resolver.post({ id: 10 } as any);
        await resolver.addPost({ id: 2 } as any, { content: 'hello' } as any);
        await resolver.deletePost({ id: 2 } as any, { postId: 10 } as any);
        await resolver.likePost({ id: 2 } as any, { postId: 10 } as any);
        await resolver.unlikePost({ id: 2 } as any, { postId: 10 } as any);

        expect(postsService.getFeed).toHaveBeenCalled();
        expect(postsService.getLikedPostsByUsername).toHaveBeenCalledWith('alice');
        expect(postsService.findById).toHaveBeenCalledWith(10);
        expect(postsService.addPost).toHaveBeenCalledWith(2, 'hello');
        expect(postsService.deletePost).toHaveBeenCalledWith(10, 2);
        expect(postsService.likePost).toHaveBeenCalledWith(2, 10);
        expect(postsService.unlikePost).toHaveBeenCalledWith(2, 10);
    });

    it('resolves likedByMe as false when request user is missing', async () => {
        const postsService = createPostsService();
        const resolver = new PostsResolver(postsService as any, createCommentsService() as any);

        await expect(resolver.likedByMe({ id: 11 } as any, {} as any)).resolves.toBe(false);
        expect(postsService.getLikeMeta).not.toHaveBeenCalled();
    });

    it('resolves likesCount/likedByMe/likedUsers/comments through services', async () => {
        const postsService = createPostsService();
        const commentsService = createCommentsService();
        postsService.getLikeMeta
            .mockResolvedValueOnce({ likesCount: 3, likedByMe: false })
            .mockResolvedValueOnce({ likesCount: 3, likedByMe: true });
        postsService.getUsersWhoLiked.mockResolvedValue([{ id: 1, username: 'alice' }]);
        commentsService.getCommentsByPost.mockResolvedValue([{ id: 9, content: 'c' }]);

        const resolver = new PostsResolver(postsService as any, commentsService as any);

        await expect(resolver.likesCount({ id: 11 } as any)).resolves.toBe(3);
        await expect(resolver.likedByMe({ id: 11 } as any, { req: { user: { id: 7 } } } as any)).resolves.toBe(true);
        await expect(resolver.likedUsers({ id: 11 } as any)).resolves.toEqual([{ id: 1, username: 'alice' }]);
        await expect(resolver.comments({ id: 11 } as any)).resolves.toEqual([{ id: 9, content: 'c' }]);

        expect(postsService.getLikeMeta).toHaveBeenNthCalledWith(1, 11);
        expect(postsService.getLikeMeta).toHaveBeenNthCalledWith(2, 11, 7);
        expect(postsService.getUsersWhoLiked).toHaveBeenCalledWith(11);
        expect(commentsService.getCommentsByPost).toHaveBeenCalledWith(11);
    });

    it('posts() returns value from postsService.getFeed', async () => {
        const postsService = createPostsService();
        postsService.getFeed.mockResolvedValue([{ id: 1 }]);
        const resolver = new PostsResolver(postsService as any, createCommentsService() as any);

        await expect(resolver.posts()).resolves.toEqual([{ id: 1 }]);
    });

    it('likedPosts() forwards username and returns liked posts', async () => {
        const postsService = createPostsService();
        postsService.getLikedPostsByUsername.mockResolvedValue([{ id: 12 }]);
        const resolver = new PostsResolver(postsService as any, createCommentsService() as any);

        await expect(resolver.likedPosts({ username: 'alice' } as any)).resolves.toEqual([{ id: 12 }]);
        expect(postsService.getLikedPostsByUsername).toHaveBeenCalledWith('alice');
    });

    it('post() forwards id and returns found post', async () => {
        const postsService = createPostsService();
        postsService.findById.mockResolvedValue({ id: 10 });
        const resolver = new PostsResolver(postsService as any, createCommentsService() as any);

        await expect(resolver.post({ id: 10 } as any)).resolves.toEqual({ id: 10 });
        expect(postsService.findById).toHaveBeenCalledWith(10);
    });

    it('addPost() forwards current user id and content', async () => {
        const postsService = createPostsService();
        postsService.addPost.mockResolvedValue({ id: 21, content: 'hello' });
        const resolver = new PostsResolver(postsService as any, createCommentsService() as any);

        await expect(resolver.addPost({ id: 7 } as any, { content: 'hello' } as any)).resolves.toEqual({
            id: 21,
            content: 'hello',
        });
        expect(postsService.addPost).toHaveBeenCalledWith(7, 'hello');
    });

    it('deletePost() forwards postId and user.id', async () => {
        const postsService = createPostsService();
        postsService.deletePost.mockResolvedValue(true);
        const resolver = new PostsResolver(postsService as any, createCommentsService() as any);

        await expect(resolver.deletePost({ id: 7 } as any, { postId: 99 } as any)).resolves.toBe(true);
        expect(postsService.deletePost).toHaveBeenCalledWith(99, 7);
    });

    it('likedByMe returns false when req.user.id is undefined', async () => {
        const postsService = createPostsService();
        const resolver = new PostsResolver(postsService as any, createCommentsService() as any);

        await expect(resolver.likedByMe({ id: 11 } as any, { req: { user: {} } } as any)).resolves.toBe(false);
        expect(postsService.getLikeMeta).not.toHaveBeenCalled();
    });

    it('likePost() forwards user id and post id', async () => {
        const postsService = createPostsService();
        postsService.likePost.mockResolvedValue(true);
        const resolver = new PostsResolver(postsService as any, createCommentsService() as any);

        await expect(resolver.likePost({ id: 5 } as any, { postId: 44 } as any)).resolves.toBe(true);
        expect(postsService.likePost).toHaveBeenCalledWith(5, 44);
    });

    it('unlikePost() forwards user id and post id', async () => {
        const postsService = createPostsService();
        postsService.unlikePost.mockResolvedValue(true);
        const resolver = new PostsResolver(postsService as any, createCommentsService() as any);

        await expect(resolver.unlikePost({ id: 5 } as any, { postId: 44 } as any)).resolves.toBe(true);
        expect(postsService.unlikePost).toHaveBeenCalledWith(5, 44);
    });
});
