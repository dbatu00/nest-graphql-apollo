import { NotFoundException } from '@nestjs/common';
import { EntityManager, EntityTarget } from 'typeorm';

export async function lockEntityByIdOrThrow<T extends object>(
    manager: EntityManager,
    entity: EntityTarget<T>,
    alias: string,
    id: number,
    relations: string[] = [],
    errorMessage = 'Not found',
): Promise<T> {
    const qb = manager
        .createQueryBuilder(entity, alias)
        .where(`${alias}.id = :id`, { id });

    for (const relation of relations) {
        qb.leftJoinAndSelect(`${alias}.${relation}`, relation);
    }

    // PostgreSQL rejects `FOR UPDATE` when it also targets the nullable side of
    // a left join. Restrict the lock to the root alias so callers can still
    // eager-load optional relations while locking the primary row.
    qb.setLock('pessimistic_write', undefined, [alias]);

    const row = await qb.getOne();

    if (!row) throw new NotFoundException(errorMessage);
    return row;
}