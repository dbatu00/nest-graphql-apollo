// src/users/users.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UsersService } from "./users.service";
import { UsersResolver } from "./users.resolver";
import { Follow } from "src/follows/follow.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Follow])],
  providers: [UsersResolver, UsersService],
  exports: [UsersService], // 🔴 REQUIRED
})
export class UsersModule { }
