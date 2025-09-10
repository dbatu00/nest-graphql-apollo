import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User])
  getUsers() {
    return this.usersService.findAll();
  }

  @Mutation(() => User)
  addUser(@Args('name') name: string) {
    return this.usersService.create(name);
  }
}
