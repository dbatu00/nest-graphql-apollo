// Activity business logic for feed reads and event writes.
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";

import { Activity } from "./activity.entity";
import { ActivityType } from "./activity.constants";
import { User } from "src/users/user.entity";
import { Post } from "src/posts/post.entity";


@Injectable()
export class ActivityService {
    private readonly logger = new Logger(ActivityService.name);

    constructor(
        @InjectRepository(Activity) private readonly activityRepo: Repository<Activity>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) { }

    /**
     * Unified event logging: creates or updates activity records.
     * Handles deduplication for likes/follows (reactivates if exists).
     * Posts are always inserted (no reuse).
     */
    async logActivity(
        input: {
            type: ActivityType;
            actor: User;
            targetPost?: Post;
            targetUser?: User;
            active?: boolean;
        },
        manager?: EntityManager,
    ) {
        try {
            const repo = manager ? manager.getRepository(Activity) : this.activityRepo;
            const active = input.active ?? true;

            if (input.type === 'like' && input.targetPost) {
                // Reuse prior like row for the same actor/post pair and only flip active/time.
                const existing = await repo.findOne({
                    where: {
                        actorId: input.actor.id,
                        targetPostId: input.targetPost.id,
                        type: 'like',
                    },
                });
                if (existing) {
                    existing.active = active;
                    existing.createdAt = new Date();
                    return repo.save(existing);
                }
            }

            if (input.type === 'follow' && input.targetUser) {
                // Reuse prior follow row for the same actor/target pair and only flip active/time.
                const existing = await repo.findOne({
                    where: {
                        actorId: input.actor.id,
                        targetUserId: input.targetUser.id,
                        type: 'follow',
                    },
                });
                if (existing) {
                    existing.active = active;
                    existing.createdAt = new Date();
                    return repo.save(existing);
                }
            }

            return repo.save({
                type: input.type,
                actor: input.actor,
                actorId: input.actor.id,
                targetPost: input.targetPost,
                targetPostId: input.targetPost?.id,
                targetUser: input.targetUser,
                targetUserId: input.targetUser?.id,
                active,
            });
        } catch (error) {
            this.logger.error(`logActivity failed: type=${input.type}, actorId=${input.actor.id}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }

    async deleteActivitiesForPost(postId: number) {
        try {
            await this.activityRepo.delete({ targetPostId: postId });
        } catch (error) {
            this.logger.error(`deleteActivitiesForPost failed: postId=${postId}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }

    async getActivityFeed(username?: string, types?: string[], limit = 50) {
        try {
            const qb = this.activityRepo
                .createQueryBuilder('a')
                .leftJoinAndSelect('a.actor', 'actor')
                .leftJoinAndSelect('a.targetPost', 'targetPost')
                .leftJoinAndSelect('targetPost.user', 'targetPostUser')
                .leftJoinAndSelect('a.targetUser', 'targetUser')
                // Follow/like feed entries are only shown when currently active.
                .where('(a.type != :followType OR a.active = true)', { followType: 'follow' })
                .andWhere('(a.type != :likeType OR a.active = true)', { likeType: 'like' })
                .orderBy('a.createdAt', 'DESC')
                .take(limit);

            if (types && types.length > 0) {
                qb.andWhere('a.type IN (:...types)', { types });
            }

            if (username) {
                const user = await this.userRepo.findOneBy({ username });
                if (!user) return [];
                qb.andWhere('a.actor.id = :userId', { userId: user.id });
            }

            return qb.getMany();
        } catch (error) {
            this.logger.error(`getActivityFeed failed: username=${username ?? 'all'}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }
}

