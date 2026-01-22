import { Resolver, Mutation, Args, Query } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { FollowsService } from "./follows.service";
import { Follow } from "./follow.entity";
import { GqlAuthGuard } from "../auth/gql-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { User } from "../users/user.entity";

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

    @Query(() => [User])
    followers(@Args("username") username: string) {
        return this.followsService
            .getFollowers(username)
            .then(rows => rows.map(r => r.follower));
    }

    @Query(() => [User])
    following(@Args("username") username: string) {
        return this.followsService
            .getFollowing(username)
            .then(rows => rows.map(r => r.following));
    }
}
