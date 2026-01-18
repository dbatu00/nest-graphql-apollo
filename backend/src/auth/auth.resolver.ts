import { Resolver, Mutation, Args } from "@nestjs/graphql";
import { AuthService } from "./auth.service";
import { AuthPayload } from "./auth.types";

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) { }

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
