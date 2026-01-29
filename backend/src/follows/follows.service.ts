import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Follow } from "./follow.entity";
import { User } from "../users/user.entity";

@Injectable()
export class FollowsService {
    constructor(
        @InjectRepository(Follow)
        private readonly followRepo: Repository<Follow>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

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

        await this.followRepo.save({ follower, following });
        return true;
    }

    async unfollow(followerId: number, username: string) {
        const follower = await this.userRepo.findOneBy({ id: followerId });
        const following = await this.userRepo.findOneBy({ username });

        if (!follower || !following) return false;

        await this.followRepo.delete({ follower, following });
        return true;
    }

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

    async getFollowersWithFollowState(
        profileUsername: string,
        viewerId: number,
    ) {
        const qb = this.userRepo
            .createQueryBuilder("u") // 👈 ROOT ENTITY = User
            // follow row where u is the follower
            .innerJoin(
                Follow,
                "f",
                "f.followerId = u.id",
            )
            // profile being followed
            .innerJoin(
                "users",
                "profile",
                "profile.id = f.followingId",
            )
            // does viewer follow this user?
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


        const result = await qb.getRawAndEntities();


        return result;
    }







}
