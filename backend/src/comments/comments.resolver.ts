import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/security/current-user.decorator';
import { GqlAuthGuard } from '../auth/security/gql-auth.guard';
import { User } from '../users/user.entity';
import { Comment } from './comment.entity';
import { CommentsService } from './comments.service';
import { AddCommentArgs } from './dto/comments.args';

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
}
