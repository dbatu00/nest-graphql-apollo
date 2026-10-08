import { NotFoundException } from '@nestjs/common';

import { lockEntityByIdOrThrow } from './row-lock';

describe('lockEntityByIdOrThrow', () => {
    it('locks the target row and returns it when found', async () => {
        const where = jest.fn().mockReturnThis();
        const leftJoinAndSelect = jest.fn().mockReturnThis();
        const setLock = jest.fn().mockReturnThis();
        const getOne = jest.fn().mockResolvedValue({ id: 7, name: 'row-7' });

        const manager = {
            createQueryBuilder: jest.fn().mockReturnValue({
                where,
                leftJoinAndSelect,
                setLock,
                getOne,
            }),
        } as any;

        const result = await lockEntityByIdOrThrow(manager, Object, 'row', 7, ['owner']);

        expect(result).toEqual({ id: 7, name: 'row-7' });
        expect(manager.createQueryBuilder).toHaveBeenCalledWith(Object, 'row');
        expect(where).toHaveBeenCalledWith('row.id = :id', { id: 7 });
        expect(leftJoinAndSelect).toHaveBeenCalledWith('row.owner', 'owner');
        expect(setLock).toHaveBeenCalledWith('pessimistic_write', undefined, ['row']);
    });

    it('throws NotFoundException when the row does not exist', async () => {
        const manager = {
            createQueryBuilder: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                setLock: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null),
            }),
        } as any;

        await expect(lockEntityByIdOrThrow(manager, Object, 'row', 99, [], 'missing row')).rejects.toBeInstanceOf(NotFoundException);
    });
});
