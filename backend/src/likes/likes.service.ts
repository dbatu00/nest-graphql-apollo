import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Like } from './like.entity';
import { LikeType } from './likes.constants';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likesRepo: Repository<Like>,
  ) { }

  async getLikeMeta(targetType: LikeType, targetId: number, userId?: number) {
    const repo = this.likesRepo;

    const likesCountPromise = repo.count({
      where: { targetType, targetId, active: true },
    });

    const likedByMePromise =
      userId !== undefined
        ? repo.findOne({
          where: { targetType, targetId, userId, active: true },
          select: { id: true },
        })
        : Promise.resolve(null);

    const [likesCount, liked] = await Promise.all([
      likesCountPromise,
      likedByMePromise,
    ]);

    return {
      likesCount,
      likedByMe: !!liked,
    };
  }

  async getUsersWhoLiked(targetType: LikeType, targetId: number) {
    const likes = await this.likesRepo.find({
      where: { targetType, targetId, active: true },
      relations: ['user'],
    });

    return likes.map((like) => like.user);
  }

  async getActiveLikesByUser(userId: number, targetType: LikeType) {
    return this.likesRepo.find({
      where: { userId, targetType, active: true },
      order: { createdAt: 'DESC' },
    });
  }

  // Atomically inserts or reactivates a like in a single round-trip.
  // Requires a unique constraint on (userId, targetType, targetId) — provided by @Unique on the entity.
  // Column names are quoted because TypeORM creates them as camelCase in PG;
  // without quotes, PG would silently lowercase them and the conflict clause would break.
  // The DO UPDATE ... WHERE clause collapses three cases into one statement:
  //   - No row        → INSERT fires            → changed: true
  //   - Row, inactive → UPDATE fires            → changed: true
  //   - Row, active   → WHERE false, no-op      → changed: false
  async like(userId: number, targetType: LikeType, targetId: number, manager?: EntityManager) {
    const em = manager ?? this.likesRepo.manager;

    const [row] = await em.query<Array<{ changed: boolean }>>(
      `INSERT INTO "like" ("userId", "targetType", "targetId", active, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, now(), now())
       ON CONFLICT ("userId", "targetType", "targetId")
       DO UPDATE SET active = true, "updatedAt" = now()
       WHERE "like".active = false
       RETURNING true AS changed`,
      [userId, targetType, targetId],
    );

    // No row returned = conflict hit but WHERE was false = already active
    return { changed: !!row };
  }

  // Mirrors like() with the active flag flipped off; kept as a separate method
  // for explicit API semantics and easier call-site readability.
  // Atomically updates only if active = true, so concurrent calls are safe.
  async unlike(userId: number, targetType: LikeType, targetId: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Like) : this.likesRepo;

    const result = await repo.update(
      { userId, targetType, targetId, active: true },
      { active: false },
    );

    return { changed: (result.affected ?? 0) > 0 };
  }

  async deleteLikes(
    targetType: LikeType,
    targetIdOrIds: number | number[],
    manager?: EntityManager,
  ) {
    // WARNING: this only deletes Like rows.
    // It does not delete Activity rows.
    // Activities are cleaned up when the owning Post/Comment is deleted
    // via DB-level cascades on Activity.targetPost / Activity.targetComment.
    const repo = manager ? manager.getRepository(Like) : this.likesRepo;

    if (Array.isArray(targetIdOrIds)) {
      if (targetIdOrIds.length === 0) return;
      await repo.delete({ targetType, targetId: In(targetIdOrIds) });
      return;
    }

    await repo.delete({ targetType, targetId: targetIdOrIds });
  }
}