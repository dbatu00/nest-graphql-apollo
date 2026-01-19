import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { Logger, UseGuards } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { Post } from "./post.entity";
import { GqlAuthGuard } from "../auth/gql-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { User } from "src/users/user.entity";

@Resolver(() => Post)
export class PostsResolver {
    private readonly logger = new Logger(PostsResolver.name);

    constructor(private readonly postsService: PostsService) { }

    @UseGuards(GqlAuthGuard)
    @Query(() => [Post])
    async getAllPosts(): Promise<Post[]> {
        return this.postsService.getAllPosts();
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Post)
    async addPost(
        @CurrentUser() user: User,
        @Args("content") content: string,
    ): Promise<Post> {
        return this.postsService.addPost(user.id, content);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async deletePost(
        @Args("postId", { type: () => Int }) postId: number,
    ): Promise<boolean> {
        return this.postsService.deletePost(postId);
    }
}
