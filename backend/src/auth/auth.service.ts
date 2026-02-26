// Auth business logic: sign-up, login, and token issuing.
import { Injectable, UnauthorizedException, BadRequestException, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Auth } from "./auth.entity";
import { User } from "../users/user.entity";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { VerificationToken } from "./verification/verification-token.entity";
import { VerificationEmailService } from "./verification/verification-email.service";
import type { VerificationLinkResult } from "./verification/verification-link.types";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

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

            try {
                await this.verificationEmailService.sendVerificationEmail(user.email, verificationToken, user.username);
            } catch (error) {
                this.logger.error(
                    `Verification email delivery failed after signup userId=${user.id}`,
                    error instanceof Error ? error.stack : undefined,
                );
            }

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
            throw new HttpException(
                "Too many resend requests. Please wait before requesting another verification email.",
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        if (resendStatus === "delivery_failed") {
            throw new HttpException(
                "Could not deliver verification email right now. Please try again.",
                HttpStatus.SERVICE_UNAVAILABLE,
            );
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

            if (resendStatus === "delivery_failed") {
                this.logger.warn(`Verification link expired and resend delivery failed userId=${verificationToken.user.id}`);
                return { status: "expired_delivery_failed" };
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

        const minPasswordLength = this.getAuthMinPasswordLength();
        if (password.length < minPasswordLength) {
            throw new BadRequestException(`Password must be at least ${minPasswordLength} characters`);
        }
    }

    private generateRawToken(): string {
        return randomBytes(32).toString("hex");
    }

    private hashToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }

    private createTokenExpiry(): Date {
        const ttlSeconds = this.getEmailVerificationTokenTtlSeconds();

        const expiry = new Date();
        expiry.setSeconds(expiry.getSeconds() + ttlSeconds);
        return expiry;
    }

    private async issueAndSendVerificationToken(user: User): Promise<"sent" | "throttled" | "delivery_failed"> {
        // Cooldown and rolling-window checks are config-driven and validated by environment config.
        const latestToken = await this.verificationTokenRepo
            .createQueryBuilder("verification")
            .where("verification.userId = :userId AND verification.type = :type", {
                userId: user.id,
                type: "email_verification",
            })
            .orderBy("verification.createdAt", "DESC")
            .getOne();

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const sentLastHour = await this.verificationTokenRepo
            .createQueryBuilder("verification")
            .where("verification.userId = :userId AND verification.type = :type AND verification.createdAt >= :oneHourAgo", {
                userId: user.id,
                type: "email_verification",
                oneHourAgo,
            })
            .getCount();

        const freeResendAttempts = this.getEmailVerificationResendFreeAttempts();

        if (sentLastHour < freeResendAttempts) {
            this.logger.debug(`Resend bypassed throttle (free window) userId=${user.id} sentLastHour=${sentLastHour}`);
        } else {
            const cooldownMs = this.getEmailVerificationResendCooldownMs();

            if (latestToken) {
                const ageMs = Date.now() - latestToken.createdAt.getTime();
                if (ageMs < cooldownMs) {
                    return "throttled";
                }
            }

            const maxPerHour = this.getEmailVerificationResendMaxPerHour();

            if (sentLastHour >= maxPerHour) {
                return "throttled";
            }
        }

        const verificationToken = this.generateRawToken();
        const verificationTokenHash = this.hashToken(verificationToken);

        const consumedTokenIds: number[] = [];
        let createdTokenId: number | null = null;

        await this.dataSource.transaction(async (manager) => {
            const activeTokens = await manager
                .createQueryBuilder(VerificationToken, "verification")
                .where("verification.userId = :userId AND verification.type = :type AND verification.consumedAt IS NULL", {
                    userId: user.id,
                    type: "email_verification",
                })
                .getMany();

            consumedTokenIds.push(...activeTokens.map((activeToken) => activeToken.id));

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

            const createdToken = await manager.save(tokenEntity);
            createdTokenId = typeof createdToken?.id === "number" ? createdToken.id : null;
        });

        try {
            await this.verificationEmailService.sendVerificationEmail(user.email, verificationToken, user.username);
        } catch (error) {
            this.logger.error(
                `Verification email delivery failed for userId=${user.id}`,
                error instanceof Error ? error.stack : undefined,
            );
            await this.rollbackVerificationTokenIssue(createdTokenId, consumedTokenIds);
            return "delivery_failed";
        }

        this.logger.log(`Verification email sent userId=${user.id}`);
        return "sent";
    }

    private async rollbackVerificationTokenIssue(createdTokenId: number | null, consumedTokenIds: number[]): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            if (createdTokenId !== null) {
                await manager.delete(VerificationToken, { id: createdTokenId });
            }

            if (consumedTokenIds.length > 0) {
                await manager
                    .createQueryBuilder()
                    .update(VerificationToken)
                    .set({ consumedAt: () => "NULL" })
                    .whereInIds(consumedTokenIds)
                    .execute();
            }
        });
    }

    private getAuthMinPasswordLength(): number {
        return this.getPositiveIntegerConfig("AUTH_MIN_PASSWORD_LENGTH");
    }

    private getEmailVerificationTokenTtlSeconds(): number {
        return this.getPositiveIntegerConfig("EMAIL_VERIFICATION_TOKEN_TTL_SECONDS");
    }

    private getEmailVerificationResendCooldownMs(): number {
        return this.getNonNegativeIntegerConfig("EMAIL_VERIFICATION_RESEND_COOLDOWN_MS");
    }

    private getEmailVerificationResendMaxPerHour(): number {
        return this.getNonNegativeIntegerConfig("EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR");
    }

    private getEmailVerificationResendFreeAttempts(): number {
        return this.getNonNegativeIntegerConfig("EMAIL_VERIFICATION_RESEND_FREE_ATTEMPTS");
    }

    private getPositiveIntegerConfig(key: string): number {
        const rawValue = this.configService.get<number>(key);
        if (typeof rawValue !== "number") {
            throw new Error(`${key} must be set`);
        }
        if (!Number.isInteger(rawValue) || rawValue <= 0) {
            throw new Error(`${key} must be a positive integer`);
        }
        return rawValue;
    }

    private getNonNegativeIntegerConfig(key: string): number {
        const rawValue = this.configService.get<number>(key);
        if (typeof rawValue !== "number") {
            throw new Error(`${key} must be set`);
        }
        if (!Number.isInteger(rawValue) || rawValue < 0) {
            throw new Error(`${key} must be a non-negative integer`);
        }
        return rawValue;
    }
}
