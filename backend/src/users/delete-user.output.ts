import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class DeleteUserOutput {
  @Field(() => Int)
  id!: number;

  @Field(() => String, { nullable: true })
  name: string | null = null;
}
