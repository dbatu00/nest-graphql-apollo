// GraphQL resolver for activity feed queries.
import { Args, Query, Resolver } from "@nestjs/graphql";
import { UnauthorizedException, UseGuards } from "@nestjs/common";

import { ActivityService } from "./activity.service";
import { ActivityGQL } from "./activity.types";

import { CurrentUser } from "src/auth/security/current-user.decorator";
import { GqlAuthGuard } from "src/auth/security/gql-auth.guard";
import { User } from "src/users/user.entity";
import { FeedArgs } from "./dto/feed.args";

@Resolver(() => ActivityGQL)
export class ActivityResolver {
    constructor(
        private readonly activityService: ActivityService,
    ) { }

    @Query(() => [ActivityGQL])
    @UseGuards(GqlAuthGuard)
    feed(
        @Args() args: FeedArgs,
        @CurrentUser() user?: User,
    ) {
        if (!user) {
            throw new UnauthorizedException("Authenticated user not found");
        }
        return this.activityService.getActivityFeed(args.username, args.types);
    }
}
