import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Logger, InternalServerErrorException } from '@nestjs/common';

import { DeleteUserOutput } from './delete-user.output';
import { AddUserInput } from './add-user.input';
import { AddUserOutput } from './add-user.output';

@Resolver(() => User)
export class UsersResolver {
  // NestJS logger instance
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * Query: getUsers
   * ----------------
   * Fetch all users from the database.
   * Returns: User[]
   * Error: Throws InternalServerErrorException if fetch fails.
   */
  @Query(() => [User])
  async getUsers() {
    this.logger.log(`getUsers called`);
    try {
      // Call service → fetch all users
      const result = await this.usersService.findAll();
      this.logger.log(`getUsers result: ${JSON.stringify(result)}`);
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`getUsers failed: ${error.message}`, error.stack);
      } else {
        this.logger.error(`getUsers failed: ${JSON.stringify(error)}`);
      }
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  /**
   * Query: getUser
   * ----------------
   * Fetch a single user by ID.
   * Args: id: number
   * Returns: User | null
   * Error: Throws InternalServerErrorException if fetch fails.
   */
  @Query(() => User, { nullable: true })
  async getUser(@Args('id', { type: () => Int }) id: number) {
    this.logger.log(`getUser called with id=${id}`);
    try {
      // Call service → fetch user by id
      const result = await this.usersService.findOne({ id });
      this.logger.log(`getUser result: ${JSON.stringify(result)}`);
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`getUser failed: ${error.message}`, error.stack);
      } else {
        this.logger.error(`getUser failed: ${JSON.stringify(error)}`);
      }
      throw new InternalServerErrorException('Failed to fetch user');
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
      const user = await this.usersService.findOne({ name: addUserInput.name });

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

  /**
   * Mutation: deleteUser
   * --------------------
   * Delete a user by ID.
   * Args: id: number
   * Returns: DeleteUserOutput
   * Error: Throws InternalServerErrorException if deletion fails.
   */
  @Mutation(() => DeleteUserOutput)
  async deleteUser(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<DeleteUserOutput> {
    this.logger.log(`deleteUser called with id=${id}`);
    try {
      // Call service → delete user
      const result = await this.usersService.delete(id);

      // Map service result into DeleteUserOutput
      const output: DeleteUserOutput = {
        affected: result.affected ?? 0,
        name: result.name ?? null,
        id: id,
      };

      this.logger.log(`deleteUser returning: ${JSON.stringify(output)}`);
      return output;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`deleteUser failed: ${error.message}`, error.stack);
      } else {
        this.logger.error(`deleteUser failed: ${JSON.stringify(error)}`);
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  /**
   * Mutation: deleteUserPromise
   * ---------------------------
   * Promise-based (non-async/await) version of deleteUser.
   * Args:
   *   - id: number (User ID to delete)
   * Returns:
   *   - Promise<DeleteUserOutput>
   * Error:
   *   - Rejects with InternalServerErrorException if deletion fails.
   */
  @Mutation(() => DeleteUserOutput)
  deleteUserPromise(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<DeleteUserOutput> {
    this.logger.log(`deleteUserPromise called with id=${id}`);

    // Call service → delete user
    return this.usersService
      .delete(id)
      .then((result) => {
        // Map result to DeleteUserOutput
        const output: DeleteUserOutput = {
          affected: result.affected ?? 0,
          name: result.name,
          id,
        };

        this.logger.log(
          `deleteUserPromise returning: ${JSON.stringify(output)}`,
        );
        return output;
      })
      .catch((error: unknown) => {
        // Log error details
        if (error instanceof Error) {
          this.logger.error(
            `deleteUserPromise failed: ${error.message}`,
            error.stack,
          );
        } else {
          this.logger.error(
            `deleteUserPromise failed: ${JSON.stringify(error)}`,
          );
        }
        throw new InternalServerErrorException(
          'Failed to delete user (promise-based)',
        );
      });
  }
}
