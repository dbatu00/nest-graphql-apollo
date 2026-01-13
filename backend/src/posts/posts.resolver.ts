import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { PostsService } from "./posts.service";
import { Post } from "./post.entity";
import { Logger } from "@nestjs/common";

@Resolver(() => Post)
export class PostsResolver {
    private readonly logger = new Logger(PostsResolver.name);

    constructor(private readonly postsService: PostsService) { }

    @Query(() => [Post])
    async getAllPosts(): Promise<Post[]> {
        return this.postsService.getAllPosts();
    }

    // 🔹 ADD POST
    @Mutation(() => Post)
    async addPost(
        @Args("userId", { type: () => Int }) userId: number,
        @Args("content") content: string,
    ): Promise<Post> {
        return this.postsService.addPost(userId, content);
    }

    // 🔹 DELETE POST
    @Mutation(() => Boolean)
    async deletePost(
        @Args("postId", { type: () => Int }) postId: number,
    ): Promise<boolean> {
        return this.postsService.deletePost(postId);
    }
}
