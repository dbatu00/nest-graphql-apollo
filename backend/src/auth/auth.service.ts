// Auth business logic: sign-up, login, and token issuing.
import { Injectable, UnauthorizedException, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Auth } from "./auth.entity";
import { User } from "../users/user.entity";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { VerificationToken } from "./verification-token.entity";
import { VerificationEmailService } from "./verification-email.service";
import type { VerificationLinkResult } from "./verification-link.types";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private static readonly MIN_PASSWORD_LENGTH = 8;
    private static readonly DEFAULT_VERIFICATION_RESEND_COOLDOWN_MS = 60_000;
    private static readonly DEFAULT_VERIFICATION_RESEND_MAX_PER_HOUR = 5;
    private static readonly DEFAULT_VERIFICATION_TOKEN_TTL_SECONDS = 24 * 60 * 60;

    constructor(
        @InjectRepository(Auth)
        private readonly authRepo: Repository<Auth>,
        @InjectRepository(VerificationToken)
        private readonly verificationTokenRepo: Repository<VerificationToken>,

        private readonly dataSource: DataSource,
        private readonly jwtService: JwtService,
        private readonly verificationEmailService: VerificationEmailService,
        private readonly configService: ConfigService,
    ) { }

    async signUp(username: string, email: string, password: string) {
        try {
            this.validateCredentials(username, password);

            if (!email?.trim()) {
                throw new BadRequestException("Email is required");
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                throw new BadRequestException("Invalid email format");
            }

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
                this.logger.warn(`Invalid credential hash format for username: ${username}`);
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
        const verificationToken = await this.verificationTokenRepo
            .createQueryBuilder("verification")
            .innerJoinAndSelect("verification.user", "user")
            .where("verification.tokenHash = :tokenHash AND verification.type = :type", { tokenHash, type: "email_verification" })
            .getOne();

        if (!verificationToken) {
            throw new BadRequestException("Verification token is invalid");
        }

        if (verificationToken.consumedAt) {
            throw new BadRequestException("Verification token has already been used");
        }

        if (verificationToken.expiresAt.getTime() < Date.now()) {
            throw new BadRequestException("Verification token has expired");
        }

        verificationToken.user.emailVerified = true;
        verificationToken.consumedAt = new Date();

        await this.dataSource.transaction(async (manager) => {
            await manager.save(verificationToken.user);
            await manager.save(verificationToken);
        });

        return true;
    }

    async resendMyVerificationEmail(userId: number): Promise<boolean> {
        const user = await this.dataSource
            .getRepository(User)
            .findOne({ where: { id: userId } });

        if (!user) {
            throw new UnauthorizedException("User not found");
        }

        if (user.emailVerified) {
            this.logger.debug(`Resend skipped: email already verified userId=${userId}`);
            return true;
        }

        const resendStatus = await this.issueAndSendVerificationToken(user);
        if (resendStatus === "throttled") {
            this.logger.warn(`Resend throttled for userId=${userId}`);
        }

        return true;
    }

    // Handles browser/email-link verification flow and returns an explicit status for controller rendering.
    async processVerificationLink(token: string): Promise<VerificationLinkResult> {
        const tokenHash = this.hashToken(token);
        const verificationToken = await this.verificationTokenRepo
            .createQueryBuilder("verification")
            .innerJoinAndSelect("verification.user", "user")
            .where("verification.tokenHash = :tokenHash AND verification.type = :type", { tokenHash, type: "email_verification" })
            .getOne();

        if (!verificationToken || verificationToken.consumedAt) {
            this.logger.warn("Verification link rejected: invalid or already used token");
            return { status: "invalid" };
        }

        if (verificationToken.expiresAt.getTime() < Date.now()) {
            if (verificationToken.user.emailVerified) {
                this.logger.warn(`Verification link rejected: expired token for already-verified userId=${verificationToken.user.id}`);
                return { status: "invalid" };
            }

            const resendStatus = await this.issueAndSendVerificationToken(verificationToken.user);
            if (resendStatus === "throttled") {
                this.logger.warn(`Verification link expired and resend throttled userId=${verificationToken.user.id}`);
            }
            return resendStatus === "sent"
                ? { status: "expired_resent" }
                : { status: "expired_throttled" };
        }

        verificationToken.user.emailVerified = true;
        verificationToken.consumedAt = new Date();

        await this.dataSource.transaction(async (manager) => {
            await manager.save(verificationToken.user);
            await manager.save(verificationToken);
        });

        this.logger.log(`Email verified userId=${verificationToken.user.id}`);

        return { status: "verified" };
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

    private generateRawToken(): string {
        return randomBytes(32).toString("hex");
    }

    private hashToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }

    private createTokenExpiry(): Date {
        const rawTtl = Number(this.configService.get<number>("EMAIL_VERIFICATION_TOKEN_TTL_SECONDS"));
        const ttlSeconds = Number.isFinite(rawTtl) && rawTtl > 0
            ? rawTtl
            : AuthService.DEFAULT_VERIFICATION_TOKEN_TTL_SECONDS;

        const expiry = new Date();
        expiry.setSeconds(expiry.getSeconds() + ttlSeconds);
        return expiry;
    }

    private async issueAndSendVerificationToken(user: User): Promise<"sent" | "throttled"> {
        // Cooldown and rolling-window checks are config-driven and validated by environment config.
        const latestToken = await this.verificationTokenRepo
            .createQueryBuilder("verification")
            .where("verification.userId = :userId AND verification.type = :type", {
                userId: user.id,
                type: "email_verification",
            })
            .orderBy("verification.createdAt", "DESC")
            .getOne();

        const cooldownMs = this.configService.get<number>("EMAIL_VERIFICATION_RESEND_COOLDOWN_MS")
            ?? AuthService.DEFAULT_VERIFICATION_RESEND_COOLDOWN_MS;

        if (latestToken) {
            const ageMs = Date.now() - latestToken.createdAt.getTime();
            if (ageMs < cooldownMs) {
                return "throttled";
            }
        }

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const sentLastHour = await this.verificationTokenRepo
            .createQueryBuilder("verification")
            .where("verification.userId = :userId AND verification.type = :type AND verification.createdAt >= :oneHourAgo", {
                userId: user.id,
                type: "email_verification",
                oneHourAgo,
            })
            .getCount();

        const maxPerHour = this.configService.get<number>("EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR")
            ?? AuthService.DEFAULT_VERIFICATION_RESEND_MAX_PER_HOUR;

        if (sentLastHour >= maxPerHour) {
            return "throttled";
        }

        const verificationToken = this.generateRawToken();
        const verificationTokenHash = this.hashToken(verificationToken);

        await this.dataSource.transaction(async (manager) => {
            const activeTokens = await manager
                .createQueryBuilder(VerificationToken, "verification")
                .where("verification.userId = :userId AND verification.type = :type AND verification.consumedAt IS NULL", {
                    userId: user.id,
                    type: "email_verification",
                })
                .getMany();

            if (activeTokens.length > 0) {
                const now = new Date();
                activeTokens.forEach((activeToken) => {
                    activeToken.consumedAt = now;
                });
                await manager.save(activeTokens);
            }

            const tokenEntity = manager.create(VerificationToken, {
                tokenHash: verificationTokenHash,
                type: "email_verification",
                user,
                expiresAt: this.createTokenExpiry(),
            });

            await manager.save(tokenEntity);
        });

        await this.verificationEmailService.sendVerificationEmail(user.email, verificationToken, user.username);
        this.logger.log(`Verification email sent userId=${user.id}`);
        return "sent";
    }
}
