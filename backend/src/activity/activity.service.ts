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

    async createActivity(
        input: { type: ActivityType; actor: User; targetPost?: Post; targetUser?: User; active?: boolean },
        manager?: EntityManager,
    ) {
        const repo = manager ? manager.getRepository(Activity) : this.activityRepo;

        // prevent duplicates for likes/follows
        if (input.type === 'like' && input.targetPost) {
            let exists = await repo.findOne({
                where: { actorId: input.actor.id, targetPostId: input.targetPost.id, type: 'like' },
            });
            if (exists) {
                exists.active = input.active ?? true;  // reactivate
                exists.createdAt = new Date();         // optional: show as recent
                return repo.save(exists);
            }
        }

        if (input.type === 'follow' && input.targetUser) {
            const exists = await repo.findOne({
                where: { actorId: input.actor.id, targetUserId: input.targetUser.id, type: 'follow' },
            });
            if (exists) {
                exists.active = input.active ?? true;
                exists.createdAt = new Date();
                return repo.save(exists);
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
            active: input.active ?? true,
        });
    }

    async deactivateLikeActivity(actorId: number, postId: number) {
        const activity = await this.activityRepo.findOne({
            where: { actorId, targetPostId: postId, type: 'like', active: true },
        });
        if (activity) {
            activity.active = false;
            await this.activityRepo.save(activity);
        }
    }

    async deactivateFollowActivity(actorId: number, targetUserId: number) {
        const activity = await this.activityRepo.findOne({
            where: { actorId, targetUserId, type: 'follow', active: true },
        });
        if (activity) {
            activity.active = false;
            await this.activityRepo.save(activity);
        }
    }

    async deleteActivitiesForPost(postId: number) {
        await this.activityRepo.delete({ targetPostId: postId });
    }

    async toggleFollow(userId: number, targetUsername: string, shouldFollow: boolean) {
        const actor = await this.userRepo.findOneBy({ id: userId });
        const targetUser = await this.userRepo.findOneBy({ username: targetUsername });
        if (!actor || !targetUser || actor.id === targetUser.id) return false;

        const existing = await this.activityRepo.findOne({
            where: { actorId: actor.id, targetUserId: targetUser.id, type: 'follow' },
        });
        if (existing) {
            existing.active = shouldFollow;
            if (shouldFollow) existing.createdAt = new Date();
            await this.activityRepo.save(existing);
            return true;
        }

        if (shouldFollow) {
            await this.createActivity({ type: 'follow', actor, targetUser });
        }
        return true;
    }

    async getActivityFeed(username?: string, limit = 50) {
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


        if (username) {
            const user = await this.userRepo.findOneBy({ username });
            if (!user) return [];
            qb.andWhere('a.actor.id = :userId', { userId: user.id });
        }

        return qb.getMany();
    }
}

