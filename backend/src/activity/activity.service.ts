import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";

import { Activity } from "./activity.entity";
import { ACTIVITY_TYPE, ActivityType } from "./activity.constants";
import { User } from "src/users/user.entity";
import { Post } from "src/posts/post.entity";


@Injectable()
export class ActivityService {
    constructor(
        @InjectRepository(Activity) private readonly activityRepo: Repository<Activity>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Post) private readonly postRepo: Repository<Post>,
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
        const repo = manager ? manager.getRepository(Activity) : this.activityRepo;
        const active = input.active ?? true;

        // For likes: check if exists, update active flag if so
        if (input.type === 'like' && input.targetPost) {
            const existing = await repo.findOne({
                where: {
                    actorId: input.actor.id,
                    targetPostId: input.targetPost.id,
                    type: 'like',
                },
            });
            if (existing) {
                existing.active = active;
                existing.createdAt = new Date(); // show as recent if reactivated
                return repo.save(existing);
            }
        }

        // For follows: check if exists, update active flag if so
        if (input.type === 'follow' && input.targetUser) {
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

        // For posts or new likes/follows: create new entry
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
    }

    async deleteActivitiesForPost(postId: number) {
        await this.activityRepo.delete({ targetPostId: postId });
    }

    async getActivityFeed(username?: string, types?: string[], limit = 50) {
        const qb = this.activityRepo
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.actor', 'actor')
            .leftJoinAndSelect('a.targetPost', 'targetPost')
            .leftJoinAndSelect('targetPost.user', 'targetPostUser')
            .leftJoinAndSelect('a.targetUser', 'targetUser')
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
    }
}

