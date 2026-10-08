describe('env', () => {
    const ORIGINAL_ENV = process.env.EXPO_PUBLIC_API_URL;

    function loadEnvModule() {
        let mod: { env: { API_URL: string } } | undefined;

        jest.isolateModules(() => {
            mod = require('../../utils/env');
        });

        return mod as { env: { API_URL: string } };
    }

    afterEach(() => {
        jest.resetModules();
        process.env.EXPO_PUBLIC_API_URL = ORIGINAL_ENV;
    });

    it('loads API_URL when EXPO_PUBLIC_API_URL is valid', () => {
        process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/graphql';

        const { env } = loadEnvModule();

        expect(env.API_URL).toBe('https://api.example.com/graphql');
    });

    it('throws when EXPO_PUBLIC_API_URL is missing', () => {
        delete process.env.EXPO_PUBLIC_API_URL;

        expect(() => loadEnvModule()).toThrow('EXPO_PUBLIC_API_URL is not set');
    });

    it('throws when EXPO_PUBLIC_API_URL is empty', () => {
        process.env.EXPO_PUBLIC_API_URL = '   ';

        expect(() => loadEnvModule()).toThrow('EXPO_PUBLIC_API_URL is set but empty');
    });

    it('throws when protocol is not http/https', () => {
        process.env.EXPO_PUBLIC_API_URL = 'ftp://api.example.com/graphql';

        expect(() => loadEnvModule()).toThrow('Unsupported protocol: ftp:');
    });

    it('throws when EXPO_PUBLIC_API_URL is not a valid URL', () => {
        process.env.EXPO_PUBLIC_API_URL = 'not-a-url';

        expect(() => loadEnvModule()).toThrow('EXPO_PUBLIC_API_URL is not a valid URL');
    });
});
