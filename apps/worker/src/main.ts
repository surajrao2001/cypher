import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StructuredLogger } from './config/logger';

async function bootstrap(): Promise<void> {
  const bootstrapLogger = new StructuredLogger();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: bootstrapLogger,
    bufferLogs: true,
    abortOnError: true,
  });

  const logger = app.get(StructuredLogger);
  app.useLogger(logger);
  app.enableShutdownHooks();

  logger.log({ message: 'Worker started' }, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  // Always write plain text so Railway deploy logs show the failure even if JSON logs are truncated.
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
