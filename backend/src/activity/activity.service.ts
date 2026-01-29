import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Post } from "src/posts/post.entity";
import { Repository } from "typeorm";
import { Activity } from "./activity.entity";
import { User } from "src/users/user.entity";


@Injectable()
export class ActivityService {
    constructor(
        @InjectRepository(Activity)
        private readonly activityRepo: Repository<Activity>,
        @InjectRepository(Post)
        private readonly postRepo: Repository<Post>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    // FEED: get recent activities of a user + people they follow
    async getUserFeed(username: string, limit = 50) {
        const user = await this.userRepo.findOneBy({ username });
        if (!user) return [];

        // fetch own + followed users' activities
        return this.activityRepo
            .createQueryBuilder("a")
            .leftJoinAndSelect("a.actor", "actor")
            .leftJoinAndSelect("a.targetPost", "targetPost")
            .where("a.actorId = :userId OR a.actorId IN (SELECT followingId FROM follows WHERE followerId = :userId)", { userId: user.id })
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
