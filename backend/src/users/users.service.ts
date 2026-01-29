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
      relations: ["posts"], // 🔴 REQUIRED
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

}
