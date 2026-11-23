import 'reflect-metadata';
import 'dotenv/config';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, transformOptions: { enableImplicitConversion: false } }));
  const allowedOrigins = (process.env.FRONTEND_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
  for (const origin of allowedOrigins) {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || !['https:', 'http:'].includes(parsed.protocol) || (parsed.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(parsed.hostname))) {
      throw new Error('FRONTEND_ORIGINS must contain exact HTTPS origins (HTTP is allowed only for localhost).');
    }
  }
  if (allowedOrigins.length) app.enableCors({ origin: allowedOrigins, methods: ['GET', 'POST', 'PATCH', 'OPTIONS'], allowedHeaders: ['Authorization', 'Content-Type', 'X-Tenant-Id'], maxAge: 600 });
  app.enableShutdownHooks();
  await app.listen(Number(process.env.API_PORT ?? process.env.PORT ?? 3001), '0.0.0.0');
}

bootstrap().catch((error: unknown) => {
  console.error('Melkino API failed to start. Check the environment configuration; secret values are not printed.');
  process.exitCode = 1;
});
