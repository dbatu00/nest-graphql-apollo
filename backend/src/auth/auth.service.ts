
import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    Logger,
    InternalServerErrorException,
    HttpException,
    HttpStatus

} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";

import {
    Repository,
    DataSource,
    MoreThan,
    QueryFailedError,
} from "typeorm";

import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

import * as argon2 from "argon2";
import { randomBytes, createHash } from "crypto";

import { User } from "../users/user.entity";
import { Auth } from "./auth.entity";
import { AuthPayload } from "./auth.types";

import { VerificationToken } from "./verification/verification-token.entity";
import { VerificationEmailService } from "./verification/verification-email.service";
import { VerificationLinkResult } from "./verification/verification-link-result.enum";

import { EmailSendResult } from "./verification/verification-email-send-result.enum";
import { VerifyEmailResult } from "./verification/verify-email-result.enum";


@Injectable()
export class AuthService {

    private readonly logger = new Logger(AuthService.name);

    private readonly tokenTTL: number;
    private readonly resendCooldown: number;
    private readonly maxPerHour: number;
    private readonly minPasswordLength: number;

    constructor(
        private readonly dataSource: DataSource,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Auth)
        private readonly authRepo: Repository<Auth>,

        @InjectRepository(VerificationToken)
        private readonly tokenRepo: Repository<VerificationToken>,

