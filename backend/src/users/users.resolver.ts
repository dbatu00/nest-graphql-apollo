// GraphQL resolver for user profile and follow-state fields.
import { Resolver, Query, Args, Int, ResolveField, Parent, Mutation } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { CurrentUser } from 'src/auth/security/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/security/gql-auth.guard';

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

  @UseGuards(GqlAuthGuard)
  @Mutation(() => User)
  updateMyProfile(
    @CurrentUser() user: User,
    @Args('displayName', { nullable: true }) displayName?: string,
    @Args('bio', { nullable: true }) bio?: string,
    @Args('avatarUrl', { nullable: true }) avatarUrl?: string,
    @Args('coverUrl', { nullable: true }) coverUrl?: string,
  ): Promise<User> {
    const input: {
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
      coverUrl?: string;
    } = {};

    if (typeof displayName === 'string') {
      input.displayName = displayName;
    }

    if (typeof bio === 'string') {
      input.bio = bio;
    }

    if (typeof avatarUrl === 'string') {
      input.avatarUrl = avatarUrl;
    }

    if (typeof coverUrl === 'string') {
      input.coverUrl = coverUrl;
    }

    return this.usersService.updateMyProfile(user.id, {
      ...input,
    });
  }

  @ResolveField(() => Boolean)
  async followedByMe(
    @Parent() user: User,
    @CurrentUser() currentUser?: User,
  ) {
    // No viewer or self-profile should always resolve to false.
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

