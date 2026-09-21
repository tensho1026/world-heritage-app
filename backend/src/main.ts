import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import { json } from 'express';
// TypeORM loads the PostgreSQL driver dynamically. Keep a static import so
// Vercel's function bundler includes `pg` in the deployed artifact.
import 'pg';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const port = process.env.PORT ?? 3000;

  app.enableCors({
    origin: [
      'https://world-heritage-app-sigma.vercel.app',
    ],
    credentials: false,
  });

  app.use(compression());
  app.use(json({ limit: '64kb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
    }),
  );
  await app.listen(port);
}

void bootstrap();
