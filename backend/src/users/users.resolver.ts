import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import { AddUserInput } from './add-user.input';
import { AddUserOutput } from './add-user.output';

@Resolver(() => User)
export class UsersResolver {
  // NestJS logger instance
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly usersService: UsersService) { }


  @Query(() => [User]) //gql 
  async getAllUsers(): Promise<User[]> { //ts
    this.logger.log(`getAllUsers called`);

    try {
      const result = await this.usersService.getAllUsers();
      this.logger.log(`getAllUsers success | result count: ${result.length}`);
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `getAllUsers failed | error: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `getAllUsers failed | error: ${JSON.stringify(error)}`,
        );
      }
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  //1,2,3,4,5
  @Query(() => [User])
  async findUsersById(
    @Args({ name: 'ids', type: () => [Int] }) ids: number[],
  ): Promise<User[]> {
    const results = await Promise.all(
      ids.map(async (id) => {
        const user = await this.usersService.findUser(id);
        if (user) {
          return user;
        }

        // Return placeholder User entity if not found
        return {
          id,
          name: 'User not found',
        } as User;
      }),
    );

    return results;
  }


  @Query(() => [User])
  async findUsersByName(
    @Args({ name: 'names', type: () => [String] }) names: string[],
  ): Promise<User[]> {
    const results = await Promise.all(
      names.map(async (name) => {
        // Direct repository query to get all users for this name
        const users = await this.usersService['usersRepo'].find({ where: { name } });

        if (users.length > 0) return users;

        // No match → custom placeholder including the name
        return [{ id: 0, name: `User not found: ${name}` } as User];
      })
    );

    return results.flat();
  }






  /**
   * Mutation: addUser
   * -----------------
   * Add a new user with given input.
   * Flow:
   * - If user does not exist → create it.
   * - If user exists and force=true → create anyway.
   * - If user exists and force=false → return { userExists: true }.
   * - If user exists and force not specified → return { userExists: true }.
   * Returns: AddUserOutput
   * Error: Throws InternalServerErrorException if creation fails.
   */
  @Mutation(() => AddUserOutput)
  async addUser(@Args('addUserInput') addUserInput: AddUserInput) {
    this.logger.log(
      `addUser called with input=${JSON.stringify(addUserInput)}`,
    );
    const addUserOutput = new AddUserOutput();

    try {
      // Check if user with this name already exists
      const user = await this.usersService.findUser(addUserInput.name);

      if (!user) {
        // User does not exist → create new
        this.logger.log(`addUser: user does not exist → creating`);
        addUserOutput.user = await this.usersService.create(addUserInput.name);
        return addUserOutput;
      }

      if (addUserInput.force === true) {
        // User exists, but client forces creation anyway
        this.logger.log(`addUser: user exists, force=true → creating`);
        addUserOutput.user = await this.usersService.create(addUserInput.name);
        return addUserOutput;
      } else {
        // User exists, but client didn’t choose force → return "userExists=true"
        // this works because adduserinput.force default value is false,
        // if client hasnt asked user for overwrite confirmation(initial call) -> default value false
        // if client asked and end user said dont force, client makes no calls
        this.logger.log(
          `addUser: user exists, client did not choose force → returning userExists=true`,
        );
        addUserOutput.userExists = true;
        return addUserOutput;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`addUser failed: ${error.message}`, error.stack);
      } else {
        this.logger.error(`addUser failed: ${JSON.stringify(error)}`);
      }
      throw new InternalServerErrorException('Failed to add user');
    }
  }

  @Mutation(() => [User])
  async deleteUser(
    @Args('ids', { type: () => [Int] }) ids: number[],
  ): Promise<User[]> {
    this.logger.log(`deleteUser called with ids=${JSON.stringify(ids)}`);

    try {
      // Step 1: Find users by ID (returns placeholders if not found)
      const findResults = await this.findUsersById(ids);

      const deletePromises = findResults.map(async (user) => {
        if (user.name === 'User not found') {
          // skip delete for non-existent users
          return user;
        }

        // Step 2: Delete the user
        const deleted = await this.usersService.delete(user.id);
        if (deleted) {
          return {
            ...user,
            name: `Deleted user. Username: ${user.name}`,
          };
        } else {
          return {
            ...user,
            name: `Failed to delete user. Username: ${user.name}`,
          };
        }
      });

      const results = await Promise.all(deletePromises);

      this.logger.log(`deleteUser completed | results=${JSON.stringify(results)}`);
      return results;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`deleteUser failed: ${error.message}`, error.stack);
      } else {
        this.logger.error(`deleteUser failed: ${JSON.stringify(error)}`);
      }
      throw new InternalServerErrorException('Failed to delete users');
    }
  }
}
