import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  findAll(): Promise<User[]> {
    return this.usersRepo.find();
  }

  create(name: string): Promise<User> {
    const user = this.usersRepo.create({ name });
    return this.usersRepo.save(user);
  }
}
