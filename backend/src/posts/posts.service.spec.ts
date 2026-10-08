import { NotFoundException } from '@nestjs/common';

import { PostsService } from './posts.service';

describe('PostsService', () => {
    const createPostsRepo = () => ({
        findOne: jest.fn(),
        find: jest.fn(),
        manager: { transaction: jest.fn() },
    });

    const createUsersRepo = () => ({
        findOne: jest.fn(),
    });

    const createActivityService = () => ({
        logActivity: jest.fn(),
    });

    const createLikesService = () => ({
        getActiveLikesByUser: jest.fn(),
        getLikeMeta: jest.fn(),
        getUsersWhoLiked: jest.fn(),
        like: jest.fn(),
        unlike: jest.fn(),
        deleteLikes: jest.fn(),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('throws when getting liked posts for an unknown user', async () => {
        const postsRepo = createPostsRepo();
        const usersRepo = createUsersRepo();
        const likesService = createLikesService();
        usersRepo.findOne.mockResolvedValue(null);

        const service = new PostsService(
            postsRepo as any,
            usersRepo as any,
            createActivityService() as any,
            likesService as any,
        );

        await expect(service.getLikedPostsByUsername('ghost')).rejects.toBeInstanceOf(NotFoundException);
        expect(likesService.getActiveLikesByUser).not.toHaveBeenCalled();
    });

    it('returns empty array when user has no active post likes', async () => {
        const postsRepo = createPostsRepo();
        const usersRepo = createUsersRepo();
        const likesService = createLikesService();
        usersRepo.findOne.mockResolvedValue({ id: 3, username: 'alice' });
        likesService.getActiveLikesByUser.mockResolvedValue([]);

        const service = new PostsService(
            postsRepo as any,
            usersRepo as any,
            createActivityService() as any,
            likesService as any,
        );

        await expect(service.getLikedPostsByUsername('alice')).resolves.toEqual([]);
        expect(postsRepo.find).not.toHaveBeenCalled();
    });

    it('returns liked posts in like-order and filters missing rows', async () => {
        const postsRepo = createPostsRepo();
        const usersRepo = createUsersRepo();
        const likesService = createLikesService();

        usersRepo.findOne.mockResolvedValue({ id: 3, username: 'alice' });
        likesService.getActiveLikesByUser.mockResolvedValue([
            { targetId: 10 },
            { targetId: 99 },
            { targetId: 11 },
        ]);
        postsRepo.find.mockResolvedValue([
            { id: 11, content: 'second' },
            { id: 10, content: 'first' },
        ]);

        const service = new PostsService(
            postsRepo as any,
            usersRepo as any,
            createActivityService() as any,
            likesService as any,
        );

        const result = await service.getLikedPostsByUsername('alice');

        expect(result.map((post: any) => post.id)).toEqual([10, 11]);
    });

    it('throws NotFoundException when findById misses', async () => {
        const postsRepo = createPostsRepo();
        const usersRepo = createUsersRepo();
        const likesService = createLikesService();

        postsRepo.findOne.mockResolvedValue(null);

        const service = new PostsService(
            postsRepo as any,
            usersRepo as any,
            createActivityService() as any,
            likesService as any,
        );

        await expect(service.findById(404)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('delegates getLikeMeta to likes service with post type', async () => {
        const postsRepo = createPostsRepo();
        const usersRepo = createUsersRepo();
        const likesService = createLikesService();
        likesService.getLikeMeta.mockResolvedValue({ likedByMe: true, likesCount: 4 });

        const service = new PostsService(
            postsRepo as any,
            usersRepo as any,
            createActivityService() as any,
            likesService as any,
        );

        await expect(service.getLikeMeta(7, 1)).resolves.toEqual({ likedByMe: true, likesCount: 4 });
        expect(likesService.getLikeMeta).toHaveBeenCalledWith('post', 7, 1);
    });
});
