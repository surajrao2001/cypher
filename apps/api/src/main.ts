import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { AppLogger, writeLog } from './common/logger';
import type { Env } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  const logger = new AppLogger();
  app.useLogger(logger);

  const config = app.get(ConfigService<Env, true>);
  const prefix = config.get('API_PREFIX', { infer: true });
  const port = config.get('API_PORT', { infer: true });
  const webOrigin = config.get('WEB_ORIGIN', { infer: true });
  const mobileOrigin = config.get('MOBILE_ORIGIN', { infer: true });

  app.setGlobalPrefix(prefix);
  app.enableCors({
    origin: [webOrigin, mobileOrigin ?? 'http://localhost:8081'],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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
