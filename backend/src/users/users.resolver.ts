import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './user.entity';
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

  @ResolveField(() => Boolean)
  async isFollowedByMe(
    @Parent() user: User,
    @CurrentUser() currentUser?: User,
  ) {
    if (!currentUser) return false;
    if (currentUser.id === user.id) return false;

    return this.usersService.isFollowing(
      currentUser.id,
      user.id,
    );
  }

  @ResolveField(() => Int)
  followersCount(@Parent() user: User) {
    return this.usersService.countFollowers(user.id);
  }

  @ResolveField(() => Int)
  followingCount(@Parent() user: User) {
    return this.usersService.countFollowing(user.id);
  }


}

