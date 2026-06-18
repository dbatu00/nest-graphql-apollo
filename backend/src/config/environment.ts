// Validate, normalize, and return config values as a typed object.
// Called by ConfigModule at startup — any throw here aborts the process
// before the app accepts any connections.

type RawEnv = Record<string, unknown>;

function asString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function asPositiveInt(value: unknown, fallback?: number): number {
    if (typeof value === 'number') {
        if (Number.isInteger(value) && value > 0) return value;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        // Reject floats, scientific notation, hex, etc.
        if (/^\d+$/.test(trimmed)) {
            const parsed = Number(trimmed);
            if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
        }
    }

    if (fallback !== undefined) return fallback;

    throw new Error(
        `Environment variable must be a positive integer, got "${String(value)}"`,
    );
}

// Throws on unrecognized values rather than silently falling back.
// A typo in DB_SYNCHRONIZE or SMTP_SECURE should fail loudly at startup.
function asBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;

    if (typeof value === 'undefined' || value === null) return fallback;

    if (typeof value !== 'string') {
        throw new Error(
            `Environment variable must be a boolean, got "${String(value)}"`,
        );
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === '') return fallback;
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;

    throw new Error(
        `Environment variable must be true/false/1/0, got "${value}"`,
    );
}

function asOrigins(value: unknown, fallback: string[]): string[] {
    const origins =
        Array.isArray(value)
            ? value
                .filter((item): item is string => typeof item === 'string')
                .map((item) => item.trim())
                .filter(Boolean)
            : typeof value === 'string'
                ? value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                : fallback;

    if (origins.length === 0) return fallback;

    return origins.map((origin) => {
        let url: URL;

        try {
            url = new URL(origin);
        } catch {
            throw new Error(`CORS origin must be a valid URL, got "${origin}"`);
        }

        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error(
                `CORS origin must use http or https, got "${origin}"`,
            );
        }

        return url.origin;
    });
}

function asUrl(value: unknown, fallback?: string): string {
    const raw = asString(value);

    if (raw === undefined) {
        if (fallback !== undefined) return fallback;
        throw new Error('Environment variable is required');
    }

    try {
        const url = new URL(raw);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
        return raw;
    } catch {
        throw new Error(`Environment variable must be a valid URL, got "${raw}"`);
    }
}

function asEmail(value: unknown, fallback?: string): string {
    const raw = asString(value);

    if (raw === undefined) {
        if (fallback !== undefined) return fallback;
        throw new Error('Environment variable is required');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        throw new Error(`Environment variable must be a valid email, got "${raw}"`);
    }

    return raw;
}

// Matches ms/s/m/h/d suffixes as used by jsonwebtoken.
function asJwtDuration(value: unknown, fallback: string): string {
    const raw = asString(value);
    if (raw === undefined) return fallback;

    if (!/^\d+(?:ms|s|m|h|d)$/.test(raw)) {
        throw new Error(
            `JWT_EXPIRES_IN must be a duration like 15m, 1h, 7d, got "${raw}"`,
        );
    }

    return raw;
}

// Returns a spread of the original config with validated/normalized values overlaid.
// All values returned here are guaranteed to be the correct type for their key.
export function validateEnvironment(config: RawEnv): RawEnv {
    const nodeEnv = asString(config.NODE_ENV) ?? 'development';
    const isTest = nodeEnv === 'test';

    // Allow a fallback secret in tests to keep unit tests isolated from shell env.
    const jwtSecret = asString(config.JWT_SECRET) ?? (isTest ? 'test-secret' : undefined);

    if (!jwtSecret) {
        throw new Error('JWT_SECRET is required');
    }

    const dbPassword = asString(config.DB_PASSWORD) ?? '';

    if (!isTest && dbPassword.length === 0) {
        throw new Error('DB_PASSWORD is required');
    }

    // Validate SMTP as a group: if a host is given, credentials must follow.
    const smtpHost = asString(config.SMTP_HOST);
    const smtpUser = asString(config.SMTP_USER);
    const smtpPass = asString(config.SMTP_PASS);

    if (smtpHost && (!smtpUser || !smtpPass)) {
        throw new Error(
            'SMTP_USER and SMTP_PASS are required when SMTP_HOST is set',
        );
    }

    return {
        ...config,

        NODE_ENV: nodeEnv,

        PORT: asPositiveInt(config.PORT, 3000),

        APP_BASE_URL: asUrl(config.APP_BASE_URL, 'http://localhost:3000'),

        AUTH_MIN_PASSWORD_LENGTH: asPositiveInt(config.AUTH_MIN_PASSWORD_LENGTH, 8),

        JWT_SECRET: jwtSecret,

        // Kept configurable so we can rotate expiry policy without code changes.
        JWT_EXPIRES_IN: asJwtDuration(config.JWT_EXPIRES_IN, '15m'),

        DB_HOST: asString(config.DB_HOST) ?? 'localhost',

        DB_PORT: asPositiveInt(config.DB_PORT, 5432),

        DB_USERNAME: asString(config.DB_USERNAME) ?? 'postgres',

        DB_PASSWORD: dbPassword,

        DB_NAME: asString(config.DB_NAME) ?? 'nest_graphql',

        // Schema sync drops/recreates columns — only safe in local development.
        // Defaults to false in test and production; set explicitly to override.
        DB_SYNCHRONIZE: asBoolean(
            config.DB_SYNCHRONIZE,
            nodeEnv === 'development',
        ),

        // Comma-separated env value supports per-environment allowlists without code edits.
        CORS_ORIGINS: asOrigins(config.CORS_ORIGINS, [
            'http://localhost:19006',
            'http://localhost:8081',
            'http://localhost:3000',
        ]),

        GRAPHQL_MAX_DEPTH: asPositiveInt(config.GRAPHQL_MAX_DEPTH, 8),

        RATE_LIMIT_TTL: asPositiveInt(config.RATE_LIMIT_TTL, 60_000),

        RATE_LIMIT_LIMIT: asPositiveInt(config.RATE_LIMIT_LIMIT, 120),

        SMTP_HOST: smtpHost,

        SMTP_PORT: asPositiveInt(config.SMTP_PORT, 1025),

        SMTP_USER: smtpUser,

        SMTP_PASS: smtpPass,

        SMTP_SECURE: asBoolean(config.SMTP_SECURE, false),

        EMAIL_FROM: asEmail(config.EMAIL_FROM, 'no-reply@local.dev'),

        EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: asPositiveInt(
            config.EMAIL_VERIFICATION_TOKEN_TTL_SECONDS,
            24 * 60 * 60,
        ),

        EMAIL_VERIFICATION_RESEND_COOLDOWN_MS: asPositiveInt(
            config.EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
            60_000,
        ),

        EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR: asPositiveInt(
            config.EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR,
            5,
        ),
    };
}