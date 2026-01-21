import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AuthService } from "./auth.service";
import { AuthResolver } from "./auth.resolver";
import { Auth } from "./auth.entity";
import { User } from "../users/user.entity";
import { JwtStrategy } from "./jwt.strategy";
import { UsersModule } from "src/users/users.module";

console.log('JWT_SECRET in AuthModule:', process.env.JWT_SECRET);

@Module({
  imports: [
    TypeOrmModule.forFeature([Auth, User]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "15m" },
    }),
    UsersModule
  ],
  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule { }
