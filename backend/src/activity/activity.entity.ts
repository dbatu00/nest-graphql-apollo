import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { User } from "../users/user.entity";
import { Post } from "../posts/post.entity";

export type ActivityType = "post" | "like" | "share" | "follow";

@Entity()
export class Activity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.id)
    actor: User; // who did the action

    @Column({ type: "enum", enum: ["post", "like", "share", "follow"] })
    type: ActivityType;

    @Column({ nullable: true })
    targetUserId?: number; // for follow/unfollow, share

    @ManyToOne(() => Post, { nullable: true })
    targetPost?: Post; // for like/share

    @Column({ default: true })
    active: boolean; // false if unfollow/unlike/unshare

    @CreateDateColumn()
    createdAt: Date;
}
