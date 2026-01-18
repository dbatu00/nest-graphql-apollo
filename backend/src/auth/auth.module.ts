import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service";
import { AuthResolver } from "./auth.resolver";
import { AuthCredential } from "./auth.entity";
import { User } from "../users/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthCredential, User]),
  ],
  providers: [AuthService, AuthResolver],
  exports: [AuthService],
})
export class AuthModule { }
