import 'dotenv/config';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { Post } from './posts/post.entity';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from './auth/auth.module';
import { Auth } from './auth/auth.entity';
import { ConfigModule } from '@nestjs/config';
import { FollowsModule } from './follows/follows.module';
import { Follow } from './follows/follow.entity';
import { ActivityResolver } from './activity/activity.resolver';
import { ActivityModule } from './activity/activity.module';
import { Activity } from './activity/activity.entity';
import { Like } from './posts/like.entity';




@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'qweasdzxc',
      database: 'nest_graphql',
      entities: [User, Post, Auth, Follow, Activity, Like],
      synchronize: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true, // IMPORTANT
    }),
    UsersModule,
    PostsModule,
    AuthModule,
    FollowsModule,
    ActivityModule,
  ],
  providers: [ActivityResolver]
})
export class AppModule { }
