import {
    Resolver,
    Query,
    Mutation,
    Args,
    Int,
    ResolveField,
    Parent,
    Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@Resolver(() => Post)
export class PostsResolver {
    constructor(private readonly postsService: PostsService) { }

    @Query(() => [Post])
    posts() {
        return this.postsService.getFeed();
    }

    // 🔹 Needed for likedUsers modal query
    @Query(() => Post)
    post(@Args('id', { type: () => Int }) id: number) {
        return this.postsService.findById(id);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Post)
    async addPost(
        @CurrentUser() user: User,
        @Args('content') content: string,
    ) {
        if (!user?.id) throw new Error('Not authenticated');
        return this.postsService.addPost(user.id, content);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async deletePost(
        @CurrentUser() user: User,
        @Args('postId', { type: () => Int }) postId: number,
    ) {
        if (!user?.id) throw new Error('Not authenticated');
        return this.postsService.deletePost(postId, user.id);
    }

    @ResolveField('likesCount', () => Number)
    async likesCount(@Parent() post: Post) {
        return (await this.postsService.getLikesInfo(post.id)).likesCount;
    }

    @ResolveField('likedByMe', () => Boolean)
    async likedByMe(@Parent() post: Post, @Context() ctx: any) {
        const userId = ctx?.req?.user?.id;
        if (!userId) return false;
        return (await this.postsService.getLikesInfo(post.id, userId))
            .likedByMe;
    }

    @ResolveField(() => [User])
    async likedUsers(@Parent() post: Post) {
        return this.postsService.getUsersWhoLiked(post.id);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async toggleLike(
        @CurrentUser() user: User,
        @Args('postId', { type: () => Int }) postId: number,
    ) {
        if (!user?.id) throw new Error('Not authenticated');
        return this.postsService.toggleLike(user.id, postId);
    }
}
