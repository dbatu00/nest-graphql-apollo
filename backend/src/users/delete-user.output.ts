import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class DeleteUserOutput {
  @Field(() => Int)
  affected: number;
}