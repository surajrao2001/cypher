import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StructuredLogger } from './config/logger';

function logEnvPresence(): void {
  const keys = ['DATABASE_URL', 'REDIS_URL', 'NODE_ENV', 'APP_ENV', 'CASHFREE_ENV'] as const;
  const status = keys
    .map((key) => `${key}=${process.env[key]?.trim() ? 'set' : 'missing'}`)
    .join(' ');
  console.error(`Worker env check: ${status}`);
}

async function bootstrap(): Promise<void> {
  logEnvPresence();

  const bootstrapLogger = new StructuredLogger();
  // abortOnError:false so init failures reject into our catch (and print) instead of a silent exit.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: bootstrapLogger,
    bufferLogs: false,
    abortOnError: false,
  });

  const logger = app.get(StructuredLogger);
  app.useLogger(logger);
  app.enableShutdownHooks();

  logger.log({ message: 'Worker started' }, 'Bootstrap');
  console.error('Worker started successfully');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(`Worker failed to start: ${message}`);
  if (stack) {
    console.error(stack);
  }
  const logger = new StructuredLogger();
  logger.error({
    message: 'Worker failed to start',
    error: message,
    stack,
  });
  process.exit(1);
});
