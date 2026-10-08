import { VerificationEmailService } from './verification-email.service';

const sendMail = jest.fn();
const createTransport = jest.fn(() => ({ sendMail }));

const resendSend = jest.fn();
const resendCtor = jest.fn(() => ({
    emails: {
        send: resendSend,
    },
}));

jest.mock('nodemailer', () => ({
    createTransport: (...args: unknown[]) =>
        (createTransport as (...values: unknown[]) => unknown)(...args),
}));

jest.mock('resend', () => ({
    Resend: function (...args: unknown[]) {
        return (resendCtor as (...values: unknown[]) => unknown)(...args);
    },
}));

describe('VerificationEmailService', () => {
    const createConfigService = (overrides: Record<string, unknown> = {}) => {
        const defaults: Record<string, unknown> = {
            SMTP_HOST: undefined,
            RESEND_API_KEY: undefined,
            SMTP_PASS: undefined,
            APP_BASE_URL: 'http://localhost:3000',
            EMAIL_FROM: 'no-reply@local.dev',
            SMTP_PORT: 1025,
            SMTP_SECURE: false,
            SMTP_USER: undefined,
        };

        const values = { ...defaults, ...overrides };

        return {
            get: jest.fn((key: string) => values[key]),
        };
    };

    beforeEach(() => {
        jest.clearAllMocks();
        sendMail.mockResolvedValue(undefined);
        resendSend.mockResolvedValue({ error: null });
    });

    it('isConfigured returns true when SMTP host exists', () => {
        const service = new VerificationEmailService(createConfigService({ SMTP_HOST: 'smtp.local' }) as any);
        expect(service.isConfigured()).toBe(true);
    });

    it('isConfigured returns true when Resend key exists', () => {
        const service = new VerificationEmailService(createConfigService({ RESEND_API_KEY: 'resend-key' }) as any);
        expect(service.isConfigured()).toBe(true);
    });

    it('isConfigured returns false when neither SMTP nor Resend config exists', () => {
        const service = new VerificationEmailService(createConfigService() as any);
        expect(service.isConfigured()).toBe(false);
    });

    it('returns early and warns when email is not configured', async () => {
        const service = new VerificationEmailService(createConfigService() as any);
        const warnSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);

        await service.sendVerificationEmail('a@example.com', 'token', 'alice', 'en');

        expect(warnSpy).toHaveBeenCalled();
        expect(createTransport).not.toHaveBeenCalled();
        expect(resendCtor).not.toHaveBeenCalled();
    });

    it('uses nodemailer SMTP path when SMTP_HOST exists', async () => {
        const service = new VerificationEmailService(
            createConfigService({
                SMTP_HOST: 'smtp.local',
                SMTP_USER: 'u',
                SMTP_PASS: 'p',
                EMAIL_FROM: 'from@example.com',
            }) as any,
        );

        await service.sendVerificationEmail('a@example.com', 'token-1', 'alice', 'tr');

        expect(createTransport).toHaveBeenCalled();
        expect(createTransport).toHaveBeenCalledWith(
            expect.objectContaining({
                host: 'smtp.local',
                port: 1025,
                secure: false,
                auth: { user: 'u', pass: 'p' },
            }),
        );
        expect(sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                from: 'from@example.com',
                to: 'a@example.com',
                subject: 'E-postanı doğrula',
            }),
        );
        expect(resendCtor).not.toHaveBeenCalled();
    });

    it('uses Resend path when SMTP host is missing and API key exists', async () => {
        const service = new VerificationEmailService(
            createConfigService({ RESEND_API_KEY: 'resend-key', EMAIL_FROM: 'from@example.com' }) as any,
        );

        await service.sendVerificationEmail('a@example.com', 'token-1', 'alice', 'de');

        expect(resendCtor).toHaveBeenCalledWith('resend-key');
        expect(resendSend).toHaveBeenCalledWith(
            expect.objectContaining({
                from: 'from@example.com',
                to: 'a@example.com',
                subject: 'E-Mail bestätigen',
            }),
        );
    });

    it('uses SMTP path even when Resend key also exists', async () => {
        const service = new VerificationEmailService(
            createConfigService({
                SMTP_HOST: 'smtp.local',
                RESEND_API_KEY: 'resend-key',
                EMAIL_FROM: 'from@example.com',
            }) as any,
        );

        await service.sendVerificationEmail('a@example.com', 'token-1', 'alice', 'en');

        expect(createTransport).toHaveBeenCalled();
        expect(resendCtor).not.toHaveBeenCalled();
    });

    it('builds english fallback email and encodes token/lang in verification link', async () => {
        const service = new VerificationEmailService(
            createConfigService({ SMTP_HOST: 'smtp.local' }) as any,
        );

        await service.sendVerificationEmail('a@example.com', 'a+b c/?=', 'alice', 'fr');

        expect(sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: 'Verify your email',
                text: expect.stringContaining('lang=en'),
                html: expect.stringContaining('lang=en'),
            }),
        );

        const html = sendMail.mock.calls[0][0].html as string;
        expect(html).toContain('token=a%2Bb%20c%2F%3F%3D');
    });

    it('omits SMTP auth config when SMTP user/pass are missing', async () => {
        const service = new VerificationEmailService(
            createConfigService({ SMTP_HOST: 'smtp.local' }) as any,
        );

        await service.sendVerificationEmail('a@example.com', 'token-1', 'alice', 'en');

        expect(createTransport).toHaveBeenCalledWith(
            expect.objectContaining({
                auth: undefined,
            }),
        );
    });

    it('throws when Resend returns an error object', async () => {
        resendSend.mockResolvedValue({ error: { message: 'boom' } });

        const service = new VerificationEmailService(
            createConfigService({ RESEND_API_KEY: 'resend-key' }) as any,
        );

        await expect(
            service.sendVerificationEmail('a@example.com', 'token-1', 'alice', 'en'),
        ).rejects.toThrow('Resend error: boom');
    });

    it('isConfigured returns true when SMTP_PASS exists without explicit RESEND_API_KEY', () => {
        const service = new VerificationEmailService(createConfigService({ SMTP_PASS: 'smtp-pass' }) as any);
        expect(service.isConfigured()).toBe(true);
    });
});
