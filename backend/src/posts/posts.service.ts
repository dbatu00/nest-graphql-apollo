// Posts business logic for feed, post CRUD, and likes.
import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Post } from './post.entity';
import { User } from '../users/user.entity';
import { ActivityService } from 'src/activity/activity.service';
import { LIKE_TYPE } from 'src/likes/likes.constants';
import { LikesService } from 'src/likes/likes.service';

@Injectable()
export class PostsService {
    private readonly logger = new Logger(PostsService.name);

    constructor(
        @InjectRepository(Post)
        private readonly postsRepo: Repository<Post>,

        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,

        private readonly activityService: ActivityService,

        private readonly likesService: LikesService,
    ) { }

    // ------------------------
    // BASIC QUERIES
    // ------------------------

    async findById(id: number): Promise<Post> {
        const post = await this.postsRepo.findOne({
            where: { id },
            relations: ['user'],
        });

        if (!post) throw new NotFoundException('Post not found');
        return post;
    }

    async getFeed(): Promise<Post[]> {
        return this.postsRepo.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async getLikedPostsByUsername(username: string): Promise<Post[]> {
        const user = await this.usersRepo.findOne({ where: { username } });
        if (!user) throw new NotFoundException('User not found');

        const likes = await this.likesService.getActiveLikesByUser(
            user.id,
            LIKE_TYPE.POST,
        );

        if (likes.length === 0) return [];

        const postIds = likes.map((like) => like.targetId);

        const posts = await this.postsRepo.find({
            where: { id: In(postIds) },
            relations: ['user'],
        });

        const postsById = new Map(posts.map((post) => [post.id, post]));
        return postIds
            .map((postId) => postsById.get(postId))
            .filter((post): post is Post => !!post);
    }

    // ------------------------
    // POST CREATION (TRANSACTIONAL)
    // ------------------------
    async addPost(userId: number, content: string) {
        try {
            const post = await this.postsRepo.manager.transaction(async manager => {
                const user = await manager.findOne(User, { where: { id: userId } });
                if (!user) throw new NotFoundException('User not found');

                const post = await manager.save(Post, { content, user });

                await this.activityService.logActivity(
                    { type: 'post', actor: user, targetPost: post },
                    manager,
                );

                return post;
            });

            this.logger.log(`Post created by userId=${userId}, postId=${post.id}`);
            return post;
        } catch (error) {
            this.logger.error(`addPost failed for userId=${userId}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }

    async deletePost(postId: number, userId: number): Promise<boolean> {
        try {
            const post = await this.postsRepo.findOne({
                where: { id: postId },
                relations: ['user'],
            });

            if (!post) throw new NotFoundException('Post not found');
            if (post.user.id !== userId)
                throw new ForbiddenException('Cannot delete');

            await this.activityService.deleteActivitiesForPost(postId);
            await this.postsRepo.remove(post);

            this.logger.log(`Post deleted by userId=${userId}, postId=${postId}`);
            return true;
        } catch (error) {
            this.logger.error(`deletePost failed for userId=${userId}, postId=${postId}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }

    // ------------------------
    // LIKE META (CLEANED)
    // ------------------------

    async getLikeMeta(postId: number, userId?: number) {
        return this.likesService.getLikeMeta(LIKE_TYPE.POST, postId, userId);
    }

    async getUsersWhoLiked(postId: number) {
        return this.likesService.getUsersWhoLiked(LIKE_TYPE.POST, postId);
    }

    // ------------------------
    // EXPLICIT LIKE / UNLIKE (TRANSACTIONAL)
    // ------------------------

    async likePost(userId: number, postId: number): Promise<boolean> {
        try {
            return await this.postsRepo.manager.transaction(async manager => {
                const user = await manager.findOne(User, { where: { id: userId } });
                const post = await manager.findOne(Post, { where: { id: postId } });

                if (!user) throw new NotFoundException('User not found');
                if (!post) throw new NotFoundException('Post not found');

                const { changed } = await this.likesService.like(
                    userId,
                    LIKE_TYPE.POST,
                    postId,
                    manager,
                );

                // Idempotent like: if already active, return success without extra writes.
                if (!changed) return true;

                await this.activityService.logActivity(
                    {
                        type: 'like',
                        actor: user,
                        targetPost: post,
                        active: true,
                    },
                    manager,
                );

                this.logger.log(`Post liked by userId=${userId}, postId=${postId}`);
                return true;
            });
        } catch (error) {
            this.logger.error(`likePost failed for userId=${userId}, postId=${postId}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }

    async unlikePost(userId: number, postId: number): Promise<boolean> {
        try {
            return await this.postsRepo.manager.transaction(async manager => {
                const user = await manager.findOne(User, { where: { id: userId } });
                const post = await manager.findOne(Post, { where: { id: postId } });

                if (!user) throw new NotFoundException('User not found');
                if (!post) throw new NotFoundException('Post not found');

                const { changed } = await this.likesService.unlike(
                    userId,
                    LIKE_TYPE.POST,
                    postId,
                    manager,
                );

                // Idempotent unlike: if no active row exists, return success.
                if (!changed) return true;

                await this.activityService.logActivity(
                    {
                        type: 'like',
                        actor: user,
                        targetPost: post,
                        active: false,
                    },
                    manager,
                );

                this.logger.log(`Post unliked by userId=${userId}, postId=${postId}`);
                return true;
            });
        } catch (error) {
            this.logger.error(`unlikePost failed for userId=${userId}, postId=${postId}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }
}
