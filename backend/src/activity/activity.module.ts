import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ActivityService } from "./activity.service";
import { ActivityResolver } from "./activity.resolver";
import { Activity } from "./activity.entity";
import { User } from "../users/user.entity";
import { Post } from "../posts/post.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, User, Post]),
  ],
  providers: [ActivityService, ActivityResolver],
  exports: [ActivityService],
})
export class ActivityModule { }
