// GraphQL payload returned by auth mutations.
import { ObjectType, Field } from "@nestjs/graphql";
import { User } from "../users/user.entity";

@ObjectType()
export class AuthPayload {
    @Field(() => User)
    user: User;

    @Field()
    token: string;

    @Field()
    emailVerified: boolean;

    @Field({ nullable: true })
    verificationToken?: string;
}
