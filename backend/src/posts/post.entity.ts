import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn
} from 'typeorm';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '../users/user.entity';

@ObjectType()
@Entity('posts')
export class Post {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(() => User)
    @ManyToOne(() => User, user => user.posts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Field()
    @Column()
    content: string;

    @Field()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Field(() => Int)
    @Column({ default: 0 })
    likes: number;

    @Field(() => Int)
    @Column({ default: 0 })
    shares: number;
}
