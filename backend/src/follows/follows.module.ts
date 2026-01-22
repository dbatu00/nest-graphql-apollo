import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Follow } from "./follow.entity";
import { FollowsService } from "./follows.service";
import { FollowsResolver } from "./follows.resolver";
import { User } from "src/users/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Follow, User])],
  providers: [FollowsService, FollowsResolver],
  exports: [TypeOrmModule],
})
export class FollowsModule { }
