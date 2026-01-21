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

    async addPost(userId: number, content: string): Promise<Post> {
        const user = await this.usersRepo.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const post = this.postsRepo.create({ content, user });

        try {
            return await this.postsRepo.save(post);
        } catch {
            throw new InternalServerErrorException('Failed to create post');
        }
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
}
