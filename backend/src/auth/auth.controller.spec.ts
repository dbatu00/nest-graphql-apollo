import { BadRequestException } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { VerificationLinkResult } from './verification/verification-link-result.enum';

describe('AuthController', () => {
    const createAuthService = () => ({
        processVerificationLink: jest.fn(),
    });

    const createResponse = () => {
        const res: any = {
            status: jest.fn(),
            type: jest.fn(),
            send: jest.fn(),
        };

        res.status.mockReturnValue(res);
        res.type.mockReturnValue(res);
        res.send.mockReturnValue(res);

        return res;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('throws when verification token is missing', async () => {
        const controller = new AuthController(createAuthService() as any);
        const res = createResponse();

        await expect(controller.verifyEmailFromLink('   ', res as any, 'en')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('maps VERIFIED result to 200 page response', async () => {
        const authService = createAuthService();
        authService.processVerificationLink.mockResolvedValue(VerificationLinkResult.VERIFIED);
        const controller = new AuthController(authService as any);
        const res = createResponse();

        await controller.verifyEmailFromLink(' token-1 ', res as any, 'en');

        expect(authService.processVerificationLink).toHaveBeenCalledWith('token-1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.type).toHaveBeenCalledWith('html');
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Email verified'));
    });

    it('maps EXPIRED_THROTTLED to 429 and localizes title in Turkish', async () => {
        const authService = createAuthService();
        authService.processVerificationLink.mockResolvedValue(VerificationLinkResult.EXPIRED_THROTTLED);
        const controller = new AuthController(authService as any);
        const res = createResponse();

        await controller.verifyEmailFromLink('token-2', res as any, 'tr');

        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Bağlantının süresi doldu'));
    });

    it('maps invalid/default result to 400 response', async () => {
        const authService = createAuthService();
        authService.processVerificationLink.mockResolvedValue(VerificationLinkResult.INVALID);
        const controller = new AuthController(authService as any);
        const res = createResponse();

        await controller.verifyEmailFromLink('token-3', res as any, 'de');

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('escapes html in rendered page content', async () => {
        const controller = new AuthController(createAuthService() as any);

        const html = (controller as any).renderHtmlPage(
            '<script>alert(1)</script>',
            `a&b<c>d"e'f`,
        ) as string;

        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(html).toContain('a&amp;b&lt;c&gt;d&quot;e&#039;f');
        expect(html).not.toContain('<script>alert(1)</script>');
    });
});
