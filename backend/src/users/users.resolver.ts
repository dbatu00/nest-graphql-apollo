import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './user.entity';

import { DeleteUserOutput } from './delete-user.output';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User])
  getUsers() {
    return this.usersService.findAll();
  }

  //graphql will default to float if type is not cast
  @Query(() => User, { nullable: true })
  getUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  addUser(@Args('name') name: string) {
    return this.usersService.create(name);
  }

  //typeOrm returns a deleteUser promise
  //nestJS cannot map deleteUser type to a graphQL schema
  //instead deleteUser result is 'copied' to a custom output
  //deleteUser function return type is explicitly declared for clarity
  @Mutation(() => DeleteUserOutput)
  deleteUser(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<DeleteUserOutput> {
    return this.usersService.delete(id).then((result) => ({
      affected: result.affected ?? 0,
    }));
  }
}
