import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { WORKER_CONCURRENCY } from '../config/bullmq';
import { StructuredLogger } from '../config/logger';
import type { MediaJobPayload } from '../jobs/payloads';
import { QUEUE_NAMES } from '../jobs/queue-names';
import { runJob } from '../jobs/run-job';

@Processor(QUEUE_NAMES.MEDIA, {
  concurrency: WORKER_CONCURRENCY[QUEUE_NAMES.MEDIA],
})
@Injectable()
export class MediaConsumer extends WorkerHost {
  constructor(private readonly logger: StructuredLogger) {
    super();
  }

  async process(job: Job<MediaJobPayload>): Promise<{ status: 'ok' }> {
    return runJob(
      this.logger,
      QUEUE_NAMES.MEDIA,
      job,
      async () => {
        this.logger.job({
          job: QUEUE_NAMES.MEDIA,
          jobId: job.id,
          assetId: job.data.assetId,
          kind: job.data.kind ?? job.name,
          message: 'Media job evaluated',
        });
        return { status: 'ok' as const };
      },
      { assetId: job.data.assetId, kind: job.data.kind ?? job.name },
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<MediaJobPayload> | undefined, error: Error): void {
    this.logger.job({
      level: 'error',
      job: QUEUE_NAMES.MEDIA,
      jobId: job?.id,
      message: error.message,
    });
  }
}
