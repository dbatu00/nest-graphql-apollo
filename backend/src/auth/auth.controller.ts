import {
    BadRequestException,
    Controller,
    Get,
    Query,
    Res,
} from "@nestjs/common";
import type { Response } from "express";

import { AuthService } from "./auth.service";
import { VerificationLinkResult } from "./verification/verification-link-result.enum";
import { getAuthI18n } from "../common/i18n/auth.i18n";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get("verify-email")
    async verifyEmailFromLink(
        @Query("token") token: string,
        @Res() res: Response,
        @Query("lang") language?: string,
    ): Promise<void> {
        const cleanToken = token?.trim();

        if (!cleanToken) {
            throw new BadRequestException("Verification token is required");
        }

        const result =
            await this.authService.processVerificationLink(cleanToken);

        const response = this.mapResult(result, language);

        res
            .status(response.status)
            .type("html")
            .send(this.renderHtmlPage(response.title, response.message));
    }

    private mapResult(result: VerificationLinkResult, language?: string): {
        status: number;
        title: string;
        message: string;
    } {
        const copy = getAuthI18n(language).verificationPage;

        switch (result) {
            case VerificationLinkResult.VERIFIED:
                return {
                    status: 200,
                    title: copy.verifiedTitle,
                    message: copy.verifiedMessage,
                };

            case VerificationLinkResult.ALREADY_VERIFIED:
                return {
                    status: 200,
                    title: copy.verifiedTitle,
                    message: copy.alreadyVerifiedMessage,
                };

            case VerificationLinkResult.EXPIRED_RESENT:
                return {
                    status: 400,
                    title: copy.expiredTitle,
                    message: copy.expiredResentMessage,
                };

            case VerificationLinkResult.EXPIRED_THROTTLED:
                return {
                    status: 429,
                    title: copy.expiredTitle,
                    message: copy.expiredThrottledMessage,
                };

            case VerificationLinkResult.EXPIRED_DELIVERY_FAILED:
                return {
                    status: 503,
                    title: copy.expiredTitle,
                    message: copy.expiredDeliveryFailedMessage,
                };

            default:
                return {
                    status: 400,
                    title: copy.invalidTitle,
                    message: copy.invalidMessage,
                };
        }
    }

    private renderHtmlPage(title: string, message: string): string {
        return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${this.escapeHtml(title)}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f5f7fb;
      margin: 0;
      padding: 24px;
    }
    .card {
      max-width: 480px;
      margin: 48px auto;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 24px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 22px;
      color: #111827;
    }
    p {
      margin: 0;
      color: #374151;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${this.escapeHtml(title)}</h1>
    <p>${this.escapeHtml(message)}</p>
  </div>
</body>
</html>`;
    }

    private escapeHtml(input: string): string {
        return input
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
}