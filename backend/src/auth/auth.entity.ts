// Persisted auth credential record linked to user.
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn
} from "typeorm";
import { User } from "../users/user.entity";

@Entity('auth')
export class Auth {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    password: string;

    @Column({ default: 0 })
    failedLoginAttempts: number;

    @Column({ type: "timestamptz", nullable: true })
    loginLockedUntil?: Date | null;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

