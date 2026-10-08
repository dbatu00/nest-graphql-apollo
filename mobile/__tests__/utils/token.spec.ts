import * as SecureStore from 'expo-secure-store';

import {
    clearToken,
    getRefreshToken,
    getToken,
    saveRefreshToken,
    saveToken,
} from '../../utils/token';
import { silenceConsole } from '../test-utils/jest';

describe('token utils', () => {
    const secureStore = SecureStore as jest.Mocked<typeof SecureStore>;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        warnSpy = silenceConsole('warn');
        globalThis.localStorage.getItem = jest.fn();
        globalThis.localStorage.setItem = jest.fn();
        globalThis.localStorage.removeItem = jest.fn();
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    it('saves access token to localStorage', async () => {
        await saveToken('token-1');

        expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('auth_token', 'token-1');
        expect(secureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('reads access token from localStorage', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue('token-2');

        await expect(getToken()).resolves.toBe('token-2');
        expect(globalThis.localStorage.getItem).toHaveBeenCalledWith('auth_token');
    });

    it('saves and reads refresh token from localStorage', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue('refresh-2');

        await saveRefreshToken('refresh-2');
        const refreshToken = await getRefreshToken();

        expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('auth_refresh_token', 'refresh-2');
        expect(refreshToken).toBe('refresh-2');
    });

    it('removes all auth-related keys in clearToken', async () => {
        await clearToken();

        expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('auth_token');
        expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('auth_refresh_token');
        expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('auth_email_verified');
    });

    it('returns null when token read throws', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockImplementation(() => {
            throw new Error('storage read blocked');
        });

        await expect(getToken()).resolves.toBeNull();
    });
});
