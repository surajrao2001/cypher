import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { WORKER_CONCURRENCY } from '../config/bullmq';
import { StructuredLogger } from '../config/logger';
import type { ExportJobPayload } from '../jobs/payloads';
import { QUEUE_NAMES } from '../jobs/queue-names';
import { runJob } from '../jobs/run-job';

@Processor(QUEUE_NAMES.EXPORTS, {
  concurrency: WORKER_CONCURRENCY[QUEUE_NAMES.EXPORTS],
})
@Injectable()
export class ExportsConsumer extends WorkerHost {
  constructor(private readonly logger: StructuredLogger) {
    super();
  }

  async process(job: Job<ExportJobPayload>): Promise<{ status: 'ok' }> {
    return runJob(
      this.logger,
      QUEUE_NAMES.EXPORTS,
      job,
      async () => {
        this.logger.job({
          job: QUEUE_NAMES.EXPORTS,
          jobId: job.id,
          exportId: job.data.exportId,
          kind: job.data.kind ?? job.name,
          message: 'Export job evaluated',
        });
        return { status: 'ok' as const };
      },
      { exportId: job.data.exportId, kind: job.data.kind ?? job.name },
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ExportJobPayload> | undefined, error: Error): void {
    this.logger.job({
      level: 'error',
      job: QUEUE_NAMES.EXPORTS,
      jobId: job?.id,
      message: error.message,
    });
  }
}
