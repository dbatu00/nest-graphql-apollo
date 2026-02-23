// Auth business logic: sign-up, login, and token issuing.
import { Injectable, UnauthorizedException, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Auth } from "./auth.entity";
import { User } from "../users/user.entity";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private static readonly MIN_PASSWORD_LENGTH = 8;

    constructor(
        @InjectRepository(Auth)
        private readonly authRepo: Repository<Auth>,

        private readonly dataSource: DataSource,
        private readonly jwtService: JwtService,
    ) { }

    async signUp(username: string, password: string) {
        try {
            this.validateCredentials(username, password);

            const existingUser = await this.dataSource
                .getRepository(User)
                .findOne({ where: { username } });

            if (existingUser) {
                throw new BadRequestException("Username already exists");
            }

            const passwordHash = await argon2.hash(password);

            const user = await this.dataSource.transaction(async (manager) => {
                const user = manager.create(User, {
                    username,
                    displayName: username,
                });

                await manager.save(user);

                const auth = manager.create(Auth, {
                    password: passwordHash,
                    user,
                });

                await manager.save(auth);

                return user;
            });

            this.logger.log(`User signed up: ${username}`);

            return {
                user,
                token: this.issueAccessToken(user),
            };
        } catch (error) {
            this.logger.error(`Sign-up failed for username: ${username}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }

    async login(username: string, password: string) {
        try {
            this.validateCredentials(username, password);

            const credential = await this.authRepo
                .createQueryBuilder("auth")
                .innerJoinAndSelect("auth.user", "user")
                .where("user.username = :username", { username })
                .getOne();

            if (!credential) {
                this.logger.warn(`Invalid login attempt for username: ${username}`);
                throw new UnauthorizedException("Invalid credentials");
            }

            const isHash = credential.password.startsWith("$argon2");
            const isValidPassword = isHash
                ? await argon2.verify(credential.password, password)
                : credential.password === password;

            if (!isValidPassword) {
                this.logger.warn(`Invalid login attempt for username: ${username}`);
                throw new UnauthorizedException("Invalid credentials");
            }

            if (!isHash) {
                credential.password = await argon2.hash(password);
                await this.authRepo.save(credential);
            }

            this.logger.log(`User logged in: ${username}`);

            return {
                user: credential.user,
                token: this.issueAccessToken(credential.user),
            };
        } catch (error) {
            this.logger.error(`Login failed for username: ${username}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }

    private issueAccessToken(user: User): string {
        return this.jwtService.sign({
            sub: user.id,
            username: user.username,
        });
    }

    private validateCredentials(username: string, password: string): void {
        if (!username?.trim() || !password?.trim()) {
            throw new BadRequestException("Username and password are required");
        }

        if (password.length < AuthService.MIN_PASSWORD_LENGTH) {
            throw new BadRequestException(`Password must be at least ${AuthService.MIN_PASSWORD_LENGTH} characters`);
        }
    }
}
