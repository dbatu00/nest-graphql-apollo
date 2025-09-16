/*TODO - error handling*/

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { User } from './user.entity';
import { DeleteUserOutput } from './delete-user.output';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async findAll(): Promise<User[]> {
    this.logger.log(`findAll called`);
    const result = await this.usersRepo.find();
    this.logger.log(`findAll result: ${JSON.stringify(result)}`);
    return result;
  }

  async findOne(criteria: {
    id?: number;
    name?: string;
  }): Promise<User | null> {
    this.logger.log(`findOne called with criteria=${JSON.stringify(criteria)}`);

    if (!criteria.id && !criteria.name) {
      throw new Error('Must provide either id or name to findOne');
    }

    const result = await this.usersRepo.findOne({
      where: criteria,
    });

    this.logger.log(`findOne result: ${JSON.stringify(result)}`);
    return result;
  }

  async create(name: string): Promise<User> {
    this.logger.log(`create called with name=${name}`);
    const user = this.usersRepo.create({ name });
    const result = await this.usersRepo.save(user);
    this.logger.log(`create result: ${JSON.stringify(result)}`);
    return result;
  }

  async delete(id: number): Promise<DeleteUserOutput> {
    this.logger.log(`delete called with id=${id}`);
    const user: User | null = await this.findOne({ id: id });
    const deleteUserOutput: DeleteUserOutput = new DeleteUserOutput();
    if (user != null) {
      const deletionResult: DeleteResult = await this.usersRepo.delete({ id });
      this.logger.log(`delete result: ${JSON.stringify(deletionResult)}`);
      deleteUserOutput.id = user.id;
      deleteUserOutput.name = user.name;
      deleteUserOutput.affected = deletionResult.affected ?? 0;
    }
    this.logger.log(`delete returning: ${JSON.stringify(deleteUserOutput)}`);

    return deleteUserOutput;
  }
}
