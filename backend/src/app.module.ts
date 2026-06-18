// Root module wiring GraphQL, TypeORM, and domain modules.
import { Logger, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import depthLimit from 'graphql-depth-limit';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { validateEnvironment } from './config/environment';

import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from './auth/auth.module';
import { FollowsModule } from './follows/follows.module';
import { ActivityModule } from './activity/activity.module';
import { CommentsModule } from './comments/comments.module';

import { User } from './users/user.entity';
import { Post } from './posts/post.entity';
import { Auth } from './auth/auth.entity';
import { Follow } from './follows/follow.entity';
import { Activity } from './activity/activity.entity';
import { Like } from './likes/like.entity';
import { VerificationToken } from './auth/verification/verification-token.entity';
import { Comment } from './comments/comment.entity';

import { GqlThrottlerGuard } from './auth/security/gql-auth.guard';

const databaseConfigLogger = new Logger('DatabaseConfig');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.getOrThrow<string>('NODE_ENV');
        const maxDepth = configService.getOrThrow<number>('GRAPHQL_MAX_DEPTH');

        return {
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
          csrfPrevention: true,
          introspection: nodeEnv !== 'production',
          playground: nodeEnv !== 'production',
          validationRules: [depthLimit(maxDepth)],
          context: ({ req, res }) => ({ req, res }),
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.getOrThrow<number>('RATE_LIMIT_TTL'),
            limit: configService.getOrThrow<number>('RATE_LIMIT_LIMIT'),
          },
        ],
      }),
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.getOrThrow<string>('DB_HOST');
        const port = configService.getOrThrow<number>('DB_PORT');
        const username = configService.getOrThrow<string>('DB_USERNAME');
        const password = configService.getOrThrow<string>('DB_PASSWORD');
        const database = configService.getOrThrow<string>('DB_NAME');
        const synchronize =
          configService.getOrThrow<boolean>('DB_SYNCHRONIZE');

        databaseConfigLogger.log(
          `DB config loaded host=${host} port=${port} database=${database} user=${username} passwordSet=${password.length > 0} synchronize=${synchronize}`,
        );

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [
            User,
            Post,
            Auth,
            Follow,
            Activity,
            Like,
            VerificationToken,
            Comment,
          ],
          synchronize,
        };
      },
    }),

    UsersModule,
    PostsModule,
    AuthModule,
    FollowsModule,
    ActivityModule,
    CommentsModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule { }