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
import { LIKE_TYPE } from '../likes/likes.constants';
import { LikesService } from '../likes/likes.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class CommentsService {
    private readonly logger = new Logger(CommentsService.name);

    constructor(
        @InjectRepository(Comment)
        private readonly commentsRepo: Repository<Comment>,
        private readonly likesService: LikesService,
        private readonly activityService: ActivityService,
    ) { }

    async findById(id: number): Promise<Comment> {
        const comment = await this.commentsRepo.findOne({
            where: { id },
            relations: ['user'],
        });

        if (!comment) throw new NotFoundException('Comment not found');
        return comment;
    }

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

                const comment = await manager.save(Comment, {
                    content,
                    user,
                    userId,
                    post,
                    postId,
                });

                // Log activity for comment creation
                await this.activityService.logActivity(
                    {
                        type: 'comment',
                        actor: user,
                        targetPost: post,
                        targetComment: comment,
                    },
                    manager,
                );

                return comment;
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

    async getLikeMeta(commentId: number, userId?: number) {
        return this.likesService.getLikeMeta(LIKE_TYPE.COMMENT, commentId, userId);
    }

    async getUsersWhoLiked(commentId: number) {
        return this.likesService.getUsersWhoLiked(LIKE_TYPE.COMMENT, commentId);
    }

    async likeComment(userId: number, commentId: number): Promise<boolean> {
        try {
            return await this.commentsRepo.manager.transaction(async manager => {
                const user = await manager.findOne(User, { where: { id: userId } });
                const comment = await manager.findOne(Comment, { where: { id: commentId } });

                if (!user) throw new NotFoundException('User not found');
                if (!comment) throw new NotFoundException('Comment not found');

                const { changed } = await this.likesService.like(
                    userId,
                    LIKE_TYPE.COMMENT,
                    commentId,
                    manager,
                );

                // Idempotent like: if already active, return success without extra writes.
                if (!changed) return true;

                this.logger.log(`Comment liked by userId=${userId}, commentId=${commentId}`);
                return true;
            });
        } catch (error) {
            this.logger.error(
                `likeComment failed for userId=${userId}, commentId=${commentId}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }

    async unlikeComment(userId: number, commentId: number): Promise<boolean> {
        try {
            return await this.commentsRepo.manager.transaction(async manager => {
                const user = await manager.findOne(User, { where: { id: userId } });
                const comment = await manager.findOne(Comment, { where: { id: commentId } });

                if (!user) throw new NotFoundException('User not found');
                if (!comment) throw new NotFoundException('Comment not found');

                const { changed } = await this.likesService.unlike(
                    userId,
                    LIKE_TYPE.COMMENT,
                    commentId,
                    manager,
                );

                // Idempotent unlike: if no active row exists, return success.
                if (!changed) return true;

                this.logger.log(`Comment unliked by userId=${userId}, commentId=${commentId}`);
                return true;
            });
        } catch (error) {
            this.logger.error(
                `unlikeComment failed for userId=${userId}, commentId=${commentId}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }
}
