import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class AddUserInput {
  @Field(() => String)
  name!: string;

  @Field(() => Boolean, { defaultValue: false }) // GraphQL default
  force: boolean = false; // TypeScript default
}
