import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { User } from './user.entity';
import { DeleteUserOutput } from './delete-user.output';

@Injectable()
export class UsersService {
  // Dedicated logger for this service, namespace = "UsersService"
  private readonly logger = new Logger(UsersService.name);

  // TypeORM will inject a repository that is scoped to the User entity.
  // This is only possible because UsersModule imported TypeOrmModule.forFeature([User]).
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  /**
   * Fetch all users from the database.
   *
   * @returns Promise<User[]>
   *
   * Notes:
   * - Wraps TypeORM's `find()` with logging + error handling.
   * - Even if there are no users, TypeORM resolves to an empty array [].
   */
  async findAll(): Promise<User[]> {
    this.logger.log(`findAll called`);
    try {
      const result = await this.usersRepo.find();
      this.logger.log(`findAll result: ${JSON.stringify(result)}`);
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`findAll failed: ${error.message}`, error.stack);
      } else {
        this.logger.error(`findAll failed: ${JSON.stringify(error)}`);
      }
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  /**
   * Find a single user by ID or by name.
   *
   * @param criteria Either { id } or { name }
   * @returns Promise<User | null>
   *
   * Notes:
   * - Throws if neither ID nor name is provided.
   * - Returns null if no user matches criteria.
   * - This leverages TypeORM's `findOne({ where })`.
   */
  async findOne(criteria: {
    id?: number;
    name?: string;
  }): Promise<User | null> {
    this.logger.log(`findOne called with criteria=${JSON.stringify(criteria)}`);
    if (!criteria.id && !criteria.name) {
      throw new Error('Must provide either id or name to findOne');
    }
    try {
      const result = await this.usersRepo.findOne({ where: criteria });
      this.logger.log(`findOne result: ${JSON.stringify(result)}`);
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`findOne failed: ${error.message}`, error.stack);
      } else {
        this.logger.error(`findOne failed: ${JSON.stringify(error)}`);
      }
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  /**
   * Create and persist a new user.
   *
   * @param name string
   * @returns Promise<User>
   *
   * Notes:
   * - `this.usersRepo.create()` instantiates a User entity without persisting.
   * - `this.usersRepo.save()` persists and returns the saved entity.
   * - TypeORM handles both INSERT and UPDATE under the hood depending on primary key presence.
   */
  async create(name: string): Promise<User> {
    this.logger.log(`create called with name=${name}`);
    try {
      const user = this.usersRepo.create({ name });
      const result = await this.usersRepo.save(user);
      this.logger.log(`create result: ${JSON.stringify(result)}`);
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`create failed: ${error.message}`, error.stack);
      } else {
        this.logger.error(`create failed: ${JSON.stringify(error)}`);
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  /**
   * Delete a user by ID.
   *
   * @param id number
   * @returns Promise<DeleteUserOutput>
   *
   * Flow:
   * 1. First lookup the user (to capture name & id for the output).
   * 2. If found, attempt deletion via TypeORM's `delete({ id })`.
   * 3. Build a DeleteUserOutput object that includes:
   *    - id & name (from before deletion)
   *    - affected (rows deleted, usually 1 or 0)
   * 4. Return the DeleteUserOutput.
   *
   * Notes:
   * - If no user exists, output will be empty except for default values.
   * - `DeleteResult.affected` indicates how many rows were removed.
   * - Gracefully logs and wraps all errors in InternalServerErrorException.
   */
  async delete(id: number): Promise<DeleteUserOutput> {
    this.logger.log(`delete called with id=${id}`);
    const deleteUserOutput: DeleteUserOutput = new DeleteUserOutput();

    try {
      // Step 1: Find the user to delete (to record name/id in the output)
      const user: User | null = await this.findOne({ id });
      if (user != null) {
        // Step 2: Execute the delete
        const deletionResult: DeleteResult = await this.usersRepo.delete({
          id,
        });
        this.logger.log(`delete result: ${JSON.stringify(deletionResult)}`);

        // Step 3: Build output DTO
        deleteUserOutput.id = user.id;
        deleteUserOutput.name = user.name;
      }

      this.logger.log(`delete returning: ${JSON.stringify(deleteUserOutput)}`);
      return deleteUserOutput;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`delete failed: ${error.message}`, error.stack);
      } else {
        this.logger.error(`delete failed: ${JSON.stringify(error)}`);
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}
