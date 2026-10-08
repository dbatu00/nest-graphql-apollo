type AnyFn = (...args: any[]) => any;

export type MockedRepository<T> = {
    findOne: jest.Mock<Promise<T | null>, [any?]>;
    find: jest.Mock<Promise<T[]>, [any?]>;
    count: jest.Mock<Promise<number>, [any?]>;
    update: jest.Mock<Promise<unknown>, [any?, any?]>;
    save: jest.Mock<Promise<T>, [any?]>;
    create: jest.Mock<T, [any?]>;
    remove: jest.Mock<Promise<unknown>, [any?]>;
    exists: jest.Mock<Promise<boolean>, [any?]>;
    manager: {
        transaction: jest.Mock<Promise<unknown>, [AnyFn]>;
    };
};

export function createRepositoryMock<T>(): MockedRepository<T> {
    return {
        findOne: jest.fn<Promise<T | null>, [any?]>().mockResolvedValue(null),
        find: jest.fn<Promise<T[]>, [any?]>().mockResolvedValue([]),
        count: jest.fn<Promise<number>, [any?]>().mockResolvedValue(0),
        update: jest.fn<Promise<unknown>, [any?, any?]>().mockResolvedValue(undefined),
        save: jest.fn<Promise<T>, [any?]>(),
        create: jest.fn<T, [any?]>(),
        remove: jest.fn<Promise<unknown>, [any?]>().mockResolvedValue(undefined),
        exists: jest.fn<Promise<boolean>, [any?]>().mockResolvedValue(false),
        manager: {
            transaction: jest.fn(async (fn: AnyFn) => fn({})),
        },
    };
}

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
