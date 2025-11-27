import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DeleteResult } from "typeorm";
import { User } from "./user.entity";

@Injectable()
export class UsersService {
  // Dedicated logger for this service, namespace = "UsersService"
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectRepository(User) private usersRepo: Repository<User>) { }

  async getAllUsers(): Promise<User[]> {
    this.logger.log(`getAllUsers called`);

    try {
      const result = await this.usersRepo.find();
      this.logger.log(`getAllUsers success | count=${result.length}`);
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`getAllUsers failed | error=${error.message}`, error.stack);
      } else {
        this.logger.error(`getAllUsers failed | error=${JSON.stringify(error)}`);
      }
      throw new InternalServerErrorException('getAllUsers failed to fetch all users');
    }
  }

  async findUser(idOrName: number | string): Promise<User | null> {
    this.logger.log(`findUser called | param=${JSON.stringify(idOrName)}`);

    try {
      const whereClause =
        typeof idOrName === "number"
          ? { id: idOrName }
          : { name: idOrName };

      const result = await this.usersRepo.findOne({ where: whereClause });
      this.logger.log(
        `findUser success | param=${JSON.stringify(idOrName)} | result=${JSON.stringify(result)}`
      );

      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `findUser failed | param=${JSON.stringify(idOrName)} | error=${error.message}`,
          error.stack
        );
      } else {
        this.logger.error(
          `findUser failed | param=${JSON.stringify(idOrName)} | error=${JSON.stringify(error)}`
        );
      }
      throw new InternalServerErrorException("Failed to fetch user");
    }
  }


  async findUserById(id: number): Promise<User | null> {
    this.logger.log(`findUserById called | id=${id}`);

    try {
      const result = await this.usersRepo.findOne({ where: { id } });

      this.logger.log(
        `findUserById success | id=${id} | result=${result ? "FOUND" : "NULL"}`
      );

      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `findUserById failed | id=${id} | error=${error.message}`,
          error.stack
        );
      } else {
        this.logger.error(
          `findUserById failed | id=${id} | error=${String(error)}`
        );
      }

      throw new InternalServerErrorException("Failed to fetch user");
    }
  }

  async create(name: string): Promise<User> {
    this.logger.log(`create called | name=${name}`);

    try {
      const user = this.usersRepo.create({ name }); //optional: use in case you want to manipulate the instance first
      const result = await this.usersRepo.save(user);
      this.logger.log(
        `create success | name=${name} | result=${JSON.stringify(result)}`
      );

      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `create failed | name=${name} | error=${error.message}`,
          error.stack
        );
      } else {
        this.logger.error(
          `create failed | name=${name} | error=${JSON.stringify(error)}`
        );
      }
      throw new InternalServerErrorException("Failed to create user");
    }
  }

  async delete(id: number): Promise<boolean> {
    this.logger.log(`delete called | id=${id}`);

    try {
      const deletionResult: DeleteResult = await this.usersRepo.delete({ id });
      this.logger.log(
        `delete executed | id=${id} | result=${JSON.stringify(deletionResult)}`
      );

      if (deletionResult.affected === 1) {
        this.logger.log(`delete success | id=${id}`);
        return true;
      }

      this.logger.warn(`delete no rows affected | id=${id}`);
      return false;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `delete failed | id=${id} | error=${error.message}`,
          error.stack
        );
      } else {
        this.logger.error(
          `delete failed | id=${id} | error=${JSON.stringify(error)}`
        );
      }
      throw new InternalServerErrorException("Failed to delete user");
    }
  }
}
