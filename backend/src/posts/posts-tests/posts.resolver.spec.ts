import { PostsResolver } from '../posts.resolver';

describe('PostsResolver', () => {
    const postsService = {
        getFeed: jest.fn(),
        getLikedPostsByUsername: jest.fn(),
        findById: jest.fn(),
        addPost: jest.fn(),
        deletePost: jest.fn(),
        getLikeMeta: jest.fn(),
        getUsersWhoLiked: jest.fn(),
        likePost: jest.fn(),
        unlikePost: jest.fn(),
    };

    let resolver: PostsResolver;

    beforeEach(() => {
        jest.clearAllMocks();
        resolver = new PostsResolver(postsService as any);
    });

    it('posts delegates to getFeed', async () => {
        const feed = [{ id: 1 }];
        postsService.getFeed.mockResolvedValue(feed);

        await expect(resolver.posts()).resolves.toBe(feed as any);
        expect(postsService.getFeed).toHaveBeenCalled();
    });

    it('posts propagates service errors', async () => {
        postsService.getFeed.mockRejectedValue(new Error('feed failed'));

        await expect(resolver.posts()).rejects.toThrow('feed failed');
    });

    it('likedPosts delegates with username', async () => {
        postsService.getLikedPostsByUsername.mockResolvedValue([{ id: 3 }]);

        await expect(resolver.likedPosts('deniz')).resolves.toEqual([{ id: 3 }]);
        expect(postsService.getLikedPostsByUsername).toHaveBeenCalledWith('deniz');
    });

    it('likedPosts propagates service errors', async () => {
        postsService.getLikedPostsByUsername.mockRejectedValue(new Error('liked failed'));

        await expect(resolver.likedPosts('deniz')).rejects.toThrow('liked failed');
    });

    it('post delegates with id', async () => {
        const post = { id: 5 };
        postsService.findById.mockResolvedValue(post);

        await expect(resolver.post(5)).resolves.toBe(post as any);
        expect(postsService.findById).toHaveBeenCalledWith(5);
    });

    it('post propagates service errors', async () => {
        postsService.findById.mockRejectedValue(new Error('post failed'));

        await expect(resolver.post(5)).rejects.toThrow('post failed');
    });

    it('addPost uses current user id', async () => {
        const created = { id: 9 };
        postsService.addPost.mockResolvedValue(created);

        await expect(resolver.addPost({ id: 1 } as any, 'hello')).resolves.toBe(created as any);
        expect(postsService.addPost).toHaveBeenCalledWith(1, 'hello');
    });

    it('deletePost uses postId and current user id', async () => {
        postsService.deletePost.mockResolvedValue(true);

        await expect(resolver.deletePost({ id: 2 } as any, 10)).resolves.toBe(true);
        expect(postsService.deletePost).toHaveBeenCalledWith(10, 2);
    });

    it('likesCount resolves from like meta', async () => {
        postsService.getLikeMeta.mockResolvedValue({ likesCount: 11, likedByMe: false });

        await expect(resolver.likesCount({ id: 77 } as any)).resolves.toBe(11);
        expect(postsService.getLikeMeta).toHaveBeenCalledWith(77);
    });

    it('likedByMe returns false when context has no user', async () => {
        await expect(resolver.likedByMe({ id: 77 } as any, {})).resolves.toBe(false);
        expect(postsService.getLikeMeta).not.toHaveBeenCalled();
    });

    it('likedByMe returns false when context user id is missing', async () => {
        await expect(resolver.likedByMe({ id: 77 } as any, { req: { user: {} } })).resolves.toBe(false);
        expect(postsService.getLikeMeta).not.toHaveBeenCalled();
    });

    it('likedByMe resolves from like meta when context has user', async () => {
        postsService.getLikeMeta.mockResolvedValue({ likesCount: 1, likedByMe: true });

        await expect(resolver.likedByMe({ id: 77 } as any, { req: { user: { id: 5 } } })).resolves.toBe(true);
        expect(postsService.getLikeMeta).toHaveBeenCalledWith(77, 5);
    });

    it('likedByMe propagates service errors', async () => {
        postsService.getLikeMeta.mockRejectedValue(new Error('meta failed'));

        await expect(resolver.likedByMe({ id: 77 } as any, { req: { user: { id: 5 } } })).rejects.toThrow('meta failed');
    });

    it('likedUsers delegates by post id', async () => {
        const users = [{ id: 1 }, { id: 2 }];
        postsService.getUsersWhoLiked.mockResolvedValue(users);

        await expect(resolver.likedUsers({ id: 42 } as any)).resolves.toBe(users as any);
        expect(postsService.getUsersWhoLiked).toHaveBeenCalledWith(42);
    });

    it('likedUsers propagates service errors', async () => {
        postsService.getUsersWhoLiked.mockRejectedValue(new Error('users failed'));

        await expect(resolver.likedUsers({ id: 42 } as any)).rejects.toThrow('users failed');
    });

    it('likePost uses current user id', async () => {
        postsService.likePost.mockResolvedValue(true);

        await expect(resolver.likePost({ id: 3 } as any, 88)).resolves.toBe(true);
        expect(postsService.likePost).toHaveBeenCalledWith(3, 88);
    });

    it('likePost propagates service errors', async () => {
        postsService.likePost.mockRejectedValue(new Error('like failed'));

        await expect(resolver.likePost({ id: 3 } as any, 88)).rejects.toThrow('like failed');
    });

    it('unlikePost uses current user id', async () => {
        postsService.unlikePost.mockResolvedValue(true);

        await expect(resolver.unlikePost({ id: 3 } as any, 88)).resolves.toBe(true);
        expect(postsService.unlikePost).toHaveBeenCalledWith(3, 88);
    });

    it('unlikePost propagates service errors', async () => {
        postsService.unlikePost.mockRejectedValue(new Error('unlike failed'));

        await expect(resolver.unlikePost({ id: 3 } as any, 88)).rejects.toThrow('unlike failed');
    });
});
