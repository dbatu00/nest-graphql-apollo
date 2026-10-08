import * as SecureStore from 'expo-secure-store';

import { getStoredAppLanguage } from '../../utils/appLanguage';

describe('appLanguage', () => {
    const secureStore = SecureStore as jest.Mocked<typeof SecureStore>;

    beforeEach(() => {
        jest.clearAllMocks();
        globalThis.localStorage.getItem = jest.fn();
    });

    it('returns stored language from localStorage when valid', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue('tr');

        await expect(getStoredAppLanguage()).resolves.toBe('tr');
        expect(globalThis.localStorage.getItem).toHaveBeenCalledWith('app_language');
    });

    it('returns null for unsupported language values', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue('es');

        await expect(getStoredAppLanguage()).resolves.toBeNull();
    });

    it('returns null when reading storage throws', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockImplementation(() => {
            throw new Error('storage is blocked');
        });

        await expect(getStoredAppLanguage()).resolves.toBeNull();
    });

    it('does not call SecureStore when localStorage is available', async () => {
        (globalThis.localStorage.getItem as jest.Mock).mockReturnValue('en');

        await getStoredAppLanguage();

        expect(secureStore.getItemAsync).not.toHaveBeenCalled();
    });
});