        private readonly jwt: JwtService,
        private readonly emailService: VerificationEmailService,
        private readonly config: ConfigService
    ) {
        this.tokenTTL = this.getPositiveIntConfig("EMAIL_VERIFICATION_TOKEN_TTL_SECONDS");
        this.resendCooldown = this.getNonNegativeIntConfig("EMAIL_VERIFICATION_RESEND_COOLDOWN_MS");
        this.maxPerHour = this.getNonNegativeIntConfig("EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR");
        this.minPasswordLength = this.getPositiveIntConfig("AUTH_MIN_PASSWORD_LENGTH");
    }

    //------------------------------------------------
    // SIGNUP
    //------------------------------------------------
    /*
    * Validates credentials, checks username/email availability in parallel inside
    * a transaction, and creates User + Auth atomically.
    *
    * Pre-checks give field-level errors for the common case. DB unique constraints
    * are the real guard — a concurrent collision falls back to a generic 400.
    * Field-level errors are thrown as plain BadRequestException messages so the
    * frontend can display them inline without parsing.
    *
    * Verification email is non-fatal: account is created regardless
    */
    async signUp(username: string, email: string, password: string): Promise<AuthPayload> {

        this.validateUsername(username);
        this.validatePassword(password);

        const normalizedEmail = this.normalizeEmail(email);

        const [existingUsername, existingEmail] = await Promise.all([
            this.userRepo.findOne({ where: { username } }),
            this.userRepo.findOne({ where: { email: normalizedEmail } })
        ]);

        if (existingUsername && existingEmail) throw new BadRequestException("Username and email already taken");
        if (existingUsername) throw new BadRequestException("Username already taken");
        if (existingEmail) throw new BadRequestException("Email already taken");

        const passwordHash = await argon2.hash(password);

        let user: User;

        try {
            user = await this.dataSource.transaction(async manager => {

                const user = manager.create(User, {
                    username,
                    displayName: username,
                    email: normalizedEmail,
                    emailVerified: false
                });

                await manager.save(user);

                await manager.save(
                    manager.create(Auth, {
                        password: passwordHash,
                        user
                    })
                );

                return user;
            });

        } catch (err) {
            if (err instanceof QueryFailedError) {
                throw new BadRequestException("Username or email already taken");
            }
            throw err;
        }

        await this.issueVerificationTokenAndSendEmail(user);

        return {
            user,
            token: this.issueAccessToken(user),
            emailVerified: user.emailVerified ?? false
        };
    }

    //------------------------------------------------
    // LOGIN
    //------------------------------------------------

    async login(identifier: string, password: string): Promise<AuthPayload> {
        const credential = await this.authRepo
            .createQueryBuilder("auth")
            .innerJoinAndSelect("auth.user", "user")
            .where("user.username = :id OR LOWER(user.email) = LOWER(:id)", {
                id: identifier
            })
            .getOne();

        // Prevents timing attacks by always running argon2.verify even when the user doesn't exist 
        // -hash must remain a valid argon2id string or verify() will short-circuit and defeat the purpose
        const fakeHash =
            "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$C3X5z0sYxS5q8u6zGdK9V9y9cH3M9b4Z0Zk";
        const hash = credential?.password ?? fakeHash;
        const valid = await argon2.verify(hash, password);
        if (!credential || !valid) {
            throw new UnauthorizedException("Invalid credentials");
        }

        return {
            user: credential.user,
            token: this.issueAccessToken(credential.user),
            emailVerified: credential.user.emailVerified
        };
    }

    //------------------------------------------------
    // VERIFY EMAIL 
    //------------------------------------------------

    async verifyEmail(rawToken: string): Promise<User> {
        const tokenHash = this.hashToken(rawToken);
        const token = await this.tokenRepo.findOne({
            where: { tokenHash, type: "email_verification" },
            relations: ["user"]
        });
        if (!token) throw new BadRequestException(VerifyEmailResult.INVALID_TOKEN);
        if (token.consumedAt) throw new BadRequestException(VerifyEmailResult.TOKEN_ALREADY_USED);
        if (token.expiresAt < new Date()) throw new BadRequestException(VerifyEmailResult.TOKEN_EXPIRED);

        // Idempotency guard: if already verified (e.g. concurrent request), skip the write.
        if (token.user.emailVerified) {
            return token.user;
        }

        await this.dataSource.transaction(async manager => {
            token.consumedAt = new Date();
            token.user.emailVerified = true;

            await manager.save(token);
            await manager.save(token.user);
        });

        this.logger.log(`Email verified userId=${token.user.id}`);
        return token.user;
    }

    //------------------------------------------------
    // PROCESS LINK (UX handler)
    //------------------------------------------------

    /**
     * Browser-facing handler for email verification links.
     * Fetches the token once and branches on its state — no double
     * DB fetch, no exceptions used as flow control, real unexpected
     * errors propagate naturally.
     */
    async processVerificationLink(rawToken: string): Promise<VerificationLinkResult> {
        const tokenHash = this.hashToken(rawToken);
        const token = await this.tokenRepo.findOne({
            where: { tokenHash, type: "email_verification" },
            relations: ["user"]
        });

        //token does not exist or is consumed
        if (!token || token.consumedAt) {
            return VerificationLinkResult.INVALID;
        }

        //user already verified
        if (token.user.emailVerified) {
            return VerificationLinkResult.ALREADY_VERIFIED;
        }

        //token is expired, attempt to send new one
        if (token.expiresAt < new Date()) {
            const resend = await this.issueVerificationTokenAndSendEmail(token.user);

            if (resend === "sent") return VerificationLinkResult.EXPIRED_RESENT;
            if (resend === "throttled") return VerificationLinkResult.EXPIRED_THROTTLED;
            return VerificationLinkResult.EXPIRED_DELIVERY_FAILED;
        }

        //verify email
        await this.dataSource.transaction(async manager => {
            token.consumedAt = new Date();
            token.user.emailVerified = true;

            await manager.save(token);
            await manager.save(token.user);
        });

        this.logger.log(`Email verified userId=${token.user.id}`);
        return VerificationLinkResult.VERIFIED;
    }

    //------------------------------------------------
    // RESEND
    //------------------------------------------------

    async resendVerification(userId: number): Promise<EmailSendResult> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException("User not found");
        if (user.emailVerified) return EmailSendResult.ALREADY_VERIFIED;

        const result = await this.issueVerificationTokenAndSendEmail(user);
        return result;
    }

    //------------------------------------------------
    // CHANGE EMAIL
    //------------------------------------------------
    async changeMyEmail(userId: number, newEmail: string, password: string) {
        const normalized = this.normalizeEmail(newEmail);
        const auth = await this.authRepo.findOne({
            where: { user: { id: userId } },
            relations: ["user"]
        });
        if (!auth) throw new UnauthorizedException();

        // Throttle check FIRST — before password verify — so the response
        // reveals nothing about password correctness during cooldown.
        const throttled = await this.isThrottled(auth.user.id);
        if (throttled) throw new HttpException('Too many verification emails sent. Please wait before trying again.', HttpStatus.TOO_MANY_REQUESTS);

        const valid = await argon2.verify(auth.password, password);
        if (!valid) throw new UnauthorizedException("Invalid password");

        auth.user.email = normalized;
        auth.user.emailVerified = false;
        try {
            await this.userRepo.save(auth.user);
        } catch (err) {
            if (err instanceof QueryFailedError) {
                throw new BadRequestException("Email already in use");
            }
            throw err;
        }

        const result = await this.issueVerificationTokenAndSendEmail(auth.user);
        if (result === EmailSendResult.FAILED) {
            this.logger.warn(`[changeMyEmail] Email delivery failed after email change userId=${auth.user.id}`);
        }
        return true;
    }

    /**
     * Checks if an email is already used by any user (case-insensitive).
     * Returns true if the email is in use, false otherwise.
     */
    async isEmailUsed(email: string) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.userRepo.findOne({ where: { email: normalizedEmail } });
        return !!user;
    }

    //------------------------------------------------
    // CHANGE PASSWORD
    //------------------------------------------------

    async changeMyPassword(
        userId: number,
        currentPassword: string,
        newPassword: string
    ) {
        this.validatePassword(newPassword);

        const auth = await this.authRepo.findOne({
            where: { user: { id: userId } },
            relations: ["user"]
        });
        if (!auth) throw new UnauthorizedException();

        const valid = await argon2.verify(auth.password, currentPassword);
        if (!valid) throw new UnauthorizedException("Invalid password");

        auth.password = await argon2.hash(newPassword);
        auth.updatedAt = new Date();

        // Both writes in a single transaction so they succeed or fail together.
        await this.dataSource.transaction(async manager => {
            await manager.save(auth);
        });

        return true;
    }

    //------------------------------------------------
    // TOKEN ISSUANCE
    //------------------------------------------------

    /**
     * Issues a new verification token and attempts email delivery.
     * Invalidates all existing unconsumed tokens atomically before
     * creating the new one, so only one active token exists at a time.
     * No rollback on delivery failure: the orphaned token is inert
     * without the email and will be invalidated on the next resend.
     */
    private async issueVerificationTokenAndSendEmail(user: User): Promise<EmailSendResult> {
        const throttled = await this.isThrottled(user.id);
        if (throttled) {
            return EmailSendResult.THROTTLED;
        }

        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = this.hashToken(rawToken);

        await this.dataSource.transaction(async manager => {
            await manager
                .createQueryBuilder()
                .update(VerificationToken)
                .set({ consumedAt: new Date() })
                .where("userId = :userId", { userId: user.id })
                .andWhere("consumedAt IS NULL")
                .execute();

            await manager.save(
                manager.create(VerificationToken, {
                    tokenHash,
                    type: "email_verification",
                    user,
                    expiresAt: new Date(Date.now() + this.tokenTTL * 1000)
                })
            );
        });

        try {
            await this.emailService.sendVerificationEmail(
                user.email,
                rawToken,
                user.username
            );
            return EmailSendResult.SENT;
        } catch (err) {
            this.logger.error(err instanceof Error ? err.stack : undefined);
            return EmailSendResult.FAILED;
        }
    }

    //------------------------------------------------
    // THROTTLE
    //------------------------------------------------ 

    private async isThrottled(userId: number) {
        const oneHourAgo = new Date(Date.now() - 3600000);

        const [latest, hourlyCount] = await Promise.all([
            this.tokenRepo.findOne({
                where: { user: { id: userId } },
                order: { createdAt: "DESC" }
            }),
            this.tokenRepo.count({
                where: {
                    user: { id: userId },
                    createdAt: MoreThan(oneHourAgo)
                }
            })
        ]);

        if (hourlyCount >= this.maxPerHour) {
            return true;
        }

        if (latest && Date.now() - latest.createdAt.getTime() < this.resendCooldown) {
            return true;
        }

        return false;
    }

    //------------------------------------------------
    // VALIDATION
    //------------------------------------------------

    private validateUsername(username: string) {
        if (!username?.trim()) {
            throw new BadRequestException("Username required");
        }
    }

    private validatePassword(password: string) {
        if (!password || password.length < this.minPasswordLength) {
            throw new BadRequestException(
                `Password must be at least ${this.minPasswordLength} characters`
            );
        }
    }

    private normalizeEmail(email?: string) {
        if (!email?.trim()) {
            throw new BadRequestException("Email required");
        }
        const normalized = email.trim().toLowerCase();
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(normalized)) {
            throw new BadRequestException("Invalid email");
        }

        return normalized;
    }

    //------------------------------------------------
    // UTILITIES
    //------------------------------------------------

    private hashToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }

    private issueAccessToken(user: User): string {
        return this.jwt.sign({
            sub: user.id,
            username: user.username
        });
    }

    //------------------------------------------------
    // CONFIG
    //------------------------------------------------

    private getPositiveIntConfig(key: string): number {
        const value = this.config.get<number>(key);
        if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
            throw new InternalServerErrorException(
                `Config error: ${key} must be a positive integer`
            );
        }
        return value;
    }

    private getNonNegativeIntConfig(key: string): number {
        const value = this.config.get<number>(key);
        if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
            throw new InternalServerErrorException(
                `Config error: ${key} must be a non-negative integer`
            );
        }
        return value;
    }

}