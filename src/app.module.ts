import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost', // change if using Docker/remote DB
      port: 5432,
      username: 'postgres', // your DB username
      password: 'qweasdzxc', // your DB password
      database: 'nest_graphql',
      entities: [User],
      synchronize: true, // auto-create tables (dev only!)
    }),

    UsersModule,
  ],
})
export class AppModule {}
