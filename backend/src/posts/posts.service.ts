import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { User } from '../users/user.entity';
import { ActivityService } from 'src/activity/activity.service';
import { Like } from './like.entity';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postsRepo: Repository<Post>,

        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,

        @InjectRepository(Like)
        private readonly likesRepo: Repository<Like>,

        private readonly activityService: ActivityService,
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

        const likes = await this.likesRepo.find({
            where: { userId: user.id, active: true },
            relations: ['post', 'post.user'],
            order: { createdAt: 'DESC' },
        });

        return likes.map(l => l.post);
    }

    // ------------------------
    // POST CREATION (TRANSACTIONAL)
    // ------------------------

    async addPost(userId: number, content: string) {
        return this.postsRepo.manager.transaction(async manager => {
            const user = await manager.findOne(User, { where: { id: userId } });
            if (!user) throw new Error('User not found');

            const post = await manager.save(Post, { content, user });

            await this.activityService.logActivity(
                { type: 'post', actor: user, targetPost: post },
                manager,
            );

            return post;
        });
    }

    async deletePost(postId: number, userId: number): Promise<boolean> {
        const post = await this.postsRepo.findOne({
            where: { id: postId },
            relations: ['user'],
        });

        if (!post) throw new NotFoundException('Post not found');
        if (post.user.id !== userId)
            throw new ForbiddenException('Cannot delete');

        await this.activityService.deleteActivitiesForPost(postId);
        await this.postsRepo.remove(post);

        return true;
    }

    // ------------------------
    // LIKE META (CLEANED)
    // ------------------------

    async getLikeMeta(postId: number, userId?: number) {
        const likesCountPromise = this.likesRepo.count({
            where: { postId, active: true },
        });

        const likedByMePromise =
            userId !== undefined
                ? this.likesRepo.findOne({
                    where: { postId, userId, active: true },
                    select: { id: true },
                })
                : Promise.resolve(null);

        const [likesCount, liked] = await Promise.all([
            likesCountPromise,
            likedByMePromise,
        ]);

        return {
            likesCount,
            likedByMe: !!liked,
        };
    }

    async getUsersWhoLiked(postId: number) {
        const likes = await this.likesRepo.find({
            where: { postId, active: true },
            relations: ['user'],
        });

        return likes.map(l => l.user);
    }

    // ------------------------
    // EXPLICIT LIKE / UNLIKE (TRANSACTIONAL)
    // ------------------------

    async likePost(userId: number, postId: number): Promise<boolean> {
        return this.postsRepo.manager.transaction(async manager => {
            const user = await manager.findOne(User, { where: { id: userId } });
            const post = await manager.findOne(Post, { where: { id: postId } });

            if (!user || !post) throw new Error('User or post not found');

            let like = await manager.findOne(Like, {
                where: { userId, postId },
            });

            if (like?.active) return true;

            if (like) {
                like.active = true;
                await manager.save(like);
            } else {
                like = await manager.save(Like, {
                    user,
                    userId,
                    post,
                    postId,
                    active: true,
                });
            }

            await this.activityService.logActivity(
                {
                    type: 'like',
                    actor: user,
                    targetPost: post,
                    active: true,
                },
                manager,
            );

            return true;
        });
    }

    async unlikePost(userId: number, postId: number): Promise<boolean> {
        return this.postsRepo.manager.transaction(async manager => {
            const user = await manager.findOne(User, { where: { id: userId } });
            const post = await manager.findOne(Post, { where: { id: postId } });

            if (!user || !post) throw new Error('User or post not found');

            const like = await manager.findOne(Like, {
                where: { userId, postId },
            });

            if (!like || !like.active) return true;

            like.active = false;
            await manager.save(like);

            await this.activityService.logActivity(
                {
                    type: 'like',
                    actor: user,
                    targetPost: post,
                    active: false,
                },
                manager,
            );

            return true;
        });
    }
}
