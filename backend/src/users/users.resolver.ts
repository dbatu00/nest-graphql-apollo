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

  @Query(() => [User])
  async findUsersByIds(
    @Args({ name: 'ids', type: () => [Int] }) ids: number[],
  ): Promise<User[]> {
    this.logger.log(`findUsersByIds called | ids=${ids.join(",")}`);

    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const user = await this.usersService.findUserById(id);

          if (user) {
            return user;
          }

          // Placeholder response when the user does not exist
          return {
            id,
            name: 'User not found',
          } as User;
        }),
      );

      this.logger.log(`findUsersByIds success | count=${results.length}`);
      return results;
    } catch (error) {
      // Log with stack trace for backend visibility
      if (error instanceof Error) {
        this.logger.error(
          `findUsersByIds failed | ids=${ids.join(",")} | error=${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `findUsersByIds failed | ids=${ids.join(",")} | error=${JSON.stringify(error)}`,
        );
      }

      // Throw a GraphQL-compatible NestJS exception
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }


  //results is a user[][] because 
  //findUsersByName returns an array because
  //in db there could be duplicate names 
  @Query(() => [User])
  async findUsersByNames(
    @Args({ name: 'names', type: () => [String] }) names: string[],
  ): Promise<User[]> {
    this.logger.log(`findUsersByNames called | names=${names.join(",")}`);
    try {
      const results: User[][] = await Promise.all(
        names.map(async requestedName => {
          const users = await this.usersService.findUsersByName(requestedName);

          // If no users found, return placeholder
          return users ?? [{ id: 0, name: `User not found: ${requestedName}` } as User];
        })
      );

      // Flatten one level: User[][] -> User[]
      return results.flat();
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`findUsersByNames failed | params=${names} | error=${error.message}`, error.stack);
      } else {
        this.logger.error(`findUsersByNames failed | params=${names} | error=${JSON.stringify(error)}`);
      }

      throw new InternalServerErrorException('Failed to fetch users');
    }
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
      const findResults = await this.findUsersByIds(ids);

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
