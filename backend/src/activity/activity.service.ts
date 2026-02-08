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
        @InjectRepository(Activity)
        private readonly activityRepo: Repository<Activity>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Post)
        private readonly postRepo: Repository<Post>,
    ) { }

    /* ----------------------------- helpers ----------------------------- */

    private buildBaseActivityQuery() {
        return this.activityRepo
            .createQueryBuilder("a")
            .innerJoinAndSelect("a.actor", "actor")
            .leftJoinAndSelect("a.targetPost", "targetPost")
            .leftJoinAndSelect("targetPost.user", "targetPostUser")
            .leftJoinAndSelect("a.targetUser", "targetUser")
            .where("a.active = true");
    }

    async createActivity(
        input: {
            type: ActivityType;
            actor: User;
            targetPost?: Post;
            targetUser?: User;
            active?: boolean;
        },
        manager?: EntityManager,
    ) {
        const repo = manager
            ? manager.getRepository(Activity)
            : this.activityRepo;

        return repo.save({
            type: input.type,
            actor: input.actor,
            actorId: input.actor.id,
            targetPost: input.targetPost,
            targetPostId: input.targetPost?.id,
            targetUser: input.targetUser,
            targetUserId: input.targetUser?.id,
            active: input.active ?? true,
        });
    }

    /* ----------------------------- follow ------------------------------ */

    async deactivateFollowActivity(actorId: number, targetUserId: number) {
        const activity = await this.activityRepo.findOne({
            where: {
                actorId,
                targetUserId,
                type: 'follow',
                active: true,
            },
        });

        if (activity) {
            activity.active = false;
            await this.activityRepo.save(activity);
        }
    }


    /* ------------------------------ feeds ------------------------------ */

    /**
     * Get activity feed (Twitter pattern).
     * If username is provided, return activities from that user (profile feed).
     * If username is not provided, return home feed (own + followed users' activities).
     */
    async getActivityFeed(username?: string, limit = 50) {
        const qb = this.activityRepo
            .createQueryBuilder("a")
            .leftJoinAndSelect("a.actor", "actor")
            .leftJoinAndSelect("a.targetPost", "targetPost")
            .leftJoinAndSelect("targetPost.user", "targetPostUser")
            .leftJoinAndSelect("a.targetUser", "targetUser")
            .where("(a.type != 'follow' OR a.active = true)")
            .orderBy("a.createdAt", "DESC")
            .take(limit);

        // Profile feed: filter by specific user
        if (username) {
            const user = await this.userRepo.findOneBy({ username });
            if (!user) return [];
            qb.andWhere("a.actor.id = :userId", { userId: user.id });
        }

        return qb.getMany();
    }

    // Backward-compat aliases
    async getProfileActivity(username: string, limit = 50) {
        return this.getActivityFeed(username, limit);
    }

    async getHomeFeed(limit = 50) {
        return this.getActivityFeed(undefined, limit);
    }



    /* ----------------------------- follow ------------------------------ */

    async toggleFollow(
        userId: number,
        targetUsername: string,
        shouldFollow: boolean,
    ) {
        const actor = await this.userRepo.findOneBy({ id: userId });
        const targetUser = await this.userRepo.findOneBy({
            username: targetUsername,
        });

        if (!actor || !targetUser || actor.id === targetUser.id) {
            return false;
        }

        const existing = await this.activityRepo.findOne({
            where: {
                actorId: actor.id,
                targetUserId: targetUser.id,
                type: "follow",
            },
            order: { createdAt: "DESC" }, // get latest one
        });

        if (existing) {
            existing.active = shouldFollow;
            // if re-activating a follow, bump its createdAt so it appears as most-recent
            if (shouldFollow) {
                existing.createdAt = new Date();
            }
            await this.activityRepo.save(existing);
            return true;
        }

        if (shouldFollow) {
            await this.createActivity({
                type: "follow",
                actor,
                targetUser,
            });
        }


        return true;
    }

    /**
     * Hard-delete any activities that reference the given post.
     * Used when removing a post to avoid foreign key constraint errors.
     */
    async deleteActivitiesForPost(postId: number) {
        await this.activityRepo.delete({ targetPostId: postId });
    }

    async deactivateLikeActivity(actorId: number, postId: number) {
        const activity = await this.activityRepo.findOne({
            where: { actorId, targetPostId: postId, type: ACTIVITY_TYPE.LIKE, active: true },
        });

        if (activity) {
            activity.active = false;
            await this.activityRepo.save(activity);
        }
    }

}
