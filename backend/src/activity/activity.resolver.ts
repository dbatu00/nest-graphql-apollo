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
    feed(
        @Args("username", { type: () => String, nullable: true }) username?: string,
        @Args("types", { type: () => [String], nullable: true }) types?: string[],
        @CurrentUser() user?: User,
    ) {
        if (!user) {
            throw new Error("Authenticated user not found");
        }
        return this.activityService.getActivityFeed(username, types);
    }
}
