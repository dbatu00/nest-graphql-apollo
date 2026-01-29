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
import { Activity } from 'src/activity/activity.entity';


@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postsRepo: Repository<Post>,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
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

            await manager.save(Activity, {
                type: "post",
                actor: { id: userId },
                actorId: userId,              // ✅ REQUIRED
                targetPost: post,
                targetPostId: post.id,        // ✅ REQUIRED
                active: true,
            });

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
        const user = await this.usersRepo.findOne({
            where: { username },
        });

        if (!user) return [];

        return this.getPostsByUserId(user.id);
    }


}
