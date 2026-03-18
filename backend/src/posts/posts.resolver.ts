// GraphQL resolver for posts and like interactions.
import {
    Resolver,
    Query,
    Mutation,
    Int,
    ResolveField,
    Parent,
    Context,
    Args,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { GqlAuthGuard } from '../auth/security/gql-auth.guard';
import { CurrentUser } from '../auth/security/current-user.decorator';
import { User } from '../users/user.entity';
import { AddPostArgs, PostByIdArgs, PostIdArgs, UsernameArgs } from './dto/posts.args';

type ResolverContext = {
    req?: {
        user?: {
            id?: number;
        };
    };
};

@Resolver(() => Post)
export class PostsResolver {
    constructor(private readonly postsService: PostsService) { }

    @Query(() => [Post])
    posts() {
        return this.postsService.getFeed();
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => [Post])
    likedPosts(@Args() args: UsernameArgs) {
        return this.postsService.getLikedPostsByUsername(args.username);
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => Post)
    post(@Args() args: PostByIdArgs) {
        return this.postsService.findById(args.id);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Post)
    async addPost(
        @CurrentUser() user: User,
        @Args() args: AddPostArgs,
    ) {
        return this.postsService.addPost(user.id, args.content);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async deletePost(
        @CurrentUser() user: User,
        @Args() args: PostIdArgs,
    ) {
        return this.postsService.deletePost(args.postId, user.id);
    }

    // ------------------------
    // LIKE RESOLVERS
    // ------------------------

    @ResolveField(() => Int)
    async likesCount(@Parent() post: Post) {
        const meta = await this.postsService.getLikeMeta(post.id);
        return meta.likesCount;
    }

    @ResolveField(() => Boolean)
    async likedByMe(@Parent() post: Post, @Context() ctx: ResolverContext) {
        // This field can be resolved in contexts where no authenticated user is present.
        const userId = ctx?.req?.user?.id;
        if (!userId) return false;

        const meta = await this.postsService.getLikeMeta(post.id, userId);
        return meta.likedByMe;
    }

    @ResolveField(() => [User])
    async likedUsers(@Parent() post: Post) {
        return this.postsService.getUsersWhoLiked(post.id);
    }

    // ------------------------
    // EXPLICIT LIKE MUTATIONS
    // ------------------------

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async likePost(
        @CurrentUser() user: User,
        @Args() args: PostIdArgs,
    ) {
        return this.postsService.likePost(user.id, args.postId);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async unlikePost(
        @CurrentUser() user: User,
        @Args() args: PostIdArgs,
    ) {
        return this.postsService.unlikePost(user.id, args.postId);
    }
}
