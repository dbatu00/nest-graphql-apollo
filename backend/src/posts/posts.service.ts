import {
    Injectable,
    Logger,
    InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DeleteResult } from "typeorm";
import { Post } from "./post.entity";

@Injectable()
export class PostsService {

    // Dedicated logger for this service, namespace = "PostsService"
    private readonly logger = new Logger(PostsService.name);

    constructor(@InjectRepository(Post) private postsRepo: Repository<Post>) { }


    async getAllPosts(): Promise<Post[]> {
        this.logger.log(`getAllPosts called`);

        try {
            const result = await this.postsRepo.find({
                relations: ['user'],
            });
            this.logger.log(`getAllPosts success | count=${result.length}`);
            return result;
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error(`getAllPosts failed | error=${error.message}`, error.stack);
            } else {
                this.logger.error(`getAllPosts failed | error=${JSON.stringify(error)}`);
            }
            throw new InternalServerErrorException('getAllPosts failed to fetch all posts');
        }
    }

}
