import { getMe } from '../../graphql/client';
import { isAuthGraphQLError } from '../../utils/graphqlFetch';
import { getCurrentUser } from '../../utils/currentUser';
import { silenceConsole } from '../test-utils/jest';

jest.mock('../../graphql/client', () => ({
    getMe: jest.fn(),
}));

jest.mock('../../utils/graphqlFetch', () => ({
    isAuthGraphQLError: jest.fn(),
}));

describe('currentUser', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        warnSpy = silenceConsole('warn');
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    it('returns current user on first successful attempt', async () => {
        (getMe as jest.Mock).mockResolvedValue({ id: 7, username: 'deniz' });
        (isAuthGraphQLError as jest.Mock).mockReturnValue(false);

        await expect(getCurrentUser()).resolves.toEqual({ id: 7, username: 'deniz' });
        expect(getMe).toHaveBeenCalledWith({ skipAuthFailureHandler: true });
    });

    it('returns null immediately for auth GraphQL errors', async () => {
        const authError = new Error('Unauthorized');
        (getMe as jest.Mock).mockRejectedValue(authError);
        (isAuthGraphQLError as jest.Mock).mockReturnValue(true);

        await expect(getCurrentUser()).resolves.toBeNull();
        expect(getMe).toHaveBeenCalledTimes(1);
    });

    it('retries transient errors and succeeds on later attempt', async () => {
        jest.useFakeTimers();

        const transientError = new Error('temporary network');
        (getMe as jest.Mock)
            .mockRejectedValueOnce(transientError)
            .mockRejectedValueOnce(transientError)
            .mockResolvedValue({ id: 9, username: 'retry-user' });
        (isAuthGraphQLError as jest.Mock).mockReturnValue(false);

        const pending = getCurrentUser();

        await jest.advanceTimersByTimeAsync(300);
        await jest.advanceTimersByTimeAsync(600);

        await expect(pending).resolves.toEqual({ id: 9, username: 'retry-user' });
        expect(getMe).toHaveBeenCalledTimes(3);

        jest.useRealTimers();
    });

    it('throws after retries are exhausted for non-auth errors', async () => {
        jest.useFakeTimers();

        const permanentError = new Error('backend is down');
        (getMe as jest.Mock).mockRejectedValue(permanentError);
        (isAuthGraphQLError as jest.Mock).mockReturnValue(false);

        const pending = getCurrentUser();
        const rejection = expect(pending).rejects.toBe(permanentError);

        await jest.advanceTimersByTimeAsync(300);
        await jest.advanceTimersByTimeAsync(600);

        await rejection;
        expect(getMe).toHaveBeenCalledTimes(3);

        jest.useRealTimers();
    });
});
