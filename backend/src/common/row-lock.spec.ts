import { NotFoundException } from '@nestjs/common';
import { lockEntityByIdOrThrow } from './row-lock';

describe('lockEntityByIdOrThrow', () => {
    it('locks only the root alias when left-joining relations', async () => {
        const row = { id: 1, user: { id: 2 } };
        const qb = {
            where: jest.fn(),
            leftJoinAndSelect: jest.fn(),
            setLock: jest.fn(),
            getOne: jest.fn().mockResolvedValue(row),
        };

        qb.where.mockReturnValue(qb);
        qb.leftJoinAndSelect.mockReturnValue(qb);
        qb.setLock.mockReturnValue(qb);

        const manager = {
            createQueryBuilder: jest.fn().mockReturnValue(qb),
        };

        await expect(
            lockEntityByIdOrThrow(manager as any, class TestEntity { }, 'post', 1, ['user'], 'Post not found'),
        ).resolves.toBe(row);

        expect(manager.createQueryBuilder).toHaveBeenCalledWith(expect.any(Function), 'post');
        expect(qb.where).toHaveBeenCalledWith('post.id = :id', { id: 1 });
        expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('post.user', 'user');
        expect(qb.setLock).toHaveBeenCalledWith('pessimistic_write', undefined, ['post']);
    });

    it('throws a not found error when the row does not exist', async () => {
        const qb = {
            where: jest.fn(),
            leftJoinAndSelect: jest.fn(),
            setLock: jest.fn(),
            getOne: jest.fn().mockResolvedValue(null),
        };

        qb.where.mockReturnValue(qb);
        qb.leftJoinAndSelect.mockReturnValue(qb);
        qb.setLock.mockReturnValue(qb);

        const manager = {
            createQueryBuilder: jest.fn().mockReturnValue(qb),
        };

        await expect(
            lockEntityByIdOrThrow(manager as any, class TestEntity { }, 'comment', 99, ['user'], 'Comment not found'),
        ).rejects.toThrow(new NotFoundException('Comment not found'));
    });
});