// GraphQL resolver for follow/unfollow and follower list queries.
import { Resolver, Mutation, Args, Query } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { FollowsService } from "./follows.service";
import { GqlAuthGuard } from "../auth/security/gql-auth.guard";
import { CurrentUser } from "../auth/security/current-user.decorator";
import { User } from "../users/user.entity";
import { FollowerView } from "./dto/follower-view.type";

@Resolver()
export class FollowsResolver {
    constructor(private readonly followsService: FollowsService) { }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    followUser(
        @CurrentUser() user: User,
        @Args("username") username: string,
    ) {
        return this.followsService.follow(user.id, username);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    unfollowUser(
        @CurrentUser() user: User,
        @Args("username") username: string,
    ) {
        return this.followsService.unfollow(user.id, username);
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => [User])
    followers(@Args("username") username: string) {
        return this.followsService
            .getFollowers(username)
            .then(rows => rows.map(r => r.follower));
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => [User])
    following(@Args("username") username: string) {
        return this.followsService
            .getFollowing(username)
            .then(rows => rows.map(r => r.following));
    }



    @UseGuards(GqlAuthGuard)
    @Query(() => [FollowerView])
    async followersWithFollowState(
        @Args("username") username: string,
        @CurrentUser() user: User,
    ) {
        const { entities, raw } =
            await this.followsService.getFollowersWithFollowState(
                username,
                user.id,
            );

        // Raw SQL CASE can arrive as boolean or string depending on driver/config.
        return entities.map((u, i) => ({
            user: u,
            followedByMe:
                raw[i].followedByMe === true ||
                raw[i].followedByMe === "true",
        }));
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => [FollowerView])
    async followingWithFollowState(
        @Args("username") username: string,
        @CurrentUser() user: User,
    ) {
        const { entities, raw } =
            await this.followsService.getFollowingWithFollowState(
                username,
                user.id
            );

        // Normalize both boolean and string representations from raw projection.
        return entities.map((u, i) => ({
            user: u,
            followedByMe: raw[i].followedByMe === true || raw[i].followedByMe === "true",
        }));
    }



}
