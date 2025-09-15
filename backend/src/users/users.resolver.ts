import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Logger } from '@nestjs/common';

import { DeleteUserOutput } from './delete-user.output';

@Resolver(() => User)
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);
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

  // FLOW
  // - TypeORM's `delete` returns a Promise<DeleteResult>.
  // - GraphQL schema can’t expose DeleteResult directly.
  // - We map it into our custom `DeleteUserOutput` type.
  // - Explicit return type (Promise<DeleteUserOutput>) makes this clear.
  //
  // SYNTAX
  // @Args('id', { type: () => Int }) id: number
  //   → pulls `id` from GraphQL args, casts it to number (like: const id: number = Number(args["id"]))
  //
  // foo().then((value) => bar)
  //   → when foo() resolves, pass the result into `value`
  //   → run the arrow function (bar) with that value

  @Mutation(() => DeleteUserOutput)
  async deleteUser(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<DeleteUserOutput> {
    this.logger.log(`deleteUser called with id=${id}`);

    const result = await this.usersService.delete(id);

    const output: DeleteUserOutput = {
      affected: result.affected ?? 0,
      name: result.name,
      id: id,
    };

    this.logger.log(`deleteUser returning: ${JSON.stringify(output)}`);
    return output;
  }

  // ALT VERSION (async/await)
  // - Equivalent to above but uses `await` instead of `.then()`.
  // - ⚠️ Returned object keys must match DeleteUserOutput.
  //   Returning `{ mehmet: ... }` compiles, but GraphQL will throw at runtime.
  //⚠️⚠️⚠️ will cause error display on client side since the func above was updated
  @Mutation(() => DeleteUserOutput)
  async deleteUserAsync(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<DeleteUserOutput> {
    const result = await this.usersService.delete(id);
    return { affected: result.affected ?? 0, name: '', id: id };
  }
}
