import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm';
import { User } from '../users/user.entity';

import type { LikeType } from './likes.constants';

@Entity()
@Unique(['userId', 'targetType', 'targetId'])
@Check(`"targetType" IN ('post', 'comment')`)
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
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

  @UpdateDateColumn()
  updatedAt: Date;
}