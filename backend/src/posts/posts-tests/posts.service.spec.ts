import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from '../posts.service';
import { Post } from '../post.entity';
import { User } from '../../users/user.entity';
import { Like } from '../like.entity';
import { createEntityManagerMock } from '../../test-utils/typeorm.mocks';

describe('PostsService', () => {
    let service: PostsService;

    const postsRepo = {
        findOne: jest.fn(),
        find: jest.fn(),
        remove: jest.fn(),
        manager: {
            transaction: jest.fn(),
        },
    };

    const usersRepo = {
        findOne: jest.fn(),
    };

    const likesRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
        count: jest.fn(),
    };

    const activityService = {
        logActivity: jest.fn(),
        deleteActivitiesForPost: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PostsService(
            postsRepo as any,
            usersRepo as any,
            likesRepo as any,
            activityService as any,
        );
    });

    describe('findById', () => {
        it('returns post when found', async () => {
            const post = { id: 10, user: { id: 1 } } as Post;
            postsRepo.findOne.mockResolvedValue(post);

            await expect(service.findById(10)).resolves.toBe(post);
            expect(postsRepo.findOne).toHaveBeenCalledWith({
                where: { id: 10 },
                relations: ['user'],
            });
        });

        it('throws NotFoundException when missing', async () => {
            postsRepo.findOne.mockResolvedValue(null);

            await expect(service.findById(99)).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('getFeed', () => {
        it('returns feed ordered by createdAt desc with user relation', async () => {
            const feed = [{ id: 1 }, { id: 2 }] as Post[];
            postsRepo.find.mockResolvedValue(feed);

            await expect(service.getFeed()).resolves.toBe(feed);
            expect(postsRepo.find).toHaveBeenCalledWith({
                relations: ['user'],
                order: { createdAt: 'DESC' },
            });
        });
    });

    describe('getLikedPostsByUsername', () => {
        it('throws NotFoundException when user does not exist', async () => {
            usersRepo.findOne.mockResolvedValue(null);

            await expect(service.getLikedPostsByUsername('missing')).rejects.toBeInstanceOf(NotFoundException);
        });

        it('returns mapped liked posts for existing user', async () => {
            usersRepo.findOne.mockResolvedValue({ id: 10, username: 'deniz' } as User);
            likesRepo.find.mockResolvedValue([
                { post: { id: 100 } },
                { post: { id: 101 } },
            ]);

            await expect(service.getLikedPostsByUsername('deniz')).resolves.toEqual([
                { id: 100 },
                { id: 101 },
            ]);
            expect(likesRepo.find).toHaveBeenCalledWith({
                where: { userId: 10, active: true },
                relations: ['post', 'post.user'],
                order: { createdAt: 'DESC' },
            });
        });
    });

    describe('addPost', () => {
        it('creates a post and logs post activity', async () => {
            const manager = createEntityManagerMock();
            const user = { id: 1, username: 'deniz' } as User;
            const post = { id: 30, content: 'hello', user } as Post;

            manager.findOne.mockResolvedValue(user);
            manager.save.mockResolvedValue(post);
            postsRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.addPost(1, 'hello')).resolves.toBe(post);
            expect(manager.findOne).toHaveBeenCalledWith(User, { where: { id: 1 } });
            expect(manager.save).toHaveBeenCalledWith(Post, { content: 'hello', user });
            expect(activityService.logActivity).toHaveBeenCalledWith(
                { type: 'post', actor: user, targetPost: post },
                manager,
            );
        });

        it('throws when user does not exist', async () => {
            const manager = createEntityManagerMock();
            manager.findOne.mockResolvedValue(null);
            postsRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.addPost(9, 'x')).rejects.toThrow('User not found');
        });
    });

    describe('deletePost', () => {
        it('throws NotFoundException when post is missing', async () => {
            postsRepo.findOne.mockResolvedValue(null);

            await expect(service.deletePost(20, 1)).rejects.toBeInstanceOf(NotFoundException);
        });

        it('throws ForbiddenException when user is not owner', async () => {
            postsRepo.findOne.mockResolvedValue({ id: 20, user: { id: 2 } });

            await expect(service.deletePost(20, 1)).rejects.toBeInstanceOf(ForbiddenException);
            expect(activityService.deleteActivitiesForPost).not.toHaveBeenCalled();
        });

        it('deletes post and related activity for owner', async () => {
            const post = { id: 21, user: { id: 1 } };
            postsRepo.findOne.mockResolvedValue(post);
            activityService.deleteActivitiesForPost.mockResolvedValue(undefined);
            postsRepo.remove.mockResolvedValue(post);

            await expect(service.deletePost(21, 1)).resolves.toBe(true);
            expect(activityService.deleteActivitiesForPost).toHaveBeenCalledWith(21);
            expect(postsRepo.remove).toHaveBeenCalledWith(post);
        });
    });

    describe('getLikeMeta', () => {
        it('returns likes count and likedByMe=true when active like exists', async () => {
            likesRepo.count.mockResolvedValue(7);
            likesRepo.findOne.mockResolvedValue({ id: 1 } as Like);

            await expect(service.getLikeMeta(5, 3)).resolves.toEqual({
                likesCount: 7,
                likedByMe: true,
            });
            expect(likesRepo.count).toHaveBeenCalledWith({ where: { postId: 5, active: true } });
            expect(likesRepo.findOne).toHaveBeenCalledWith({
                where: { postId: 5, userId: 3, active: true },
                select: { id: true },
            });
        });

        it('returns likedByMe=false when userId is omitted', async () => {
            likesRepo.count.mockResolvedValue(2);

            await expect(service.getLikeMeta(5)).resolves.toEqual({
                likesCount: 2,
                likedByMe: false,
            });
            expect(likesRepo.findOne).not.toHaveBeenCalled();
        });
    });

    describe('getUsersWhoLiked', () => {
        it('returns users extracted from likes', async () => {
            likesRepo.find.mockResolvedValue([
                { user: { id: 1, username: 'u1' } },
                { user: { id: 2, username: 'u2' } },
            ]);

            await expect(service.getUsersWhoLiked(7)).resolves.toEqual([
                { id: 1, username: 'u1' },
                { id: 2, username: 'u2' },
            ]);
            expect(likesRepo.find).toHaveBeenCalledWith({
                where: { postId: 7, active: true },
                relations: ['user'],
            });
        });
    });

    describe('likePost', () => {
        it('throws when user or post does not exist', async () => {
            const manager = createEntityManagerMock();
            manager.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 2 } as Post);

            postsRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.likePost(1, 2)).rejects.toThrow('User or post not found');
        });

        it('returns true idempotently when like is already active', async () => {
            const manager = createEntityManagerMock();
            manager.findOne
                .mockResolvedValueOnce({ id: 1 } as User)
                .mockResolvedValueOnce({ id: 2 } as Post)
                .mockResolvedValueOnce({ id: 3, active: true } as Like);

            postsRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.likePost(1, 2)).resolves.toBe(true);
            expect(manager.save).not.toHaveBeenCalled();
            expect(activityService.logActivity).not.toHaveBeenCalled();
        });

        it('reactivates inactive like and logs activity', async () => {
            const manager = createEntityManagerMock();
            const user = { id: 1, username: 'deniz' } as User;
            const post = { id: 2 } as Post;
            const like = { id: 3, active: false } as Like;

            manager.findOne
                .mockResolvedValueOnce(user)
                .mockResolvedValueOnce(post)
                .mockResolvedValueOnce(like);
            manager.save.mockResolvedValue(like);
            postsRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.likePost(1, 2)).resolves.toBe(true);
            expect(like.active).toBe(true);
            expect(manager.save).toHaveBeenCalledWith(like);
            expect(activityService.logActivity).toHaveBeenCalledWith(
                {
                    type: 'like',
                    actor: user,
                    targetPost: post,
                    active: true,
                },
                manager,
            );
        });

        it('creates new like and logs activity when no row exists', async () => {
            const manager = createEntityManagerMock();
            const user = { id: 1, username: 'deniz' } as User;
            const post = { id: 2 } as Post;

            manager.findOne
                .mockResolvedValueOnce(user)
                .mockResolvedValueOnce(post)
                .mockResolvedValueOnce(null);
            manager.save.mockResolvedValue({ id: 20, active: true } as Like);
            postsRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.likePost(1, 2)).resolves.toBe(true);
            expect(manager.save).toHaveBeenCalledWith(Like, {
                user,
                userId: 1,
                post,
                postId: 2,
                active: true,
            });
            expect(activityService.logActivity).toHaveBeenCalled();
        });
    });

    describe('unlikePost', () => {
        it('throws when user or post does not exist', async () => {
            const manager = createEntityManagerMock();
            manager.findOne
                .mockResolvedValueOnce({ id: 1 } as User)
                .mockResolvedValueOnce(null);
            postsRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.unlikePost(1, 2)).rejects.toThrow('User or post not found');
        });

        it('returns true idempotently when like does not exist', async () => {
            const manager = createEntityManagerMock();
            manager.findOne
                .mockResolvedValueOnce({ id: 1 } as User)
                .mockResolvedValueOnce({ id: 2 } as Post)
                .mockResolvedValueOnce(null);
            postsRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.unlikePost(1, 2)).resolves.toBe(true);
            expect(manager.save).not.toHaveBeenCalled();
            expect(activityService.logActivity).not.toHaveBeenCalled();
        });

        it('returns true idempotently when like already inactive', async () => {
            const manager = createEntityManagerMock();
            manager.findOne
                .mockResolvedValueOnce({ id: 1 } as User)
                .mockResolvedValueOnce({ id: 2 } as Post)
                .mockResolvedValueOnce({ id: 3, active: false } as Like);
            postsRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.unlikePost(1, 2)).resolves.toBe(true);
            expect(manager.save).not.toHaveBeenCalled();
            expect(activityService.logActivity).not.toHaveBeenCalled();
        });

        it('deactivates like and logs activity when active like exists', async () => {
            const manager = createEntityManagerMock();
            const user = { id: 1, username: 'deniz' } as User;
            const post = { id: 2 } as Post;
            const like = { id: 3, active: true } as Like;

            manager.findOne
                .mockResolvedValueOnce(user)
                .mockResolvedValueOnce(post)
                .mockResolvedValueOnce(like);
            manager.save.mockResolvedValue(like);
            postsRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));

            await expect(service.unlikePost(1, 2)).resolves.toBe(true);
            expect(like.active).toBe(false);
            expect(manager.save).toHaveBeenCalledWith(like);
            expect(activityService.logActivity).toHaveBeenCalledWith(
                {
                    type: 'like',
                    actor: user,
                    targetPost: post,
                    active: false,
                },
                manager,
            );
        });
    });
});
