// Root module wiring GraphQL, TypeORM, and domain modules.
import { Logger, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import depthLimit from 'graphql-depth-limit';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { GqlThrottlerGuard } from './auth/gql-auth.guard';
import { VerificationToken } from './auth/verification-token.entity';

const databaseConfigLogger = new Logger('DatabaseConfig');

@Module({
  imports: [
    // Single validated source of truth for runtime configuration.
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
        const maxDepth = configService.get<number>('GRAPHQL_MAX_DEPTH') ?? 8;
        const isProduction = nodeEnv === 'production';

        return {
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
          csrfPrevention: true,
          introspection: !isProduction,
          playground: !isProduction,
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
            ttl: configService.get<number>('RATE_LIMIT_TTL') ?? 60_000,
            limit: configService.get<number>('RATE_LIMIT_LIMIT') ?? 120,
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
          entities: [User, Post, Auth, Follow, Activity, Like, VerificationToken],
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
  providers: [
    ActivityResolver,
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ]
})
export class AppModule { }
