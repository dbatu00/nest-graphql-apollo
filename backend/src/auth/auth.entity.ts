import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
} from "typeorm";
import { ObjectType, Field, Int } from "@nestjs/graphql";
import { User } from "../users/user.entity";

@ObjectType()
@Entity("auth_credentials")
export class AuthCredential {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
}
