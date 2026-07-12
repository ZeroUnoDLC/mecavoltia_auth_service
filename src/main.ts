import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadConfig } from './config/configuration';
import { DomainErrorFilter } from './shared/presentation/domain-error.filter';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/auth');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new DomainErrorFilter());
  app.enableShutdownHooks();

  await app.listen(config.port);
}

void bootstrap();
