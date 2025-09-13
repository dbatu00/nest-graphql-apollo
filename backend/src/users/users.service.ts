import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { DeleteResult } from 'typeorm/browser';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  findAll(): Promise<User[]> {
    return this.usersRepo.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  // save() returns user entity because save<T extends DeepPartial<Entity>>(entity: T): Promise<T & Entity>
  create(name: string): Promise<User> {
    const user = this.usersRepo.create({ name }); //entity instance in memory -sync
    return this.usersRepo.save(user); //save instance to memory -async
  }

  delete(id: number): Promise<DeleteResult> {
    return this.usersRepo.delete({ id });
  }
}
