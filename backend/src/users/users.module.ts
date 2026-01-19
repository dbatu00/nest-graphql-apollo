// src/users/users.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UsersService } from "./users.service";
import { UsersResolver } from "./users.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersResolver, UsersService],
  exports: [UsersService], // 🔴 REQUIRED
})
export class UsersModule { }
