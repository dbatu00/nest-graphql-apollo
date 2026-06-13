/**
 * Validates that EXPO_PUBLIC_API_URL is set and is a well-formed URL.
 * Throws at module import time so misconfiguration is caught immediately.
 */
function getApiUrl(): string {
    const raw = process.env.EXPO_PUBLIC_API_URL;

    if (!raw) {
        throw new Error(
            'EXPO_PUBLIC_API_URL is not set. ' +
            'Create a mobile/.env file (see mobile/.env.example) ' +
            'with EXPO_PUBLIC_API_URL=http://localhost:3000/graphql'
        );
    }

    const trimmed = raw.trim();
    if (!trimmed) {
        throw new Error('EXPO_PUBLIC_API_URL is set but empty');
    }

    try {
        const url = new URL(trimmed);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error(`Unsupported protocol: ${url.protocol}`);
        }
        return trimmed;
    } catch (err) {
        if (err instanceof TypeError) {
            throw new Error(
                `EXPO_PUBLIC_API_URL is not a valid URL: "${trimmed}". ` +
                'Expected something like http://localhost:3000/graphql'
            );
        }
        throw err;
    }
}

export const env = {
    API_URL: getApiUrl(),
} as const;