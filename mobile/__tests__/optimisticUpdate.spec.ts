import { optimisticToggle, optimisticDelete, optimisticCreate } from '../utils/optimisticUpdate';

describe('optimisticUpdate helpers', () => {
    it('rolls back optimistic toggle on mutation failure', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const setState = jest.fn((updater) => {
            const prev = { liked: false };
            const result = typeof updater === 'function' ? updater(prev) : updater;
            expect(result).toEqual({ liked: true });
        });

        const rollback = jest.fn();

        await optimisticToggle(
            (prev) => ({ ...prev, liked: true }),
            false,
            async () => {
                throw new Error('network');
            },
            async () => undefined,
            setState,
            rollback,
        );

        expect(rollback).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('removes optimistic item after delete succeeds', async () => {
        const setState = jest.fn();

        await optimisticDelete(
            (items: number[]) => items.filter((id) => id !== 3),
            async () => undefined,
            setState,
        );

        expect(setState).toHaveBeenCalled();
    });

    it('reconciles create result after a successful request', async () => {
        const setState = jest.fn((updater) => {
            const prev = [1, 2];
            const result = typeof updater === 'function' ? updater(prev) : updater;
            return result;
        });
        const reconcile = jest.fn((prev: number[], result: number) => [...prev, result]);

        const result = await optimisticCreate(
            (prev: number[]) => [...prev, 99],
            async () => 100,
            setState,
            reconcile,
        );

        expect(result).toBe(100);
        expect(reconcile).toHaveBeenCalled();
    });
});
