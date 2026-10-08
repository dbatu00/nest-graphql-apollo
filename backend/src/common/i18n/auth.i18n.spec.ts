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

    it('returns German copy for German language', () => {
        const i18n = getAuthI18n('de');

        expect(i18n.verificationEmail.subject).toBe('E-Mail bestätigen');
        expect(i18n.login.tooManyAttempts(3)).toContain('3 Minuten');
    });

    it('falls back to English when language is missing', () => {
        expect(normalizeBackendLanguage(undefined)).toBe('en');
        expect(getAuthI18n(undefined).verificationPage.verifiedTitle).toBe('Email verified');
    });
});
