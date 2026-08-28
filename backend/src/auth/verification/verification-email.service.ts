import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Resend } from "resend";

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

    async sendVerificationEmail(to: string, token: string, username: string): Promise<void> {
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

        const verifyUrl = `${appBaseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;
        const html = this.buildHtmlEmail(username, verifyUrl, token);
        const text = [
            `Hi ${username},`,
            "",
            "Please verify your email by opening this link:",
            verifyUrl,
            "",
            "If the link does not open, you can still verify manually with token:",
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
                subject: "Verify your email",
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
            subject: "Verify your email",
            text,
            html,
        });

        if (error) {
            throw new Error(`Resend error: ${error.message}`);
        }
    }

    private buildHtmlEmail(username: string, verifyUrl: string, token: string): string {
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
                                <h2 style="margin:0 0 12px 0;color:#111827;">Verify your email</h2>
                                <p style="margin:0 0 18px 0;color:#374151;line-height:1.5;">Hi ${username}, please verify your email to complete account setup.</p>
                                <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Verify Email</a>
                                <p style="margin:18px 0 6px 0;color:#6b7280;font-size:13px;">If the button doesn't work, copy this link:</p>
                                <p style="margin:0 0 16px 0;color:#1f2937;font-size:13px;word-break:break-all;">${verifyUrl}</p>
                                <p style="margin:0;color:#6b7280;font-size:12px;">Manual token fallback: ${token}</p>
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
