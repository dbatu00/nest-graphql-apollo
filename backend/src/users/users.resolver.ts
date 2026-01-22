import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards, Logger, InternalServerErrorException } from '@nestjs/common';

import { UsersService } from './users.service';
import { User } from './user.entity';


import { GqlAuthGuard } from 'src/auth/gql-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) { }


  /**
   * Public profile lookup
   * Used when visiting /user/:username
   */
  @Query(() => User, { nullable: true })
  userByUsername(
    @Args('username') username: string,
  ): Promise<User | null> {
    return this.usersService.findByUsername(username);
  }
}

