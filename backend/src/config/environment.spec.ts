import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
    it('returns normalized config values for a valid test config', () => {
        const config = validateEnvironment({
            NODE_ENV: 'test',
            PORT: '4000',
            JWT_SECRET: 'test-secret',
            DB_PASSWORD: 'secret',
            CORS_ORIGINS: 'https://app.example.com,https://admin.example.com',
            EMAIL_FROM: 'noreply@example.com',
        });

        expect(config.NODE_ENV).toBe('test');
        expect(config.PORT).toBe(4000);
        expect(config.JWT_SECRET).toBe('test-secret');
        expect(config.CORS_ORIGINS).toEqual([
            'https://app.example.com',
            'https://admin.example.com',
        ]);
    });

    it('throws for invalid boolean values', () => {
        expect(() =>
            validateEnvironment({
                NODE_ENV: 'test',
                PORT: '3000',
                JWT_SECRET: 'test-secret',
                DB_PASSWORD: 'secret',
                DB_SYNCHRONIZE: 'not-a-bool',
                EMAIL_FROM: 'noreply@example.com',
            }),
        ).toThrow('must be true/false/1/0');
    });
});
