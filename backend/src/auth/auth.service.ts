import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { AuthCredential } from "./auth.entity";
import { User } from "../users/user.entity";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(AuthCredential)
        private readonly authRepo: Repository<AuthCredential>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        private readonly dataSource: DataSource
    ) { }

    async signUp(username: string, password: string) {
        // 1. Enforce uniqueness
        const existing = await this.authRepo.findOne({
            where: { username },
        });

        if (existing) {
            throw new BadRequestException("Username already exists");
        }

        // 2. Transaction: create user + credentials
        const result = await this.dataSource.transaction(async (manager) => {
            const user = manager.create(User, {
                name: username, // keep simple for now
            });

            await manager.save(user);

            const credential = manager.create(AuthCredential, {
                username,
                password,
                user,
            });

            await manager.save(credential);

            return user;
        });

        // 3. Issue token (mock)
        const token = this.issueMockToken(result.id);

        return {
            user: result,
            token,
        };
    }

    async login(username: string, password: string) {
        const credential = await this.authRepo.findOne({
            where: { username },
            relations: ["user"],
        });

        if (!credential) {
            throw new UnauthorizedException("Invalid credentials");
        }

        if (credential.password !== password) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const token = this.issueMockToken(credential.user.id);

        return {
            user: credential.user,
            token,
        };
    }

    private issueMockToken(userId: number): string {
        // TEMPORARY
        // Replace later with JWT / Firebase / OAuth
        return `mock-token-${userId}-${Date.now()}`;
    }
}
