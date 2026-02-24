import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
} from "typeorm";
import { User } from "../users/user.entity";

export type VerificationTokenType = "email_verification";

@Entity("verification_tokens")
export class VerificationToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Index("IDX_verification_tokens_token_hash_unique", { unique: true })
    @Column({ unique: true })
    tokenHash: string;

    @Column({ type: "varchar" })
    type: VerificationTokenType;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    user: User;

    @Column({ type: "timestamp" })
    expiresAt: Date;

    @Column({ type: "timestamp", nullable: true })
    consumedAt?: Date;

    @CreateDateColumn()
    createdAt: Date;
}
