import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '../users/user.entity';

@ObjectType()
@Entity('posts')
export class Post {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.posts, { onDelete: 'CASCADE' })
    user: User;

    @Field()
    @Column()
    content: string;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => Int)
    @Column({ default: 0 })
    likes: number;

    @Field(() => Int)
    @Column({ default: 0 })
    shares: number;
}
