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
        @InjectRepository(Post) private readonly postsRepo: Repository<Post>,
        @InjectRepository(User) private readonly usersRepo: Repository<User>,
        @InjectRepository(Like) private readonly likesRepo: Repository<Like>,
        private readonly activityService: ActivityService,
    ) { }


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
    async addPost(userId: number, content: string) {
        return this.postsRepo.manager.transaction(async manager => {
            // 1️⃣ fetch full user
            const user = await manager.findOne(User, { where: { id: userId } });
            if (!user) throw new Error('User not found');

            // 2️⃣ create post with actual entity
            const post = await manager.save(Post, {
                content,
                user,
            });

            // 3️⃣ create activity with proper actor entity
            await this.activityService.createActivity(
                { type: 'post', actor: user, targetPost: post },
                manager,
            );

            return post;
        });
    }

    async deletePost(postId: number, userId: number): Promise<boolean> {
        const post = await this.postsRepo.findOne({ where: { id: postId }, relations: ['user'] });
        if (!post) throw new NotFoundException('Post not found');
        if (post.user.id !== userId) throw new ForbiddenException('Cannot delete');

        await this.activityService.deleteActivitiesForPost(postId);
        await this.postsRepo.remove(post);
        return true;
    }

    async getLikesInfo(postId: number, userId?: number) {
        const [count, liked] = await Promise.all([
            this.likesRepo.count({ where: { postId, active: true } }),
            userId ? this.likesRepo.findOne({ where: { postId, userId, active: true } }) : null,
        ]);

        return { likesCount: count, likedByMe: !!liked };
    }

    async getUsersWhoLiked(postId: number) {
        const likes = await this.likesRepo.find({
            where: { postId, active: true },
            relations: ['user'],
        });

        return likes.map(like => like.user);
    }

    async toggleLike(userId: number, postId: number) {
        const user = await this.usersRepo.findOneBy({ id: userId });
        const post = await this.postsRepo.findOneBy({ id: postId });
        if (!user || !post) throw new Error('User or post not found');

        let like = await this.likesRepo.findOne({ where: { userId, postId } });
        let likedNow: boolean;

        if (like) {
            like.active = !like.active;
            likedNow = like.active;
            await this.likesRepo.save(like);
        } else {
            like = await this.likesRepo.save({ user, userId, post, postId });
            likedNow = true;
        }

        // prevent duplicate like activities
        if (likedNow) {
            await this.activityService.createActivity({
                type: 'like',
                actor: user,
                targetPost: post,
                active: true, // ensure it's active
            });
        } else {
            await this.activityService.deactivateLikeActivity(user.id, postId);
        }


        return likedNow;
    }

    async getLikedPostsByUsername(username: string): Promise<Post[]> {
        const user = await this.usersRepo.findOne({
            where: { username },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const likes = await this.likesRepo.find({
            where: {
                userId: user.id,
                active: true,
            },
            relations: ['post', 'post.user'],
            order: {
                createdAt: 'DESC',
            },
        });

        return likes.map(like => like.post);
    }

}
