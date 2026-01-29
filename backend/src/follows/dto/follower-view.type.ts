import { ObjectType, Field } from "@nestjs/graphql";
import { User } from "../../users/user.entity";

@ObjectType()
export class FollowerView {
    @Field(() => User)
    user: User;

    @Field()
    followedByMe: boolean;
}
