import { ObjectType, Field } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
export class AddUserOutput {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => Boolean, { nullable: true })
  userExists?: boolean;
}
