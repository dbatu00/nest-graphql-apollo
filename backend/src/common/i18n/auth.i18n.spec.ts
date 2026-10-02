import { getAuthI18n, normalizeBackendLanguage } from './auth.i18n';

describe('auth i18n', () => {
    it('falls back to English for unknown languages', () => {
        expect(normalizeBackendLanguage('fr')).toBe('en');
        expect(getAuthI18n('fr').login.invalidCredentials).toBe('Invalid credentials');
    });

    it('returns Turkish copy for Turkish language', () => {
        const i18n = getAuthI18n('tr');

        expect(i18n.verificationEmail.subject).toBe('E-postanı doğrula');
        expect(i18n.login.tooManyAttempts(5)).toContain('5 dakika');
    });
});
