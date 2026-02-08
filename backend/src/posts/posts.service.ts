import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { User } from '../users/user.entity';
import { ActivityService } from 'src/activity/activity.service';
import { ACTIVITY_TYPE } from 'src/activity/activity.constants';
import { Like } from './like.entity';


@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postsRepo: Repository<Post>,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
        @InjectRepository(Like)
        private readonly likesRepo: Repository<Like>, // NEW
        private readonly activityService: ActivityService,
    ) { }

    async getFeed(): Promise<Post[]> {
        try {
            return await this.postsRepo.find({
                relations: ['user'],
                order: { createdAt: 'DESC' },
            });
        } catch {
            throw new InternalServerErrorException('Failed to load feed');
        }
    }

    async addPost(userId: number, content: string) {
        return this.postsRepo.manager.transaction(async manager => {
            const post = await manager.save(Post, {
                content,
                user: { id: userId },
            });

            await this.activityService.createActivity(
                {
                    type: ACTIVITY_TYPE.POST,
                    actor: { id: userId } as User,
                    targetPost: post,
                },
                manager, // 🔴 THIS is the missing piece
            );

            return post;
        });
    }


    async deletePost(postId: number, userId: number): Promise<boolean> {
        const post = await this.postsRepo.findOne({
            where: { id: postId },
            relations: ['user'],
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.user.id !== userId) {
            throw new ForbiddenException('You cannot delete this post');
        }
        // remove any activities that reference this post to avoid FK constraint errors
        await this.activityService.deleteActivitiesForPost(postId);

        await this.postsRepo.remove(post);
        return true;
    }

    async getPostsByUserId(userId: number): Promise<Post[]> {
        return this.postsRepo.find({
            where: { user: { id: userId } },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async getPostsByUsername(username: string): Promise<Post[]> {
        const user = await this.usersRepo.findOne({ where: { username } });
        if (!user) return [];
        return this.getPostsByUserId(user.id);
    }

    async getLikesInfo(postId: number, userId?: number) {
        const [count, liked] = await Promise.all([
            this.likesRepo.count({ where: { postId, active: true } }),
            userId
                ? this.likesRepo.findOne({ where: { postId, userId, active: true } })
                : Promise.resolve(null),
        ]);

        return {
            likesCount: count,
            likedByMe: !!liked,
        };
    }

    async toggleLike(userId: number, postId: number) {
        // 1️⃣ Find the user and post
        const user = await this.usersRepo.findOneBy({ id: userId });
        const post = await this.postsRepo.findOneBy({ id: postId });
        if (!user || !post) {
            throw new Error('User or Post not found');
        }

        // 2️⃣ Find existing like
        let like = await this.likesRepo.findOne({
            where: { userId, postId },
            order: { createdAt: 'DESC' },
        });

        let likedNow: boolean;

        if (like) {
            // Toggle active flag
            like.active = !like.active;
            likedNow = like.active;
            await this.likesRepo.save(like);
        } else {
            // Create new like
            like = await this.likesRepo.save({ user, userId, post, postId });
            likedNow = true;
        }

        // 3️⃣ Create or deactivate Activity
        if (likedNow) {
            await this.activityService.createActivity({
                type: ACTIVITY_TYPE.LIKE,
                actor: user,
                targetPost: post,
            });
        } else {
            await this.activityService.deactivateLikeActivity(userId, postId);

        }

        return likedNow;
    }

}
