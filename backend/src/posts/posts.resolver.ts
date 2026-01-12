import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { Logger, InternalServerErrorException } from '@nestjs/common';


@Resolver(() => Post)
export class PostsResolver {

    private readonly logger = new Logger(PostsResolver.name);

    constructor(private readonly postsService: PostsService) { }


    @Query(() => [Post]) //gql 
    async getAllPosts(): Promise<Post[]> { //ts
        this.logger.log(`getAllPosts called`);

        try {
            const result = await this.postsService.getAllPosts();
            this.logger.log(`getAllPosts success | result count: ${result.length}`);
            return result;
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error(
                    `getAllPosts failed | error: ${error.message}`,
                    error.stack,
                );
            } else {
                this.logger.error(
                    `getAllPosts failed | error: ${JSON.stringify(error)}`,
                );
            }
            throw new InternalServerErrorException('Failed to fetch posts');
        }
    }
}
