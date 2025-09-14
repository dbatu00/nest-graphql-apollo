import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class DeleteUserOutput {
  @Field(() => Int)
  affected: number;

  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;
}
