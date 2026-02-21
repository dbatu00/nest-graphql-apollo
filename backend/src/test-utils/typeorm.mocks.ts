type AnyFn = (...args: any[]) => any;

export type MockedQueryBuilder<T> = {
    innerJoinAndSelect: jest.MockedFunction<AnyFn>;
    where: jest.MockedFunction<AnyFn>;
    getOne: jest.Mock<Promise<T | null>, []>;
};

export function createQueryBuilderMock<T>(
    result: T | null,
): MockedQueryBuilder<T> {
    const qb: MockedQueryBuilder<T> = {
        innerJoinAndSelect: jest.fn(),
        where: jest.fn(),
        getOne: jest.fn<Promise<T | null>, []>().mockResolvedValue(result),
    };

    qb.innerJoinAndSelect.mockReturnValue(qb as unknown as ReturnType<AnyFn>);
    qb.where.mockReturnValue(qb as unknown as ReturnType<AnyFn>);

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
