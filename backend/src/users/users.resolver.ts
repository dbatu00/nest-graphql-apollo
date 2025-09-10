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

  @Query(() => User, { nullable: true })
  getUser(@Args('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  addUser(@Args('name') name: string) {
    return this.usersService.create(name);
  }
}
