// Database entity for timeline activity rows.
import {
    Entity,
    Index,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "../users/user.entity";
import { Post } from "../posts/post.entity";
import type { ActivityType } from "./activity.constants";
import { Comment } from "../comments/comment.entity";

@Entity()
@Index('IDX_activity_like_post_unique', ['actorId', 'targetPostId'], {
    unique: true,
    where: `"type" = 'like' AND "targetCommentId" IS NULL`,
})
@Index('IDX_activity_like_comment_unique', ['actorId', 'targetCommentId'], {
    unique: true,
    where: `"type" = 'like'`,
})
@Index('IDX_activity_follow_unique', ['actorId', 'targetUserId'], {
    unique: true,
    where: `"type" = 'follow'`,
})
@Index('IDX_activity_feed', ['type', 'active', 'updatedAt'])
// updatedAt is ASC here; PostgreSQL will scan backwards for ORDER BY DESC — acceptable

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

    @ManyToOne(() => Post, { nullable: true, onDelete: 'CASCADE' })
    targetPost?: Post;

    @Column({ nullable: true })
    targetPostId?: number;


    @ManyToOne(() => Comment, { nullable: true, onDelete: 'CASCADE' })
    targetComment?: Comment;

    @Column({ nullable: true })
    targetCommentId?: number;

    @Column()
    type: ActivityType;

    @Column({ default: true })
    active: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
