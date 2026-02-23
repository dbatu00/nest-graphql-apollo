// Application bootstrap entrypoint.
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const port = configService.get<number>('PORT') ?? 3000;
  const corsOrigins = configService.get<string[]>('CORS_ORIGINS') ?? ['http://localhost:19006', 'http://localhost:8081', 'http://localhost:3000'];

  logger.log(`Starting app env=${nodeEnv} port=${port}`);
  logger.log(`CORS origins: ${corsOrigins.join(', ')}`);

  // Restrict cross-origin access to explicit allowlisted origins.
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Port is normalized by validateEnvironment.
  await app.listen(port);
  logger.log(`App is listening on port ${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
