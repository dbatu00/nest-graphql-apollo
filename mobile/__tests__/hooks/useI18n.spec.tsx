import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { I18nProvider, useI18n } from '../../hooks/useI18n';

describe('useI18n', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider>{children}</I18nProvider>
    );

    beforeEach(() => {
        jest.clearAllMocks();
        (global.localStorage.getItem as jest.Mock).mockReturnValue(null);
    });

    it('defaults to english when there is no stored language', async () => {
        const { result } = renderHook(() => useI18n(), { wrapper });

        await waitFor(() => {
            expect(result.current.language).toBe('en');
        });

        expect(result.current.t('auth.login.title')).toBe('Login');
    });

    it('hydrates language from localStorage when value is valid', async () => {
        (global.localStorage.getItem as jest.Mock).mockReturnValue('tr');

        const { result } = renderHook(() => useI18n(), { wrapper });

        await waitFor(() => {
            expect(result.current.language).toBe('tr');
        });

        expect(result.current.t('auth.login.title')).toBe('Giriş Yap');
    });

    it('ignores invalid stored language values', async () => {
        (global.localStorage.getItem as jest.Mock).mockReturnValue('es');

        const { result } = renderHook(() => useI18n(), { wrapper });

        await waitFor(() => {
            expect(result.current.language).toBe('en');
        });
    });

    it('setLanguage updates state and persists to storage', async () => {
        const { result } = renderHook(() => useI18n(), { wrapper });

        await act(async () => {
            await result.current.setLanguage('de');
        });

        await waitFor(() => {
            expect(result.current.language).toBe('de');
        });

        expect(global.localStorage.setItem).toHaveBeenCalledWith('app_language', 'de');
    });

    it('setLanguage changes translation output for another locale', async () => {
        const { result } = renderHook(() => useI18n(), { wrapper });

        await act(async () => {
            await result.current.setLanguage('tr');
        });

        await waitFor(() => {
            expect(result.current.language).toBe('tr');
        });

        expect(result.current.t('common.home')).toBe('Ana Sayfa');
    });

    it('continues to work when reading language throws', async () => {
        (global.localStorage.getItem as jest.Mock).mockImplementation(() => {
            throw new Error('storage read failed');
        });

        const { result } = renderHook(() => useI18n(), { wrapper });

        await waitFor(() => {
            expect(result.current.language).toBe('en');
        });
    });

    it('updates in-memory language even when persisting throws', async () => {
        (global.localStorage.setItem as jest.Mock).mockImplementation(() => {
            throw new Error('storage write failed');
        });

        const { result } = renderHook(() => useI18n(), { wrapper });

        await act(async () => {
            await result.current.setLanguage('de');
        });

        await waitFor(() => {
            expect(result.current.language).toBe('de');
        });
    });

    it('falls back to key when translation is unknown', async () => {
        const { result } = renderHook(() => useI18n(), { wrapper });

        await waitFor(() => {
            expect(result.current.language).toBe('en');
        });

        expect(result.current.t('missing.translation.key' as any)).toBe('missing.translation.key');
    });

    it('throws when hook is used outside provider', () => {
        expect(() => renderHook(() => useI18n())).toThrow('useI18n must be used inside I18nProvider');
    });
});
