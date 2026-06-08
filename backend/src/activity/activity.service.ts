// Activity business logic for feed reads and event writes.
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";

import { Activity } from "./activity.entity";
import { ActivityType } from "./activity.constants";
import { User } from "src/users/user.entity";
import { Post } from "src/posts/post.entity";
import { Comment } from "../comments/comment.entity";


@Injectable()
export class ActivityService {
    private readonly logger = new Logger(ActivityService.name);

    constructor(
        @InjectRepository(Activity) private readonly activityRepo: Repository<Activity>,
    ) { }

    /**
     * Unified event logging: creates or updates activity records.
     * Likes/follows use upsert for atomic deduplication. Posts always insert.
        * Note: upsert paths return entity instances mapped from RETURNING rows
        * and are not relation-hydrated (actor/target* relations are not loaded).
     */
    async logActivity(
        input: {
            type: ActivityType;
            actor: User;
            targetPost?: Post;
            targetUser?: User;
            targetComment?: Comment;
            shouldBeActive?: boolean;
        },
        manager?: EntityManager,
    ) {
        if (manager) {
            // Use provided transaction.
            return this._executeLogActivity(manager.getRepository(Activity), input);
        }

        return this._executeLogActivity(this.activityRepo, input);
    }

    private async _executeLogActivity(
        repo: Repository<Activity>,
        input: {
            type: ActivityType;
            actor: User;
            targetPost?: Post;
            targetUser?: User;
            targetComment?: Comment;
            shouldBeActive?: boolean;
        },
    ) {
        try {
            const active = input.shouldBeActive !== undefined ? input.shouldBeActive : true;

            if (input.type === 'like') {
                // Upsert: insert or update atomically based on dedup key.
                // Comment-like: (actorId, targetCommentId)
                // Post-like: (actorId, targetPostId, targetCommentId IS NULL)
                if (input.targetComment) {
                    const [row] = await repo.query(
                        `INSERT INTO "activity" ("type", "actorId", "targetCommentId", "createdAt", "updatedAt", "active")
                         VALUES ($1, $2, $3, NOW(), NOW(), $4)
                         ON CONFLICT ("actorId", "targetCommentId")
                         WHERE "type" = 'like'
                         DO UPDATE SET "active" = EXCLUDED."active", "updatedAt" = NOW()
                         RETURNING *`,
                        ['like', input.actor.id, input.targetComment.id, active],
                    );
                    return repo.create(row);
                }

                if (input.targetPost) {
                    const [row] = await repo.query(
                        `INSERT INTO "activity" ("type", "actorId", "targetPostId", "targetCommentId", "createdAt", "updatedAt", "active")
                         VALUES ($1, $2, $3, NULL, NOW(), NOW(), $4)
                         ON CONFLICT ("actorId", "targetPostId")
                         WHERE "type" = 'like' AND "targetCommentId" IS NULL
                         DO UPDATE SET "active" = EXCLUDED."active", "updatedAt" = NOW()
                         RETURNING *`,
                        ['like', input.actor.id, input.targetPost.id, active],
                    );
                    return repo.create(row);
                }
            }

            if (input.type === 'follow' && input.targetUser) {
                // Upsert: insert or update atomically.
                // Conflict on: (actorId, targetUserId, type='follow')
                const [row] = await repo.query(
                    `INSERT INTO "activity" ("type", "actorId", "targetUserId", "createdAt", "updatedAt", "active")
                     VALUES ($1, $2, $3, NOW(), NOW(), $4)
                     ON CONFLICT ("actorId", "targetUserId")
                     WHERE "type" = 'follow'
                     DO UPDATE SET "active" = EXCLUDED."active", "updatedAt" = NOW()
                     RETURNING *`,
                    ['follow', input.actor.id, input.targetUser.id, active],
                );
                return repo.create(row);
            }

            // Posts always insert (no upsert).
            return repo.save({
                type: input.type,
                actor: input.actor,
                actorId: input.actor.id,
                targetPost: input.targetPost,
                targetPostId: input.targetPost?.id,
                targetUser: input.targetUser,
                targetUserId: input.targetUser?.id,
                targetComment: input.targetComment,
                targetCommentId: input.targetComment?.id,
                active,
            });
        } catch (error) {
            this.logger.error(`logActivity failed: type=${input.type}, actorId=${input.actor.id}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }

    //comment-likes are not shown in feed so they are not read here
    async getActivityFeed(username?: string, types?: ActivityType[], limit = 50) {
        try {
            const safeLimit = Math.min(Math.max(limit, 1), 100);
            const qb = this.activityRepo
                .createQueryBuilder('a')
                .leftJoinAndSelect('a.actor', 'actor')
                .leftJoinAndSelect('a.targetPost', 'targetPost')
                .leftJoinAndSelect('targetPost.user', 'targetPostUser')
                .leftJoinAndSelect('a.targetUser', 'targetUser')
                // Follow entries are only shown when currently active.
                .where('(a.type != :followType OR a.active = true)', { followType: 'follow' })
                // Like entries are only shown when currently active and only for post likes (not comment likes).
                .andWhere('(a.type != :likeType OR (a.active = true AND a.targetCommentId IS NULL))', { likeType: 'like' })
                .orderBy('a.updatedAt', 'DESC')
                .take(safeLimit);

            if (types && types.length > 0) {
                qb.andWhere('a.type IN (:...types)', { types });
            }

            if (username) {
                qb.andWhere('actor.username = :username', { username });
            }

            return qb.getMany();
        } catch (error) {
            this.logger.error(`getActivityFeed failed: username=${username ?? 'all'}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }
}

