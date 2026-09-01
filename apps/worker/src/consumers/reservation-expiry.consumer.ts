import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { WORKER_CONCURRENCY } from '../config/bullmq';
import { StructuredLogger } from '../config/logger';
import type { ReservationExpiryJobPayload } from '../jobs/payloads';
import { QUEUE_NAMES } from '../jobs/queue-names';
import { requireRegistrationId, runJob } from '../jobs/run-job';
import { PrismaService } from '../prisma.service';

@Processor(QUEUE_NAMES.RESERVATION_EXPIRY, {
  concurrency: WORKER_CONCURRENCY[QUEUE_NAMES.RESERVATION_EXPIRY],
})
@Injectable()
export class ReservationExpiryConsumer extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: StructuredLogger,
  ) {
    super();
  }

  async process(job: Job<ReservationExpiryJobPayload>): Promise<{ status: 'ok'; registrationId: string }> {
    const registrationId = requireRegistrationId(job);

    return runJob(
      this.logger,
      QUEUE_NAMES.RESERVATION_EXPIRY,
      job,
      async () => {
        const registration = await this.prisma.registration.findUnique({
          where: { id: registrationId },
          select: {
            id: true,
            registrationStatus: true,
            paymentStatus: true,
            reservationExpiresAt: true,
            categoryId: true,
          },
        });

        this.logger.job({
          job: QUEUE_NAMES.RESERVATION_EXPIRY,
          jobId: job.id,
          registrationId,
          registrationStatus: registration?.registrationStatus,
          paymentStatus: registration?.paymentStatus,
          found: Boolean(registration),
          message: registration
            ? 'Reservation expiry evaluated'
            : 'Registration not found; treating as already processed',
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
      registrationId: job?.data?.registrationId,
      message: error.message,
    });
  }
}
