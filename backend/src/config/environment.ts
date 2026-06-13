//validate, normalize, return config values as a typed object

type RawEnv = Record<string, unknown>;

function asString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function asPositiveInt(value: unknown, fallback?: number): number {
    if (typeof value === 'number') {
        if (Number.isInteger(value) && value > 0) {
            return value;
        }
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();

        // Reject floats, scientific notation, hex, etc.
        if (/^\d+$/.test(trimmed)) {
            const parsed = Number(trimmed);

            if (Number.isSafeInteger(parsed) && parsed > 0) {
                return parsed;
            }
        }
    }

    if (fallback !== undefined) {
        return fallback;
    }

    throw new Error(
        `Environment variable must be a positive integer, got "${String(value)}"`,
    );
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

    if (origins.length === 0) {
        return fallback;
    }

    return origins.map((origin) => {
        let url: URL;

        try {
            url = new URL(origin);
        } catch {
            throw new Error(
                `CORS origin must be a valid URL, got "${origin}"`,
            );
        }

        if (
            url.protocol !== 'http:' &&
            url.protocol !== 'https:'
        ) {
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
        if (fallback !== undefined) {
            return fallback;
        }

        throw new Error('Environment variable is required');
    }

    try {
        const url = new URL(raw);

        if (
            url.protocol !== 'http:' &&
            url.protocol !== 'https:'
        ) {
            throw new Error();
        }

        return raw;
    } catch {
        throw new Error(
            `Environment variable must be a valid URL, got "${raw}"`,
        );
    }
}

function asEmail(value: unknown, fallback?: string): string {
    const raw = asString(value);

    if (raw === undefined) {
        if (fallback !== undefined) {
            return fallback;
        }

        throw new Error('Environment variable is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(raw)) {
        throw new Error(
            `Environment variable must be a valid email, got "${raw}"`,
        );
    }

    return raw;
}

//returnsa spread of the original config with validated/normalized values overlaid
export function validateEnvironment(config: RawEnv): RawEnv {
    const nodeEnv = asString(config.NODE_ENV) ?? 'development';

    // In tests allow a fallback secret to keep unit tests isolated from shell env setup.
    const jwtSecret =
        asString(config.JWT_SECRET) ??
        (nodeEnv === 'test' ? 'test-secret' : undefined);

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

        PORT: asPositiveInt(config.PORT, 3000),

        APP_BASE_URL: asUrl(
            config.APP_BASE_URL,
            'http://localhost:3000',
        ),

        AUTH_MIN_PASSWORD_LENGTH: asPositiveInt(
            config.AUTH_MIN_PASSWORD_LENGTH,
            8,
        ),

        JWT_SECRET: jwtSecret,

        // Kept configurable so we can tighten/rotate policy without changing code.
        JWT_EXPIRES_IN:
            asString(config.JWT_EXPIRES_IN) ?? '15m',

        DB_HOST:
            asString(config.DB_HOST) ?? 'localhost',

        DB_PORT: asPositiveInt(config.DB_PORT, 5432),

        DB_USERNAME:
            asString(config.DB_USERNAME) ?? 'postgres',

        DB_PASSWORD: dbPassword,

        DB_NAME:
            asString(config.DB_NAME) ?? 'nest_graphql',

        // Schema sync is only safe in local development.
        // Disabled by default in test and production — set explicitly to override.
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

        GRAPHQL_MAX_DEPTH: asPositiveInt(
            config.GRAPHQL_MAX_DEPTH,
            8,
        ),

        RATE_LIMIT_TTL: asPositiveInt(
            config.RATE_LIMIT_TTL,
            60_000,
        ),

        RATE_LIMIT_LIMIT: asPositiveInt(
            config.RATE_LIMIT_LIMIT,
            120,
        ),

        SMTP_HOST: asString(config.SMTP_HOST),

        SMTP_PORT: asPositiveInt(
            config.SMTP_PORT,
            1025,
        ),

        SMTP_USER: asString(config.SMTP_USER),

        SMTP_PASS: asString(config.SMTP_PASS),

        SMTP_SECURE: asBoolean(
            config.SMTP_SECURE,
            false,
        ),

        EMAIL_FROM: asEmail(
            config.EMAIL_FROM,
            'no-reply@local.dev',
        ),

        EMAIL_VERIFICATION_TOKEN_TTL_SECONDS:
            asPositiveInt(
                config.EMAIL_VERIFICATION_TOKEN_TTL_SECONDS,
                24 * 60 * 60,
            ),

        EMAIL_VERIFICATION_RESEND_COOLDOWN_MS:
            asPositiveInt(
                config.EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
                60_000,
            ),

        EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR:
            asPositiveInt(
                config.EMAIL_VERIFICATION_RESEND_MAX_PER_HOUR,
                5,
            ),

    };
}