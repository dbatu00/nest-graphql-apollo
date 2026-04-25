import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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

  async like(userId: number, targetType: LikeType, targetId: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Like) : this.likesRepo;

    let like = await repo.findOne({
      where: { userId, targetType, targetId },
    });

    if (like?.active) {
      return { changed: false };
    }

    if (like) {
      like.active = true;
      await repo.save(like);
      return { changed: true };
    }

    await repo.save({
      userId,
      targetType,
      targetId,
      active: true,
    });

    return { changed: true };
  }

  async unlike(userId: number, targetType: LikeType, targetId: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Like) : this.likesRepo;

    const like = await repo.findOne({
      where: { userId, targetType, targetId },
    });

    if (!like || !like.active) {
      return { changed: false };
    }

    like.active = false;
    await repo.save(like);

    return { changed: true };
  }
}
