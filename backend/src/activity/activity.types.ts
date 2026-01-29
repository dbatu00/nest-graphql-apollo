// activity.types.ts
import { ObjectType, Field, Int } from "@nestjs/graphql";
import { User } from "../users/user.entity";

export type ActivityTypeEnum = "post" | "follow" | "like" | "share";

@ObjectType("Activity") // name exposed in GraphQL
export class ActivityGQL {
    @Field(() => Int)
    id: number;

    @Field(() => String)
    type: ActivityTypeEnum;

    @Field(() => User)
    actor: User;

    @Field(() => Int, { nullable: true })
    targetId?: number;

    @Field(() => String, { nullable: true })
    targetType?: "user" | "post";

    @Field(() => Date)
    createdAt: Date;
}
