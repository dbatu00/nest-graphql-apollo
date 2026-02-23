// Root module wiring GraphQL, TypeORM, and domain modules.
import { Logger, Module } from '@nestjs/common';
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
import { FollowsModule } from './follows/follows.module';
import { Follow } from './follows/follow.entity';
import { ActivityResolver } from './activity/activity.resolver';
import { ActivityModule } from './activity/activity.module';
import { Activity } from './activity/activity.entity';
import { Like } from './posts/like.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnvironment } from './config/environment';

const databaseConfigLogger = new Logger('DatabaseConfig');

@Module({
  imports: [
    // Single validated source of truth for runtime configuration.
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.getOrThrow<string>('DB_HOST');
        const port = configService.getOrThrow<number>('DB_PORT');
        const username = configService.getOrThrow<string>('DB_USERNAME');
        const passwordRaw = configService.get<unknown>('DB_PASSWORD');
        const password = typeof passwordRaw === 'string' ? passwordRaw : String(passwordRaw ?? '');
        const database = configService.getOrThrow<string>('DB_NAME');
        const synchronize = configService.getOrThrow<boolean>('DB_SYNCHRONIZE');

        databaseConfigLogger.log(
          `DB config loaded host=${host} port=${port} database=${database} user=${username} passwordType=${typeof passwordRaw} passwordSet=${password.length > 0} synchronize=${synchronize}`,
        );

        return {
          type: 'postgres',
          // All DB settings are env-driven to prevent hardcoded credentials.
          host,
          port,
          username,
          password,
          database,
          entities: [User, Post, Auth, Follow, Activity, Like],
          // Safe default comes from validateEnvironment (false in production).
          synchronize,
        };
      },
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
