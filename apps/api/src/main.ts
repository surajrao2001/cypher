import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { AppLogger, writeLog } from './common/logger';
import type { Env } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const adapter = new FastifyAdapter({ logger: false });

  // Register before Nest init so Cashfree dashboard Test (empty JSON body) is accepted.
  // Also keeps req.rawBody for webhook HMAC later.
  adapter.useBodyParser('application/json', true, undefined, (_req, body, done) => {
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(String(body ?? ''), 'utf8');
    const text = buffer.toString('utf8').trim();
    if (!text) {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(text) as unknown);
    } catch {
      done(null, { raw: text });
    }
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
    rawBody: true,
  });

  const logger = new AppLogger();
  app.useLogger(logger);

  const config = app.get(ConfigService<Env, true>);
  const prefix = config.get('API_PREFIX', { infer: true });
  const port = config.get('API_PORT', { infer: true });
  const webOrigin = config.get('WEB_ORIGIN', { infer: true });
  const mobileOrigin = config.get('MOBILE_ORIGIN', { infer: true });

  await app.register(multipart as never, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });

  app.setGlobalPrefix(prefix);
  app.enableCors({
    origin: [webOrigin, mobileOrigin ?? 'http://localhost:8081'],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'x-webhook-signature',
      'x-webhook-timestamp',
      'x-webhook-version',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onRequest', async (_request, reply) => {
    void reply.header('X-Content-Type-Options', 'nosniff');
    void reply.header('X-Frame-Options', 'DENY');
    void reply.header('Referrer-Policy', 'no-referrer');
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cypher API')
    .setDescription('Dance platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/v1', 'Versioned API')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
    useGlobalPrefix: false,
  });

  await app.listen(port, '0.0.0.0');
  writeLog({
    level: 'info',
    message: 'API listening',
    port,
    prefix,
  });
}

void bootstrap();
