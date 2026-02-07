import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";

import { Activity } from "./activity.entity";
import { ActivityType } from "./activity.constants";
import { User } from "src/users/user.entity";
import { Post } from "src/posts/post.entity";
import { Follow } from "src/follows/follow.entity";

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

    /* ------------------------------ feeds ------------------------------ */

    async getProfileActivity(username: string, limit = 50) {
        const user = await this.userRepo.findOneBy({ username });
        if (!user) return [];

        return this.buildBaseActivityQuery()
            .andWhere("actor.id = :userId", { userId: user.id })
            .orderBy("a.createdAt", "DESC")
            .take(limit)
            .getMany();
    }

    async getHomeFeed(username: string, limit = 50) {
        const user = await this.userRepo.findOneBy({ username });
        if (!user) return [];

        return this.buildBaseActivityQuery()
            .leftJoin(
                Follow,
                "f",
                "f.followingId = actor.id AND f.followerId = :viewerId",
                { viewerId: user.id }
            )
            .where("actor.id = :viewerId OR f.id IS NOT NULL", {
                viewerId: user.id,
            })
            .orderBy("a.createdAt", "DESC")
            .take(limit)
            .getMany();
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
        });

        if (existing) {
            existing.active = shouldFollow;
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
}
