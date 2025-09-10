import { Resolver, Query } from '@nestjs/graphql';
import { User } from './user.model';

@Resolver(() => User)
export class UsersResolver {
  @Query(() => [User])
  getUsers() {
    return [
      { id: 1, name: 'Deniz' },
      { id: 2, name: 'Didem' },
    ];
  }
}
