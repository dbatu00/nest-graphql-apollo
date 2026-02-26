type AnyFn = (...args: any[]) => any;

export type MockedQueryBuilder<T> = {
    innerJoinAndSelect: jest.MockedFunction<AnyFn>;
    where: jest.MockedFunction<AnyFn>;
    orderBy: jest.MockedFunction<AnyFn>;
    getMany: jest.Mock<Promise<T[]>, []>;
    getCount: jest.Mock<Promise<number>, []>;
    getOne: jest.Mock<Promise<T | null>, []>;
};

export function createQueryBuilderMock<T>(
    result: T | null,
): MockedQueryBuilder<T> {
    const qb: MockedQueryBuilder<T> = {
        innerJoinAndSelect: jest.fn(),
        where: jest.fn(),
        orderBy: jest.fn(),
        getMany: jest.fn<Promise<T[]>, []>().mockResolvedValue([]),
        getCount: jest.fn<Promise<number>, []>().mockResolvedValue(0),
        getOne: jest.fn<Promise<T | null>, []>().mockResolvedValue(result),
    };

    qb.innerJoinAndSelect.mockReturnValue(qb as unknown as ReturnType<AnyFn>);
    qb.where.mockReturnValue(qb as unknown as ReturnType<AnyFn>);
    qb.orderBy.mockReturnValue(qb as unknown as ReturnType<AnyFn>);

    return qb;
}

export function createEntityManagerMock() {
    return {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
    };
}

export function createDataSourceMock() {
    return {
        getRepository: jest.fn(),
        transaction: jest.fn(),
    };
}

export function createJwtServiceMock() {
    return {
        sign: jest.fn(),
    };
}
