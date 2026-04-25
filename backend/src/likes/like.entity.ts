import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import type { LikeType } from './likes.constants';

@Entity()
@Unique(['userId', 'targetType', 'targetId'])
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'varchar' })
  targetType: LikeType;

  @Column()
  targetId: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
