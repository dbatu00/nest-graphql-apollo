import { Resolver, Mutation, Args, Query } from "@nestjs/graphql";
import { AuthService } from "./auth.service";
import { AuthPayload } from "./auth.types";
import { GqlAuthGuard } from "./gql-auth.guard";
import { UseGuards } from "@nestjs/common";
import { User } from "src/users/user.entity";
import { CurrentUser } from "./current-user.decorator";


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
        @Args("password") password: string
    ) {
        return this.authService.signUp(username, password);
    }

    @Mutation(() => AuthPayload)
    login(
        @Args("username") username: string,
        @Args("password") password: string
    ) {
        return this.authService.login(username, password);
    }
}
