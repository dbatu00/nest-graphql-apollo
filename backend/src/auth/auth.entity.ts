// Persisted auth credential record linked to user.
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from "typeorm";
import { User } from "../users/user.entity";

@Entity('auth')
@Index('IDX_auth_user_updated', ['user', 'updatedAt'])
export class Auth {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    password: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

