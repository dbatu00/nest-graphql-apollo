import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { User } from './user.entity';

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

  async findOne(id: number): Promise<User | null> {
    this.logger.log(`findOne called with id=${id}`);
    const result = await this.usersRepo.findOne({ where: { id } });
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

  async delete(id: number): Promise<DeleteResult> {
    this.logger.log(`delete called with id=${id}`);
    const result = await this.usersRepo.delete({ id });
    this.logger.log(`delete result: ${JSON.stringify(result)}`);
    return result;
  }
}
