import { BadRequestException, Controller, Get, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get("verify-email")
    async verifyEmailFromLink(
        @Query("token") token: string,
        @Res() res: Response,
    ): Promise<void> {
        if (!token?.trim()) {
            throw new BadRequestException("Verification token is required");
        }

        try {
            await this.authService.verifyEmail(token);
            res.status(200).type("html").send(this.renderHtmlPage("Email verified", "Your email has been verified. You can return to the app and log in."));
        } catch {
            res.status(400).type("html").send(this.renderHtmlPage("Verification failed", "This verification link is invalid, expired, or already used."));
        }
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
