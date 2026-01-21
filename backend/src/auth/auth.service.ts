import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Auth } from "./auth.entity";
import { User } from "../users/user.entity";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Auth)
        private readonly authRepo: Repository<Auth>,

        private readonly dataSource: DataSource,

        private readonly jwtService: JwtService
    ) { }

    async signUp(username: string, password: string) {
        // 1. Enforce uniqueness
        const existing = await this.authRepo
            .createQueryBuilder("auth")
            .innerJoin("auth.user", "user")
            .where("user.name = :username", { username })
            .getOne();

        if (existing) {
            throw new BadRequestException("Username already exists");
        }

        // 2. Transaction: create user + credentials
        const result = await this.dataSource.transaction(async (manager) => {
            const user = manager.create(User, {
                name: username, // keep simple for now
            });

            await manager.save(user);

            const credential = manager.create(Auth, {
                username,
                password,
                user,
            });

            await manager.save(credential);

            return user;
        });

        // 3. Issue token (Access)
        const token = this.issueAccessToken(result);

        return {
            user: result,
            token,
        };
    }

    async login(username: string, password: string) {
        const credential = await this.authRepo
            .createQueryBuilder("auth")
            .innerJoinAndSelect("auth.user", "user")
            .where("user.name = :username", { username })
            .getOne();

        if (!credential) {
            throw new UnauthorizedException("Invalid credentials");
        }

        if (credential.password !== password) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const token = this.issueAccessToken(credential.user);

        return {
            user: credential.user,
            token,
        };
    }



    private issueAccessToken(user: User): string {
        return this.jwtService.sign({
            sub: user.id,
            username: user.name,
        });
    }
}
