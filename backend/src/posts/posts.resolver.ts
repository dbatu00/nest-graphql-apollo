import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { ActivityService } from 'src/activity/activity.service';


@Resolver(() => Post)
export class PostsResolver {
    constructor(
        private readonly postsService: PostsService,
        private readonly activityService: ActivityService,
    ) { }

    @UseGuards(GqlAuthGuard)
    @Query(() => [Post])
    posts() {
        return this.postsService.getFeed();
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Post)
    async addPost(
        @CurrentUser() user: User,
        @Args('content') content: string,
    ) {
        return this.postsService.addPost(user.id, content);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    deletePost(
        @CurrentUser() user: User,
        @Args('postId', { type: () => Int }) postId: number,
    ) {
        return this.postsService.deletePost(postId, user.id);
    }

    @Query(() => [Post])
    postsByUsername(@Args("username") username: string) {
        return this.postsService.getPostsByUsername(username);
    }

    @ResolveField('likesCount', () => Number)
    @UseGuards(GqlAuthGuard)
    async likesCount(@Parent() post: Post) {
        const info = await this.postsService.getLikesInfo(post.id);
        return info.likesCount;
    }

    @ResolveField('likedByMe', () => Boolean)
    @UseGuards(GqlAuthGuard)
    async likedByMe(@Parent() post: Post, @Context() ctx: any) {
        const userId = ctx?.req?.user?.id;
        if (!userId) return false;
        const info = await this.postsService.getLikesInfo(post.id, userId);
        return info.likedByMe;
    }

    /** ------------------ NEW toggleLike mutation ------------------ **/
    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async toggleLike(
        @CurrentUser() user: User,
        @Args('postId', { type: () => Int }) postId: number,
    ) {
        return this.postsService.toggleLike(user.id, postId);
    }
}
