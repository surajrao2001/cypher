import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { defaultJobOptions } from './config/bullmq';
import { validateEnv, type WorkerEnv } from './config/env';
import { StructuredLogger } from './config/logger';
import { parseRedisUrl } from './config/redis';
import { ExportsConsumer } from './consumers/exports.consumer';
import { MediaConsumer } from './consumers/media.consumer';
import { NotificationConsumer } from './consumers/notification.consumer';
import { ReservationExpiryConsumer } from './consumers/reservation-expiry.consumer';
import { QUEUE_NAMES } from './jobs/queue-names';
import { PrismaService } from './prisma.service';
import { ReservationExpiryService } from './reservation-expiry.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [join(process.cwd(), '.env'), join(process.cwd(), '../../.env')],
      validate: validateEnv,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<WorkerEnv, true>) => ({
        prefix: 'cypher',
        connection: parseRedisUrl(config.get('REDIS_URL', { infer: true })),
        defaultJobOptions,
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.RESERVATION_EXPIRY },
      { name: QUEUE_NAMES.NOTIFICATIONS },
      { name: QUEUE_NAMES.MEDIA },
      { name: QUEUE_NAMES.EXPORTS },
    ),
  ],
  providers: [
    StructuredLogger,
    PrismaService,
    ReservationExpiryService,
    ReservationExpiryConsumer,
    NotificationConsumer,
    MediaConsumer,
    ExportsConsumer,
  ],
})
export class AppModule {}
