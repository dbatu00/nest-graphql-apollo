// Database entity for follower/following relationships.

import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
    Index,
} from "typeorm";
import { ObjectType, Field, Int } from "@nestjs/graphql";
import { User } from "../users/user.entity";

@ObjectType()
@Entity("follows")
@Unique(["follower", "following"])
@Index('IDX_follow_composite', ['follower', 'following', 'updatedAt'])
export class Follow {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(() => User)
    @ManyToOne(() => User, user => user.following, {
        onDelete: "CASCADE",
    })
    follower: User;

    @Field(() => User)
    @ManyToOne(() => User, user => user.followers, {
        onDelete: "CASCADE",
    })
    following: User;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;
}
