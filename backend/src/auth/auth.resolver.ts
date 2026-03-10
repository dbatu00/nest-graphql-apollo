// GraphQL resolver for auth mutations and current-user query.
import { Resolver, Mutation, Args, Query } from "@nestjs/graphql";
import { AuthService } from "./auth.service";
import { AuthPayload } from "./auth.types";
import { GqlAuthGuard } from "./security/gql-auth.guard";
import { UseGuards } from "@nestjs/common";
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
        try {
            return this.authService.signUp(username, email, password);
        } catch (error) {
            throw new Error(error?.message || "Sign up failed");
        }
    }

    @Mutation(() => AuthPayload)
    login(
        @Args("username") username: string,
        @Args("password") password: string
    ) {
        return this.authService.login(username, password);
    }

    @Mutation(() => Boolean)
    verifyEmail(@Args("token") token: string) {
        return this.authService.verifyEmail(token);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    resendMyVerificationLink(@CurrentUser() user: User) {
        try {
            return this.authService.resendMyVerificationLink(user.id);
        } catch (error) {
            throw new Error(error?.message || "Failed to resend verification link");
        }
    }


    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async changeMyPassword(
        @CurrentUser() user: User,
        @Args('currentPassword') currentPassword: string,
        @Args('newPassword') newPassword: string
    ): Promise<boolean> {
        return this.authService.changeMyPassword(user.id, currentPassword, newPassword);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async changeMyEmail(
        @CurrentUser() user: User,
        @Args('currentPassword') currentPassword: string,
        @Args('newEmail') newEmail: string
    ): Promise<boolean> {
        return this.authService.changeMyEmail(user.id, currentPassword, newEmail);
    }
}
