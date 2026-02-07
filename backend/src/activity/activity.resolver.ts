import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { ActivityService } from "./activity.service";
import { ActivityGQL } from "./activity.types";

import { CurrentUser } from "src/auth/current-user.decorator";
import { GqlAuthGuard } from "src/auth/gql-auth.guard";

import { User } from "src/users/user.entity";

@Resolver(() => ActivityGQL)
export class ActivityResolver {
    constructor(
        private readonly activityService: ActivityService,
    ) { }

    /**
     * Home feed – requires authentication
     * Uses req.user injected by JwtStrategy
     */
    @Query(() => [ActivityGQL])
    @UseGuards(GqlAuthGuard)
    homeFeed(
        @CurrentUser() user: User,
    ) {
        // Defensive check (useful during development)
        if (!user) {
            throw new Error("Authenticated user not found in context");
        }

        return this.activityService.getHomeFeed(user.username);
    }

    /**
     * Public profile activity
     */
    @Query(() => [ActivityGQL])
    profileActivity(
        @Args("username", { type: () => String }) username: string,
    ) {
        return this.activityService.getProfileActivity(username);
    }

    /**
     * Like / unlike a post
     */
    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    toggleLike(
        @CurrentUser() user: User,
        @Args("postId", { type: () => Number }) postId: number,
        @Args("shouldLike", { type: () => Boolean }) shouldLike: boolean,
    ) {
        return this.activityService.toggleLike(
            user.id,
            postId,
            shouldLike,
        );
    }

    /**
     * Follow / unfollow a user
     */
    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    toggleFollow(
        @CurrentUser() user: User,
        @Args("targetUsername", { type: () => String }) targetUsername: string,
        @Args("shouldFollow", { type: () => Boolean }) shouldFollow: boolean,
    ) {
        return this.activityService.toggleFollow(
            user.id,
            targetUsername,
            shouldFollow,
        );
    }

    /**
     * Share a post
     */
    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    sharePost(
        @CurrentUser() user: User,
        @Args("postId", { type: () => Number }) postId: number,
    ) {
        return this.activityService.share(
            user.id,
            postId,
        );
    }
}
