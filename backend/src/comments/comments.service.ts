import {
    Injectable,
    Logger,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';

@Injectable()
export class CommentsService {
    private readonly logger = new Logger(CommentsService.name);

    constructor(
        @InjectRepository(Comment)
        private readonly commentsRepo: Repository<Comment>,
    ) { }

    async getCommentsByPost(postId: number): Promise<Comment[]> {
        return this.commentsRepo.find({
            where: { postId },
            relations: ['user'],
            order: { createdAt: 'ASC' },
        });
    }

    async addComment(userId: number, postId: number, content: string): Promise<Comment> {
        try {
            const comment = await this.commentsRepo.manager.transaction(async (manager) => {
                const user = await manager.findOne(User, { where: { id: userId } });
                const post = await manager.findOne(Post, { where: { id: postId } });

                if (!user) throw new NotFoundException('User not found');
                if (!post) throw new NotFoundException('Post not found');

                return manager.save(Comment, {
                    content,
                    user,
                    userId,
                    post,
                    postId,
                });
            });

            this.logger.log(`Comment created by userId=${userId}, postId=${postId}, commentId=${comment.id}`);
            return comment;
        } catch (error) {
            this.logger.error(
                `addComment failed for userId=${userId}, postId=${postId}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }

    async deleteComment(commentId: number, userId: number): Promise<boolean> {
        try {
            await this.commentsRepo.manager.transaction(async (manager) => {
                const comment = await manager.findOne(Comment, {
                    where: { id: commentId },
                    relations: ['user'],
                });

                if (!comment) throw new NotFoundException('Comment not found');
                if (comment.user.id !== userId)
                    throw new ForbiddenException('You can only delete your own comment');

                await manager.remove(Comment, comment);
            });

            this.logger.log(
                `Comment deleted by userId=${userId}, commentId=${commentId}`,
            );
            return true;
        } catch (error) {
            this.logger.error(
                `deleteComment failed for userId=${userId}, commentId=${commentId}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }
}
