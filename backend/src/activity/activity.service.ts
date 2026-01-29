import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Post } from "src/posts/post.entity";
import { Repository } from "typeorm";
import { Activity } from "./activity.entity";
import { User } from "src/users/user.entity";
import { Follow } from "src/follows/follow.entity";
Follow

@Injectable()
export class ActivityService {
    constructor(
        @InjectRepository(Activity)
        private readonly activityRepo: Repository<Activity>,
        @InjectRepository(Post)
        private readonly postRepo: Repository<Post>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>
    ) { }

    async createActivity(input: {
        type: "post" | "like" | "share" | "follow";
        actor: User;
        targetPost?: Post;
        targetUser?: User;
        active?: boolean;
    }) {
        return this.activityRepo.save({
            type: input.type,
            actor: input.actor,
            actorId: input.actor.id,                  // ✅
            targetPost: input.targetPost,
            targetPostId: input.targetPost?.id,       // ✅
            targetUser: input.targetUser,
            targetUserId: input.targetUser?.id,       // ✅
            active: input.active ?? true,
        });
    }

    async getProfileActivity(username: string, limit = 50) {
        const user = await this.userRepo.findOneBy({ username });
        if (!user) return [];

        return this.activityRepo
            .createQueryBuilder("a")
            .innerJoinAndSelect("a.actor", "actor")
            .leftJoinAndSelect("a.targetPost", "targetPost")
            .leftJoinAndSelect("a.targetUser", "targetUser")
            .where("actor.id = :userId", { userId: user.id })
            .andWhere("a.active = true")
            .orderBy("a.createdAt", "DESC")
            .take(limit)
            .getMany();
    }

    // FEED: get recent activities of a user + people they follow
    async getUserFeed(username: string, limit = 50) {
        const user = await this.userRepo.findOneBy({ username });
        if (!user) return [];

        return this.activityRepo
            .createQueryBuilder("a")
            .innerJoinAndSelect("a.actor", "actor") // ✅ MUST be select
            .leftJoin(
                Follow,
                "f",
                "f.followingId = actor.id AND f.followerId = :viewerId",
                { viewerId: user.id }
            )
            .leftJoinAndSelect("a.targetPost", "targetPost")
            .leftJoinAndSelect("a.targetUser", "targetUser")
            .where(
                "actor.id = :viewerId OR f.id IS NOT NULL",
                { viewerId: user.id }
            )
            .andWhere("a.active = true")
            .orderBy("a.createdAt", "DESC")
            .take(limit)
            .getMany();
    }



    // LIKE
    async toggleLike(userId: number, postId: number, shouldLike: boolean) {
        const existing = await this.activityRepo.findOne({
            where: { actor: { id: userId }, targetPost: { id: postId }, type: "like" },
        });

        if (existing) {
            existing.active = shouldLike;
            await this.activityRepo.save(existing);
            return true;
        }

        if (shouldLike) {
            const post = await this.postRepo.findOneBy({ id: postId });
            if (!post) return false;

            await this.activityRepo.save({ actor: { id: userId }, targetPost: post, type: "like", active: true });
        }

        return true;
    }

    // FOLLOW
    async toggleFollow(userId: number, targetUsername: string, shouldFollow: boolean) {
        const targetUser = await this.userRepo.findOneBy({ username: targetUsername });
        if (!targetUser || targetUser.id === userId) return false;

        const existing = await this.activityRepo.findOne({
            where: { actor: { id: userId }, targetUserId: targetUser.id, type: "follow" },
        });

        if (existing) {
            existing.active = shouldFollow;
            await this.activityRepo.save(existing);
            return true;
        }

        if (shouldFollow) {
            await this.activityRepo.save({ actor: { id: userId }, targetUserId: targetUser.id, type: "follow", active: true });
        }

        return true;
    }

    // SHARE
    async share(userId: number, postId: number) {
        const post = await this.postRepo.findOneBy({ id: postId });
        if (!post) return false;

        await this.activityRepo.save({ actor: { id: userId }, targetPost: post, type: "share", active: true });
        return true;
    }
}
