import { ObjectType, Field } from "@nestjs/graphql";
import { User } from "../users/user.entity";

@ObjectType()
export class AuthPayload {
    @Field(() => User)
    user: User;

    @Field()
    token: string;
}
