import { ObjectType, Field, Int } from "@nestjs/graphql";
import { User } from "../users/user.entity";
import { Post } from "../posts/post.entity";

@ObjectType("Activity")
export class ActivityGQL {
    @Field(() => Int)
    id: number;

    @Field(() => String)
    type: "post" | "follow" | "like" | "share";

    @Field(() => User)
    actor: User;

    @Field(() => User, { nullable: true })
    targetUser?: User;

    @Field(() => Post, { nullable: true })
    targetPost?: Post;

    @Field(() => Date)
    createdAt: Date;
}
