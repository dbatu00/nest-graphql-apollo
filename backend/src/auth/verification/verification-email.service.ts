import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Resend } from "resend";

import { getAuthI18n, normalizeBackendLanguage } from "../../common/i18n/auth.i18n";

// TODO: move transporter creation and config reads to constructor

@Injectable()
export class VerificationEmailService {
    private readonly logger = new Logger(VerificationEmailService.name);

    constructor(private readonly configService: ConfigService) { }

    isConfigured(): boolean {
        const smtpHost = this.configService.get<string>("SMTP_HOST");
        const resendApiKey =
            this.configService.get<string>("RESEND_API_KEY")
            ?? this.configService.get<string>("SMTP_PASS");

        return Boolean(smtpHost || resendApiKey);
    }

    async sendVerificationEmail(to: string, token: string, username: string, language?: string): Promise<void> {
        const normalizedLanguage = normalizeBackendLanguage(language);
        const copy = getAuthI18n(normalizedLanguage).verificationEmail;

        if (!this.isConfigured()) {
            this.logger.warn(`Email is not configured. Dev token for ${to}: ${token}`);
            return;
        }

        const appBaseUrl = this.configService.get<string>("APP_BASE_URL") ?? "http://localhost:3000";
        const from = this.configService.get<string>("EMAIL_FROM") ?? "no-reply@local.dev";
        const smtpHost = this.configService.get<string>("SMTP_HOST");
        const smtpPort = this.configService.get<number>("SMTP_PORT") ?? 1025;
        const smtpSecure = this.configService.get<boolean>("SMTP_SECURE") ?? false;
        const smtpUser = this.configService.get<string>("SMTP_USER");
        const smtpPass = this.configService.get<string>("SMTP_PASS");
        const resendApiKey = this.configService.get<string>("RESEND_API_KEY") ?? smtpPass;

        const verifyUrl = `${appBaseUrl}/auth/verify-email?token=${encodeURIComponent(token)}&lang=${encodeURIComponent(normalizedLanguage)}`;
        const html = this.buildHtmlEmail(username, verifyUrl, token, copy);
        const text = [
            `${copy.greeting} ${username},`,
            "",
            copy.intro,
            verifyUrl,
            "",
            copy.copyLink,
            token,
        ].join("\n");

        if (smtpHost) {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpSecure,
                auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
            });

            await transporter.sendMail({
                from,
                to,
                subject: copy.subject,
                text,
                html,
            });

            return;
        }

        if (!resendApiKey) {
            this.logger.warn(`Email service key is missing. Dev token for ${to}: ${token}`);
            return;
        }

        const resend = new Resend(resendApiKey);

        const { error } = await resend.emails.send({
            from,
            to,
            subject: copy.subject,
            text,
            html,
        });

        if (error) {
            throw new Error(`Resend error: ${error.message}`);
        }
    }

    private buildHtmlEmail(
        username: string,
        verifyUrl: string,
        token: string,
        copy: ReturnType<typeof getAuthI18n>["verificationEmail"]
    ): string {
        return `<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:24px;">
                        <tr>
                            <td>
                                <h2 style="margin:0 0 12px 0;color:#111827;">${copy.title}</h2>
                                <p style="margin:0 0 18px 0;color:#374151;line-height:1.5;">${copy.greeting} ${username}, ${copy.intro}</p>
                                <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">${copy.button}</a>
                                <p style="margin:18px 0 6px 0;color:#6b7280;font-size:13px;">${copy.copyLink}</p>
                                <p style="margin:0 0 16px 0;color:#1f2937;font-size:13px;word-break:break-all;">${verifyUrl}</p>
                                <p style="margin:0;color:#6b7280;font-size:12px;">${copy.manualToken}: ${token}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
    }
}
