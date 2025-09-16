import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class AddUserInput {
  @Field(() => String)
  name!: string;

  @Field(() => Boolean, { nullable: true }) // graphQL type function
  force?: boolean; //typescript type annotation
}
