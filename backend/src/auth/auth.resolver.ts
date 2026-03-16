
import { Resolver, Mutation, Args, Query, registerEnumType } from "@nestjs/graphql";
import { EmailSendResult } from "./verification/verification-email-send-result.enum";
// Register the enum with GraphQL
registerEnumType(EmailSendResult, { name: "EmailSendResult" });
import { AuthService } from "./auth.service";
import { AuthPayload } from "./auth.types";
import { GqlAuthGuard } from "./security/gql-auth.guard";
import { UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { User } from "src/users/user.entity";
import { CurrentUser } from "./security/current-user.decorator";

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) { }

    /**
    * Logged-in user's own profile
    */
    @UseGuards(GqlAuthGuard)
    @Query(() => User)
    me(@CurrentUser() user: User): User {
        return user;
    }

    @Mutation(() => AuthPayload)
    signUp(
        @Args("username") username: string,
        @Args("email") email: string,
        @Args("password") password: string
    ) {
        return this.authService.signUp(username, email, password);
    }

    @Mutation(() => AuthPayload)
    login(
        @Args("identifier") identifier: string,
        @Args("password") password: string
    ) {
        return this.authService.login(identifier, password);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    changeMyPassword(
        @CurrentUser() user: User,
        @Args('currentPassword') currentPassword: string,
        @Args('newPassword') newPassword: string
    ) {
        return this.authService.changeMyPassword(user.id, currentPassword, newPassword);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    changeMyEmail(
        @CurrentUser() user: User,
        @Args('currentPassword') currentPassword: string,
        @Args('newEmail') newEmail: string
    ) {
        return this.authService.changeMyEmail(user.id, newEmail, currentPassword);
    }

    @UseGuards(GqlAuthGuard)
    @Throttle({
        default: {
            limit: 50,
            ttl: 60 * 60 * 1000,
            getTracker: (req) => req.user?.id != null
                ? `user:${String(req.user.id)}`
                : (req.ip ?? req.ips?.[0] ?? "anonymous"),
        },
    })
    @Query(() => Boolean)
    isEmailUsed(@Args('email') email: string) {
        return this.authService.isEmailUsed(email);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => EmailSendResult)
    resendMyVerificationLink(@CurrentUser() user: User) {
        return this.authService.resendVerification(user.id);
    }
}
