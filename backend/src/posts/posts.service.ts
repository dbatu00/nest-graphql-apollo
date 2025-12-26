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


}
