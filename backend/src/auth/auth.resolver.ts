
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
import { ChangeMyEmailArgs, ChangeMyPasswordArgs, IsEmailUsedArgs, LoginArgs, SignUpArgs } from "./dto/auth.args";

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
    signUp(@Args() args: SignUpArgs) {
        return this.authService.signUp(args.username, args.email, args.password);
    }

    @Mutation(() => AuthPayload)
    login(@Args() args: LoginArgs) {
        return this.authService.login(args.identifier, args.password);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    changeMyPassword(
        @CurrentUser() user: User,
        @Args() args: ChangeMyPasswordArgs,
    ) {
        return this.authService.changeMyPassword(user.id, args.currentPassword, args.newPassword);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    changeMyEmail(
        @CurrentUser() user: User,
        @Args() args: ChangeMyEmailArgs,
    ) {
        return this.authService.changeMyEmail(user.id, args.newEmail, args.currentPassword);
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
    isEmailUsed(@Args() args: IsEmailUsedArgs) {
        return this.authService.isEmailUsed(args.email);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => EmailSendResult)
    resendMyVerificationLink(@CurrentUser() user: User) {
        return this.authService.resendVerification(user.id);
    }
}
