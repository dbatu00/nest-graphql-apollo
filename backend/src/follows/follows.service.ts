import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Follow } from "./follow.entity";
import { User } from "../users/user.entity";
import { ActivityService } from "src/activity/activity.service";
import { ACTIVITY_TYPE } from "src/activity/activity.constants";

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
    // FOLLOW / UNFOLLOW (STATE)
    // =========================

    async follow(followerId: number, username: string) {
        const follower = await this.userRepo.findOneBy({ id: followerId });
        const following = await this.userRepo.findOneBy({ username });

        if (!follower || !following || follower.id === following.id) {
            return false;
        }

        const exists = await this.followRepo.findOne({
            where: { follower, following },
        });

        if (exists) return true;

        try {
            await this.followRepo.save({ follower, following });
        } catch (err: any) {
            // concurrent insert may cause unique constraint violation
            // treat as success if the follow already exists
            const code = err?.code ?? err?.driverError?.code;
            if (code === "23505") {
                return true;
            }
            throw err;
        }

        // emit activity (event)
        await this.activityService.createActivity({
            type: ACTIVITY_TYPE.FOLLOW,
            actor: follower,
            targetUser: following,
        });

        return true;
    }

    async unfollow(followerId: number, username: string) {
        const follower = await this.userRepo.findOneBy({ id: followerId });
        const following = await this.userRepo.findOneBy({ username });

        if (!follower || !following) return false;

        await this.followRepo.delete({ follower, following });

        // NOTE:
        // we keep activity immutable for now
        // (optional later: deactivate follow activity)

        return true;
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
            .createQueryBuilder("u") // u = follower
            .innerJoin(
                Follow,
                "f",
                "f.followerId = u.id",
            )
            .innerJoin(
                "users",
                "profile",
                "profile.id = f.followingId",
            )
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
            .createQueryBuilder("u") // u = user being followed
            .innerJoin(
                Follow,
                "f",
                "f.followingId = u.id",
            )
            .innerJoin(
                "users",
                "profile",
                "profile.id = f.followerId",
            )
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
