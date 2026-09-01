import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { WORKER_CONCURRENCY } from '../config/bullmq';
import { StructuredLogger } from '../config/logger';
import type { NotificationJobPayload } from '../jobs/payloads';
import { QUEUE_NAMES } from '../jobs/queue-names';
import { requireRegistrationId, runJob } from '../jobs/run-job';
import { PrismaService } from '../prisma.service';

@Processor(QUEUE_NAMES.NOTIFICATIONS, {
  concurrency: WORKER_CONCURRENCY[QUEUE_NAMES.NOTIFICATIONS],
})
@Injectable()
export class NotificationConsumer extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: StructuredLogger,
  ) {
    super();
  }

  async process(job: Job<NotificationJobPayload>): Promise<{ status: 'ok'; registrationId: string }> {
    const registrationId = requireRegistrationId(job);
    const type = job.data.type ?? job.name ?? 'notification';

    return runJob(
      this.logger,
      QUEUE_NAMES.NOTIFICATIONS,
      job,
      async () => {
        const registration = await this.prisma.registration.findUnique({
          where: { id: registrationId },
          select: { id: true, userId: true, registrationStatus: true },
        });

        this.logger.job({
          job: QUEUE_NAMES.NOTIFICATIONS,
          jobId: job.id,
          registrationId,
          type,
          found: Boolean(registration),
          userId: registration?.userId,
          message: 'Notification job evaluated',
        });

        return { status: 'ok' as const, registrationId };
      },
      { registrationId, type },
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<NotificationJobPayload> | undefined, error: Error): void {
    this.logger.job({
      level: 'error',
      job: QUEUE_NAMES.NOTIFICATIONS,
      jobId: job?.id,
      registrationId: job?.data?.registrationId,
      message: error.message,
    });
  }
}
