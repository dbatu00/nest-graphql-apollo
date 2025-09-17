import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class DeleteUserOutput {
  @Field(() => Int)
  affected = 0;

  @Field(() => Int)
  id!: number;

  @Field(() => String, { nullable: true })
  name: string | null = null;
}
