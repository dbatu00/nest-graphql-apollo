// Users business logic for profile and follow counters.
import {
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, } from "typeorm";
import { User } from "./user.entity";
import { Follow } from "src/follows/follow.entity";


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
  ) { }

  findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByUsername(username: string) {
    return this.userRepo.findOne({
      where: { username },
      relations: ["posts"],
      order: {
        posts: {
          createdAt: "DESC",
        },
      },
    });
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.followRepo.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
      select: { id: true }, // important: keeps query cheap
    });

    return !!follow;
  }

  async countFollowers(userId: number): Promise<number> {
    return this.followRepo.count({
      where: { following: { id: userId } },
    });
  }

  async countFollowing(userId: number): Promise<number> {
    return this.followRepo.count({
      where: { follower: { id: userId } },
    });
  }

  async updateMyProfile(
    userId: number,
    input: {
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
      coverUrl?: string;
    },
  ): Promise<User> {
    const existingUser = await this.findById(userId);

    if (!existingUser) {
      throw new Error("User not found");
    }

    const updatePayload: {
      displayName?: string | null;
      bio?: string | null;
      avatarUrl?: string | null;
      coverUrl?: string | null;
    } = {};

    if (typeof input.displayName === "string") {
      const normalizedDisplayName = input.displayName.trim();
      updatePayload.displayName = normalizedDisplayName || null;
    }

    if (typeof input.bio === "string") {
      const normalizedBio = input.bio.trim();
      updatePayload.bio = normalizedBio || null;
    }

    if (typeof input.avatarUrl === "string") {
      const normalizedAvatarUrl = input.avatarUrl.trim();
      updatePayload.avatarUrl = normalizedAvatarUrl || null;
    }

    if (typeof input.coverUrl === "string") {
      const normalizedCoverUrl = input.coverUrl.trim();
      updatePayload.coverUrl = normalizedCoverUrl || null;
    }

    await this.userRepo.update({ id: userId }, updatePayload as Partial<User>);

    const updatedUser = await this.findById(userId);

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return updatedUser;
  }

}
