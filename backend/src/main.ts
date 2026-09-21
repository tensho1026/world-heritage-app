import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import express, { json } from 'express';
import type { Request, Response } from 'express';
// TypeORM loads the PostgreSQL driver dynamically. Keep a static import so
// Vercel's function bundler includes `pg` in the deployed artifact.
import 'pg';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

const server = express();
let appInitialization: Promise<void> | undefined;

const vercelFrontendOrigin =
  /^https:\/\/world-heritage(?:-app)?-[a-z0-9-]+-tenshos-projects-d37b97a1\.vercel\.app$/;

async function initializeApp() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    { bodyParser: false },
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        origin === 'https://world-heritage-app-sigma.vercel.app' ||
        vercelFrontendOrigin.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
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

  await app.init();
}

function ensureAppInitialized() {
  appInitialization ??= initializeApp();
  return appInitialization;
}

export default async function handler(req: Request, res: Response) {
  await ensureAppInitialized();
  server(req, res);
}

if (!process.env.VERCEL) {
  void ensureAppInitialized().then(() => {
    const port = process.env.PORT ?? 3000;
    server.listen(port);
  });
}
