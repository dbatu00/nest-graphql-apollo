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

    @Query(() => [ActivityGQL])
    @UseGuards(GqlAuthGuard)
    homeFeed(@CurrentUser() user: User) {
        if (!user) {
            throw new Error("Authenticated user not found");
        }

        return this.activityService.getHomeFeed(user.username);
    }

    @Query(() => [ActivityGQL])
    @UseGuards(GqlAuthGuard)
    profileActivity(
        @Args("username", { type: () => String }) username: string,
        @CurrentUser() user?: User,
    ) {
        return this.activityService.getProfileActivity(username);
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    toggleFollow(
        @CurrentUser() user: User,
        @Args("targetUsername") targetUsername: string,
        @Args("shouldFollow") shouldFollow: boolean,
    ) {
        return this.activityService.toggleFollow(
            user.id,
            targetUsername,
            shouldFollow,
        );
    }
}
