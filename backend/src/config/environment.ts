type RawEnv = Record<string, unknown>;

function asString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function asNumber(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value !== 'string') {
        return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value !== 'string') {
        return fallback;
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === 'true' || normalized === '1') {
        return true;
    }

    if (normalized === 'false' || normalized === '0') {
        return false;
    }

    return fallback;
}

function asOrigins(value: unknown, fallback: string[]): string[] {
    if (Array.isArray(value)) {
        const origins = value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
        return origins.length > 0 ? origins : fallback;
    }

    if (typeof value !== 'string') {
        return fallback;
    }

    const origins = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    return origins.length > 0 ? origins : fallback;
}

export function validateEnvironment(config: RawEnv): RawEnv {
    const nodeEnv = asString(config.NODE_ENV) ?? 'development';
    // In tests we allow a fallback secret to keep unit tests isolated from shell env setup.
    const jwtSecret = asString(config.JWT_SECRET) ?? (nodeEnv === 'test' ? 'test-secret' : undefined);
    const dbPassword = asString(config.DB_PASSWORD) ?? '';

    if (!jwtSecret) {
        throw new Error('JWT_SECRET is required');
    }

    if (nodeEnv !== 'test' && dbPassword.length === 0) {
        throw new Error('DB_PASSWORD is required');
    }

    return {
        ...config,
        NODE_ENV: nodeEnv,
        PORT: asNumber(config.PORT, 3000),
        APP_BASE_URL: asString(config.APP_BASE_URL) ?? 'http://localhost:3000',
        JWT_SECRET: jwtSecret,
        // Kept configurable so we can tighten/rotate policy without changing code.
        JWT_EXPIRES_IN: asString(config.JWT_EXPIRES_IN) ?? '15m',
        DB_HOST: asString(config.DB_HOST) ?? 'localhost',
        DB_PORT: asNumber(config.DB_PORT, 5432),
        DB_USERNAME: asString(config.DB_USERNAME) ?? 'postgres',
        DB_PASSWORD: dbPassword,
        DB_NAME: asString(config.DB_NAME) ?? 'nest_graphql',
        // Auto-sync remains development-friendly but is disabled by default in production.
        DB_SYNCHRONIZE: asBoolean(config.DB_SYNCHRONIZE, nodeEnv !== 'production'),
        // Comma-separated env value supports per-environment allowlists without code edits.
        CORS_ORIGINS: asOrigins(config.CORS_ORIGINS, [
            'http://localhost:19006',
            'http://localhost:8081',
            'http://localhost:3000',
        ]),
        GRAPHQL_MAX_DEPTH: asNumber(config.GRAPHQL_MAX_DEPTH, 8),
        RATE_LIMIT_TTL: asNumber(config.RATE_LIMIT_TTL, 60_000),
        RATE_LIMIT_LIMIT: asNumber(config.RATE_LIMIT_LIMIT, 120),
        SMTP_HOST: asString(config.SMTP_HOST),
        SMTP_PORT: asNumber(config.SMTP_PORT, 1025),
        SMTP_USER: asString(config.SMTP_USER),
        SMTP_PASS: asString(config.SMTP_PASS),
        SMTP_SECURE: asBoolean(config.SMTP_SECURE, false),
        EMAIL_FROM: asString(config.EMAIL_FROM) ?? 'no-reply@local.dev',
    };
}
