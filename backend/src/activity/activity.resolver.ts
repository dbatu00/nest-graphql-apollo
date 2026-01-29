import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ActivityService } from "./activity.service";
import { CurrentUser } from "src/auth/current-user.decorator";
import { User } from "src/users/user.entity";
import { ActivityGQL } from "./activity.types"; // ⚠️ renamed

@Resolver()
export class ActivityResolver {
    constructor(private readonly activityService: ActivityService) { }

    @Query(() => [ActivityGQL])
    activityFeed(@CurrentUser() user: User) {
        return this.activityService.getUserFeed(user.username);
    }

    @Query(() => [ActivityGQL])
    profileActivity(
        @Args("username") username: string
    ) {
        return this.activityService.getProfileActivity(username);
    }

    @Mutation(() => Boolean)
    async toggleLike(
        @CurrentUser() user: User,
        @Args("postId") postId: number,
        @Args("shouldLike") shouldLike: boolean
    ) {
        return this.activityService.toggleLike(user.id, postId, shouldLike);
    }

    @Mutation(() => Boolean)
    async toggleFollow(
        @CurrentUser() user: User,
        @Args("targetUsername") targetUsername: string,
        @Args("shouldFollow") shouldFollow: boolean
    ) {
        return this.activityService.toggleFollow(user.id, targetUsername, shouldFollow);
    }

    @Mutation(() => Boolean)
    async sharePost(
        @CurrentUser() user: User,
        @Args("postId") postId: number
    ) {
        return this.activityService.share(user.id, postId);
    }
}
