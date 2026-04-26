import {
    Args,
    Mutation,
    Resolver,
    ResolveField,
    Parent,
    Context,
    Int,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/security/current-user.decorator';
import { GqlAuthGuard } from '../auth/security/gql-auth.guard';
import { User } from '../users/user.entity';
import { Comment } from './comment.entity';
import { CommentsService } from './comments.service';
import {
    AddCommentArgs,
    CommentIdArgs,
} from './dto/comments.args';

type ResolverContext = {
    req?: {
        user?: {
            id?: number;
        };
    };
};

@Resolver(() => Comment)
export class CommentsResolver {
    constructor(private readonly commentsService: CommentsService) { }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Comment)
    async addComment(
        @CurrentUser() user: User,
        @Args() args: AddCommentArgs,
    ) {
        return this.commentsService.addComment(user.id, args.postId, args.content);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async deleteComment(
        @CurrentUser() user: User,
        @Args() args: CommentIdArgs,
    ) {
        return this.commentsService.deleteComment(args.commentId, user.id);
    }

    @ResolveField(() => Int)
    async likesCount(@Parent() comment: Comment) {
        const meta = await this.commentsService.getLikeMeta(comment.id);
        return meta.likesCount;
    }

    @ResolveField(() => Boolean)
    async likedByMe(@Parent() comment: Comment, @Context() ctx: ResolverContext) {
        const userId = ctx?.req?.user?.id;
        if (!userId) return false;

        const meta = await this.commentsService.getLikeMeta(comment.id, userId);
        return meta.likedByMe;
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async likeComment(
        @CurrentUser() user: User,
        @Args() args: CommentIdArgs,
    ) {
        return this.commentsService.likeComment(user.id, args.commentId);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async unlikeComment(
        @CurrentUser() user: User,
        @Args() args: CommentIdArgs,
    ) {
        return this.commentsService.unlikeComment(user.id, args.commentId);
    }
}
