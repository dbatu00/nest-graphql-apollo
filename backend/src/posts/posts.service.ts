import {
    Injectable,
    Logger,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Post } from "./post.entity";
import { User } from "../users/user.entity";

@Injectable()
export class PostsService {
    private readonly logger = new Logger(PostsService.name);

    constructor(
        @InjectRepository(Post) private postsRepo: Repository<Post>,
        @InjectRepository(User) private usersRepo: Repository<User>,
    ) { }

    async getAllPosts(): Promise<Post[]> {
        this.logger.log(`getAllPosts called`);

        try {
            return await this.postsRepo.find({
                relations: ["user"],
                order: { createdAt: "DESC" }, // feed order
            });
        } catch (error) {
            this.logger.error("getAllPosts failed", error);
            throw new InternalServerErrorException();
        }
    }

    // 🔹 ADD POST
    async addPost(userId: number, content: string): Promise<Post> {
        this.logger.log(`addPost called | userId=${userId}`);

        const user = await this.usersRepo.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        const post = this.postsRepo.create({
            user,
            content,
        });

        try {
            return await this.postsRepo.save(post);
        } catch (error) {
            this.logger.error("addPost failed", error);
            throw new InternalServerErrorException("Failed to create post");
        }
    }

    // 🔹 DELETE POST
    async deletePost(postId: number): Promise<boolean> {
        this.logger.log(`deletePost called | postId=${postId}`);

        const result = await this.postsRepo.delete(postId);

        if (result.affected === 0) {
            throw new NotFoundException("Post not found");
        }

        return true;
    }
}
