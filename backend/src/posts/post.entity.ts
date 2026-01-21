import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn, UpdateDateColumn
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('posts')
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    content: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
