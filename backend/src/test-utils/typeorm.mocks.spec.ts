import {
    createDataSourceMock,
    createEntityManagerMock,
    createJwtServiceMock,
    createQueryBuilderMock,
    createRepositoryMock,
} from './typeorm.mocks';

describe('typeorm test mocks', () => {
    it('creates repository mock with safe defaults', async () => {
        const repo = createRepositoryMock<{ id: number }>();

        await expect(repo.findOne()).resolves.toBeNull();
        await expect(repo.find()).resolves.toEqual([]);
        await expect(repo.count()).resolves.toBe(0);
        await expect(repo.exists()).resolves.toBe(false);
    });

    it('executes manager.transaction callback and returns callback result', async () => {
        const repo = createRepositoryMock<{ id: number }>();

        const result = await repo.manager.transaction(async (manager) => {
            expect(manager).toEqual({});
            return 'ok';
        });

        expect(result).toBe('ok');
    });

    it('builds chainable query builder with provided getOne result', async () => {
        const qb = createQueryBuilderMock({ id: 7, title: 'hello' });

        expect(qb.innerJoinAndSelect('a', 'b')).toBe(qb);
        expect(qb.where('x = :x', { x: 1 })).toBe(qb);
        expect(qb.orderBy('x', 'DESC')).toBe(qb);
        await expect(qb.getOne()).resolves.toEqual({ id: 7, title: 'hello' });
        await expect(qb.getMany()).resolves.toEqual([]);
        await expect(qb.getCount()).resolves.toBe(0);
    });

    it('creates entity manager and data source function mocks', () => {
        const manager = createEntityManagerMock();
        const dataSource = createDataSourceMock();

        manager.create({ id: 1 });
        manager.save({ id: 1 });
        dataSource.getRepository('User');
        dataSource.transaction(async () => undefined);

        expect(manager.create).toHaveBeenCalledWith({ id: 1 });
        expect(manager.save).toHaveBeenCalledWith({ id: 1 });
        expect(dataSource.getRepository).toHaveBeenCalledWith('User');
        expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('creates jwt service mock with sign function', () => {
        const jwtService = createJwtServiceMock();

        jwtService.sign({ sub: 1 });

        expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1 });
    });
});
