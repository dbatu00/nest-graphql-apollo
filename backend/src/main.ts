import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

// Hoisted so the catch block and signal handlers can call app.close().
let app: INestApplication | undefined;

// Register before anything async runs so no rejection or exception
// can fire before these handlers are in place.
const logger = new Logger('Bootstrap');

process.on('unhandledRejection', (reason: unknown) => {
  logger.error(`Unhandled rejection: ${reason}`);
  setTimeout(() => process.exit(1), 1000);
});

process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  setTimeout(() => process.exit(1), 1000);
});

// Graceful shutdown: stop accepting new requests and wait for
// in-flight ones to finish before the process exits.
process.on('SIGTERM', async () => {
  logger.log('SIGTERM received, shutting down gracefully');
  await app?.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.log('SIGINT received, shutting down gracefully');
  await app?.close();
  process.exit(0);
});

async function bootstrap() {
  app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const port = configService.get<number>('PORT') ?? 3000;
  const corsOrigins = configService.get<string[]>('CORS_ORIGINS') ?? [
    'http://localhost:19006',
    'http://localhost:8081',
    'http://localhost:3000',
  ];

  logger.log(`Starting app env=${nodeEnv} port=${port}`);
  logger.log(`CORS origins: ${corsOrigins.join(', ')}`);

  app.use(helmet({ contentSecurityPolicy: false }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-app-language'],
    credentials: true,
  });

  await app.listen(port);
  logger.log(`App is listening on port ${port}`);
}

bootstrap().catch(async (err: unknown) => {
  // bootstrap() failed — could be NestFactory, config, middleware, or listen.
  // app.close() releases DB connections and runs lifecycle hooks even on a
  // partially-initialized app; Nest handles the case where init didn't finish.
  console.error('Fatal bootstrap error:', err);
  await app?.close();
  process.exitCode = 1;
});