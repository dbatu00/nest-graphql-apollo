import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from "typeorm";
import { User } from "../users/user.entity";
import { Post } from "../posts/post.entity";
import type { ActivityType } from "./activity.constants";

@Entity()
export class Activity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    actor: User;

    @Column()
    actorId: number;

    @ManyToOne(() => User, { nullable: true })
    targetUser?: User;

    @Column({ nullable: true })
    targetUserId?: number;

    @ManyToOne(() => Post, { nullable: true })
    targetPost?: Post;

    @Column({ nullable: true })
    targetPostId?: number;

    @Column()
    type: ActivityType;

    @Column({ default: true })
    active: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
