import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class AddUserInput {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => Boolean) // graphQL type function
  force: boolean; //typescript type annotation
}
