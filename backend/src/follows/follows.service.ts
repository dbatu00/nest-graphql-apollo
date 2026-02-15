import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Follow } from "./follow.entity";
import { User } from "../users/user.entity";
import { ActivityService } from "src/activity/activity.service";

@Injectable()
export class FollowsService {
    constructor(
        @InjectRepository(Follow)
        private readonly followRepo: Repository<Follow>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly activityService: ActivityService,
    ) { }

    // =========================
    // FOLLOW (IDEMPOTENT + TX)
    // =========================

    async follow(followerId: number, username: string): Promise<boolean> {
        return this.followRepo.manager.transaction(async manager => {
            const follower = await manager.findOne(User, {
                where: { id: followerId },
            });

            const following = await manager.findOne(User, {
                where: { username },
            });

            if (!follower || !following) return false;
            if (follower.id === following.id) return false;

            const existing = await manager.findOne(Follow, {
                where: {
                    follower: { id: follower.id },
                    following: { id: following.id },
                },
            });

            // Already following → idempotent success
            if (existing) return true;

            try {
                await manager.save(Follow, {
                    follower,
                    following,
                });
            } catch (err: any) {
                const code = err?.code ?? err?.driverError?.code;
                if (code === "23505") {
                    return true;
                }
                throw err;
            }

            await this.activityService.logActivity(
                {
                    type: "follow",
                    actor: follower,
                    targetUser: following,
                    active: true,
                },
                manager,
            );

            return true;
        });
    }

    // =========================
    // UNFOLLOW (IDEMPOTENT + TX)
    // =========================

    async unfollow(followerId: number, username: string): Promise<boolean> {
        return this.followRepo.manager.transaction(async manager => {
            const follower = await manager.findOne(User, {
                where: { id: followerId },
            });

            const following = await manager.findOne(User, {
                where: { username },
            });

            if (!follower || !following) return false;

            const existing = await manager.findOne(Follow, {
                where: {
                    follower: { id: follower.id },
                    following: { id: following.id },
                },
            });

            // Already not following → idempotent success
            if (!existing) return true;

            await manager.remove(existing);

            await this.activityService.logActivity(
                {
                    type: "follow",
                    actor: follower,
                    targetUser: following,
                    active: false,
                },
                manager,
            );

            return true;
        });
    }

    // =========================
    // BASIC LISTS
    // =========================

    async getFollowers(username: string) {
        return this.followRepo.find({
            where: { following: { username } },
            relations: ["follower"],
        });
    }

    async getFollowing(username: string) {
        return this.followRepo.find({
            where: { follower: { username } },
            relations: ["following"],
        });
    }

    // ==================================================
    // FOLLOWERS TAB (WITH followedByMe FOR VIEWER)
    // ==================================================

    async getFollowersWithFollowState(
        profileUsername: string,
        viewerId: number,
    ) {
        const qb = this.userRepo
            .createQueryBuilder("u")
            .innerJoin(Follow, "f", "f.followerId = u.id")
            .innerJoin("users", "profile", "profile.id = f.followingId")
            .leftJoin(
                Follow,
                "f2",
                "f2.followerId = :viewerId AND f2.followingId = u.id",
                { viewerId },
            )
            .where("profile.username = :profileUsername", { profileUsername })
            .select([
                "u.id",
                "u.username",
                "u.displayName",
            ])
            .addSelect(
                "CASE WHEN f2.id IS NULL THEN false ELSE true END",
                "followedByMe",
            );

        return qb.getRawAndEntities();
    }

    // ==================================================
    // FOLLOWING TAB (WITH followedByMe FOR VIEWER)
    // ==================================================

    async getFollowingWithFollowState(
        profileUsername: string,
        viewerId: number,
    ) {
        const qb = this.userRepo
            .createQueryBuilder("u")
            .innerJoin(Follow, "f", "f.followingId = u.id")
            .innerJoin("users", "profile", "profile.id = f.followerId")
            .leftJoin(
                Follow,
                "f2",
                "f2.followerId = :viewerId AND f2.followingId = u.id",
                { viewerId },
            )
            .where("profile.username = :profileUsername", { profileUsername })
            .select([
                "u.id",
                "u.username",
                "u.displayName",
            ])
            .addSelect(
                "CASE WHEN f2.id IS NULL THEN false ELSE true END",
                "followedByMe",
            );

        return qb.getRawAndEntities();
    }
}
