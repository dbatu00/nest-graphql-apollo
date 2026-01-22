import {
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, } from "typeorm";
import { User } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
}
