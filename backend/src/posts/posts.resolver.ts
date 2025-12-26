import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './post.entity';
import { Logger, InternalServerErrorException } from '@nestjs/common';


@Resolver(() => Post)
export class PostsResolver {

    private readonly logger = new Logger(PostsResolver.name);

    constructor(private readonly postsService: PostsService) { }

}
