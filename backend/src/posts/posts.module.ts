import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { Post } from './post.entity';
import { User } from 'src/users/user.entity';
import { ActivityModule } from 'src/activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, User]),
    ActivityModule, // 👈 import the module, not the service
  ],
  providers: [PostsService, PostsResolver],
})
export class PostsModule { }
