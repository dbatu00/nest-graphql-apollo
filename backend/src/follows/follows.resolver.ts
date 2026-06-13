// GraphQL resolver for follow/unfollow and follower list queries.
import { Resolver, Mutation, Args, Query } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { FollowsService } from "./follows.service";
import { GqlAuthGuard } from "../auth/security/gql-auth.guard";
import { CurrentUser } from "../auth/security/current-user.decorator";
import { User } from "../users/user.entity";
import { FollowerView } from "./dto/follower-view.type";
import { UsernameArgs } from "../common/graphql/args/username.args";

@Resolver()
export class FollowsResolver {
    constructor(private readonly followsService: FollowsService) { }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    followUser(
        @CurrentUser() user: User,
        @Args() args: UsernameArgs,
    ) {
        return this.followsService.follow(user.id, args.username);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    unfollowUser(
        @CurrentUser() user: User,
        @Args() args: UsernameArgs,
    ) {
        return this.followsService.unfollow(user.id, args.username);
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => [User])
    followers(@Args() args: UsernameArgs) {
        return this.followsService
            .getFollowers(args.username)
            .then(rows => rows.map(r => r.follower));
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => [User])
    following(@Args() args: UsernameArgs) {
        return this.followsService
            .getFollowing(args.username)
            .then(rows => rows.map(r => r.following));
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => [FollowerView])
    async getProfileFollowersView(@Args() args: UsernameArgs, @CurrentUser() user: User) {
        return this.followsService.getProfileFollowersView(args.username, user.id);
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => [FollowerView])
    async getProfileFollowingView(@Args() args: UsernameArgs, @CurrentUser() user: User) {
        return this.followsService.getProfileFollowingView(args.username, user.id);
    }
}
