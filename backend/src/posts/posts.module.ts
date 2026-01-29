import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { Post } from './post.entity';
import { User } from 'src/users/user.entity';
import { ActivityService } from 'src/activity/activity.service';
import { Activity } from 'src/activity/activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Activity])],
  providers: [PostsService, PostsResolver, ActivityService],
})
export class PostsModule { }
