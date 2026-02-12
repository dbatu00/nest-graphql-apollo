import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    Unique,
    CreateDateColumn,
} from "typeorm";
import { User } from "../users/user.entity";
import { Post } from "./post.entity";



@Entity()
@Unique(["user", "post"])
export class Like {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    user: User;

    @Column()
    userId: number;

    @ManyToOne(() => Post, { onDelete: "CASCADE" })
    post: Post;

    @Column()
    postId: number;

    @Column({ default: true })
    active: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
