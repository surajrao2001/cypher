import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { Job, type Queue } from 'bullmq';
import { WORKER_CONCURRENCY } from '../config/bullmq';
import { StructuredLogger } from '../config/logger';
import type { ReservationExpiryJobPayload } from '../jobs/payloads';
import { QUEUE_NAMES } from '../jobs/queue-names';
import { requireRegistrationId, runJob } from '../jobs/run-job';
import { ReservationExpiryService } from '../reservation-expiry.service';

@Processor(QUEUE_NAMES.RESERVATION_EXPIRY, {
  concurrency: WORKER_CONCURRENCY[QUEUE_NAMES.RESERVATION_EXPIRY],
})
@Injectable()
export class ReservationExpiryConsumer extends WorkerHost implements OnModuleInit {
  constructor(
    private readonly expiry: ReservationExpiryService,
    private readonly logger: StructuredLogger,
    @InjectQueue(QUEUE_NAMES.RESERVATION_EXPIRY)
    private readonly queue: Queue,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      'sweep',
      { mode: 'sweep' },
      {
        jobId: 'reservation-expiry:sweep',
        repeat: { every: 60_000 },
        removeOnComplete: true,
      },
    );
  }

  async process(
    job: Job<ReservationExpiryJobPayload>,
  ): Promise<{ status: 'ok'; registrationId?: string; scanned?: number; expired?: number }> {
    if (job.data?.mode === 'sweep' || job.name === 'sweep') {
      return runJob(
        this.logger,
        QUEUE_NAMES.RESERVATION_EXPIRY,
        job,
        async () => {
          const result = await this.expiry.sweepDue();
          this.logger.job({
            job: QUEUE_NAMES.RESERVATION_EXPIRY,
            jobId: job.id,
            message: 'Reservation expiry sweep finished',
            scanned: result.scanned,
            expired: result.expired,
          });
          return { status: 'ok' as const, ...result };
        },
      );
    }

    const registrationId = requireRegistrationId(job);

    return runJob(
      this.logger,
      QUEUE_NAMES.RESERVATION_EXPIRY,
      job,
      async () => {
        const outcome = await this.expiry.expireOne(registrationId);
        this.logger.job({
          job: QUEUE_NAMES.RESERVATION_EXPIRY,
          jobId: job.id,
          registrationId,
          outcome,
          message:
            outcome === 'expired'
              ? 'Reservation expired and capacity released'
              : 'Reservation expiry skipped (already settled or not due)',
        });
        return { status: 'ok' as const, registrationId };
      },
      { registrationId },
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ReservationExpiryJobPayload> | undefined, error: Error): void {
    this.logger.job({
      level: 'error',
      job: QUEUE_NAMES.RESERVATION_EXPIRY,
      jobId: job?.id,
      registrationId: job?.data && 'registrationId' in job.data ? job.data.registrationId : undefined,
      message: error.message,
    });
  }
}
