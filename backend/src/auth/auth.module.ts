// Auth module wiring JWT strategy, resolver, and service.
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import type { StringValue } from "ms";

import { AuthService } from "./auth.service";
import { AuthResolver } from "./auth.resolver";
import { Auth } from "./auth.entity";
import { User } from "../users/user.entity";
import { JwtStrategy } from "./security/jwt.strategy";
import { UsersModule } from "src/users/users.module";
import { VerificationToken } from "./verification/verification-token.entity";
import { VerificationEmailService } from "./verification/verification-email.service";
import { AuthController } from "./auth.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Auth, User, VerificationToken]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // jsonwebtoken types require StringValue/number rather than a generic string.
        const expiresIn = (configService.get<string>("JWT_EXPIRES_IN") ?? "15m") as StringValue;

        return {
          // Secret is mandatory and validated at startup.
          secret: configService.getOrThrow<string>("JWT_SECRET"),
          signOptions: { expiresIn },
        };
      },
    }),
    UsersModule
  ],
  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
    VerificationEmailService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }
