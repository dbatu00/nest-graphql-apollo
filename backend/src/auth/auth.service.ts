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
        private readonly jwtService: JwtService,
    ) { }

    async signUp(username: string, password: string) {
        const existingUser = await this.dataSource
            .getRepository(User)
            .findOne({ where: { username } });

        if (existingUser) {
            throw new BadRequestException("Username already exists");
        }

        const user = await this.dataSource.transaction(async (manager) => {
            const user = manager.create(User, {
                username,
                displayName: username,
            });

            await manager.save(user);

            const auth = manager.create(Auth, {
                password,
                user,
            });

            await manager.save(auth);

            return user;
        });

        return {
            user,
            token: this.issueAccessToken(user),
        };
    }

    async login(username: string, password: string) {
        const credential = await this.authRepo
            .createQueryBuilder("auth")
            .innerJoinAndSelect("auth.user", "user")
            .where("user.username = :username", { username })
            .getOne();

        if (!credential || credential.password !== password) {
            throw new UnauthorizedException("Invalid credentials");
        }

        return {
            user: credential.user,
            token: this.issueAccessToken(credential.user),
        };
    }

    private issueAccessToken(user: User): string {
        return this.jwtService.sign({
            sub: user.id,
            username: user.username,
        });
    }
}
