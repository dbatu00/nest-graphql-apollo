// Auth business logic: sign-up, login, and token issuing.
import { Injectable, UnauthorizedException, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Auth } from "./auth.entity";
import { User } from "../users/user.entity";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { VerificationToken } from "./verification-token.entity";
import { VerificationEmailService } from "./verification-email.service";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private static readonly MIN_PASSWORD_LENGTH = 8;

    constructor(
        @InjectRepository(Auth)
        private readonly authRepo: Repository<Auth>,
        @InjectRepository(VerificationToken)
        private readonly verificationTokenRepo: Repository<VerificationToken>,

        private readonly dataSource: DataSource,
        private readonly jwtService: JwtService,
        private readonly verificationEmailService: VerificationEmailService,
    ) { }

    async signUp(username: string, email: string, password: string) {
        try {
            this.validateSignUpInput(username, email, password);

            const normalizedEmail = email.trim().toLowerCase();

            const existingUser = await this.dataSource
                .getRepository(User)
                .findOne({ where: { username } });

            if (existingUser) {
                throw new BadRequestException("Username already exists");
            }

            const existingEmail = await this.dataSource
                .getRepository(User)
                .findOne({ where: { email: normalizedEmail } });

            if (existingEmail) {
                throw new BadRequestException("Email already exists");
            }

            const passwordHash = await argon2.hash(password);
            const verificationToken = this.generateRawToken();
            const verificationTokenHash = this.hashToken(verificationToken);

            const user = await this.dataSource.transaction(async (manager) => {
                const user = manager.create(User, {
                    username,
                    displayName: username,
                    email: normalizedEmail,
                    emailVerified: false,
                });

                await manager.save(user);

                const auth = manager.create(Auth, {
                    password: passwordHash,
                    user,
                });

                await manager.save(auth);

                const tokenEntity = manager.create(VerificationToken, {
                    tokenHash: verificationTokenHash,
                    type: "email_verification",
                    user,
                    expiresAt: this.createTokenExpiry(),
                });

                await manager.save(tokenEntity);

                return user;
            });

            await this.verificationEmailService.sendVerificationEmail(user.email, verificationToken, user.username);

            this.logger.log(`User signed up: ${username}`);

            return {
                user,
                token: this.issueAccessToken(user),
                emailVerified: user.emailVerified,
                verificationToken: this.verificationEmailService.isConfigured() ? undefined : verificationToken,
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
                .where("user.username = :identifier OR LOWER(user.email) = LOWER(:identifier)", { identifier: username })
                .getOne();

            if (!credential) {
                this.logger.warn(`Invalid login attempt for username: ${username}`);
                throw new UnauthorizedException("Invalid credentials");
            }

            const isHash = credential.password.startsWith("$argon2");
            if (!isHash) {
                this.logger.warn(`Legacy/invalid credential format for username: ${username}`);
                throw new UnauthorizedException("Invalid credentials");
            }

            const isValidPassword = await argon2.verify(credential.password, password);

            if (!isValidPassword) {
                this.logger.warn(`Invalid login attempt for username: ${username}`);
                throw new UnauthorizedException("Invalid credentials");
            }

            if (!credential.user.emailVerified) {
                throw new UnauthorizedException("Email is not verified");
            }

            this.logger.log(`User logged in: ${username}`);

            return {
                user: credential.user,
                token: this.issueAccessToken(credential.user),
                emailVerified: credential.user.emailVerified,
            };
        } catch (error) {
            this.logger.error(`Login failed for username: ${username}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }

    async verifyEmail(token: string): Promise<boolean> {
        const tokenHash = this.hashToken(token);
        const invalidTokenMessage = "Invalid, expired, or already-used verification token";
        const verificationToken = await this.verificationTokenRepo
            .createQueryBuilder("verification")
            .innerJoinAndSelect("verification.user", "user")
            .where("verification.tokenHash = :tokenHash AND verification.type = :type", { tokenHash, type: "email_verification" })
            .getOne();

        if (!verificationToken) {
            throw new BadRequestException(invalidTokenMessage);
        }

        if (verificationToken.consumedAt) {
            throw new BadRequestException(invalidTokenMessage);
        }

        if (verificationToken.expiresAt.getTime() < Date.now()) {
            throw new BadRequestException(invalidTokenMessage);
        }

        verificationToken.user.emailVerified = true;
        verificationToken.consumedAt = new Date();

        await this.dataSource.transaction(async (manager) => {
            await manager.save(verificationToken.user);
            await manager.save(verificationToken);
        });

        return true;
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

    private validateSignUpInput(username: string, email: string, password: string): void {
        this.validateCredentials(username, password);

        if (!email?.trim()) {
            throw new BadRequestException("Email is required");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            throw new BadRequestException("Invalid email format");
        }
    }

    private generateRawToken(): string {
        return randomBytes(32).toString("hex");
    }

    private hashToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }

    private createTokenExpiry(): Date {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);
        return expiry;
    }
}
