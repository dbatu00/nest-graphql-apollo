import { BadRequestException, Controller, Get, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { VerificationLinkResult } from "./verification/verification-link.types";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // Email clients open a normal URL, so verification entrypoint is HTTP controller (not GraphQL mutation).
    @Get("verify-email")
    async verifyEmailFromLink(
        @Query("token") token: string,
        @Res() res: Response,
    ): Promise<void> {
        if (!token?.trim()) {
            throw new BadRequestException("Verification token is required");
        }

        // Service returns typed outcome; controller maps it to user-facing HTML and status code.
        const result: VerificationLinkResult = await this.authService.processVerificationLink(token);

        if (result.status === "verified") {
            res.status(200).type("html").send(this.renderHtmlPage("Email verified", "Your email has been verified. You can return to the app and log in."));
            return;
        }

        if (result.status === "expired_resent") {
            res.status(400).type("html").send(this.renderHtmlPage("Link expired", "This verification link has expired. We sent a new verification email. Please check your inbox."));
            return;
        }

        if (result.status === "expired_throttled") {
            res.status(429).type("html").send(this.renderHtmlPage("Link expired", "This verification link has expired. Please wait briefly before trying again."));
            return;
        }

        if (result.status === "expired_delivery_failed") {
            res.status(503).type("html").send(this.renderHtmlPage("Link expired", "This verification link has expired, and we could not send a new verification email right now. Please try again shortly."));
            return;
        }

        res.status(400).type("html").send(this.renderHtmlPage("Verification failed", "This verification link is invalid or already used."));
    }

    private renderHtmlPage(title: string, message: string): string {
        return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f7fb; margin: 0; padding: 24px; }
    .card { max-width: 480px; margin: 48px auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; }
    h1 { margin: 0 0 12px; font-size: 22px; color: #111827; }
    p { margin: 0; color: #374151; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
    }
}
