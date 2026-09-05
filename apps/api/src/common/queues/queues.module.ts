import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import type { Env } from '../../config/env.validation';
import { QUEUE_NAMES } from './queue-names';
import { ReservationJobsService } from './reservation-jobs.service';
import { PaymentSplitJobsService } from './payment-split-jobs.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        prefix: 'cypher',
        connection: {
          url: config.get('REDIS_URL', { infer: true }),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential' as const, delay: 2000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.RESERVATION_EXPIRY },
      { name: QUEUE_NAMES.PAYMENT_SPLIT },
    ),
  ],
  providers: [ReservationJobsService, PaymentSplitJobsService],
  exports: [ReservationJobsService, PaymentSplitJobsService, BullModule],
})
export class QueuesModule {}
