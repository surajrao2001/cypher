import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { WORKER_CONCURRENCY } from '../config/bullmq';
import { StructuredLogger } from '../config/logger';
import type { PaymentSplitJobPayload } from '../jobs/payloads';
import { QUEUE_NAMES } from '../jobs/queue-names';
import { runJob } from '../jobs/run-job';
import { PaymentSplitService } from '../payment-split.service';

@Processor(QUEUE_NAMES.PAYMENT_SPLIT, {
  concurrency: WORKER_CONCURRENCY[QUEUE_NAMES.PAYMENT_SPLIT],
})
@Injectable()
export class PaymentSplitConsumer extends WorkerHost {
  constructor(
    private readonly splits: PaymentSplitService,
    private readonly logger: StructuredLogger,
  ) {
    super();
  }

  async process(job: Job<PaymentSplitJobPayload>): Promise<{ status: 'ok'; orderId: string }> {
    const orderId = job.data?.orderId;
    if (!orderId || !job.data.vendorId) {
      throw new Error('payment-split job missing orderId/vendorId');
    }

    return runJob(
      this.logger,
      QUEUE_NAMES.PAYMENT_SPLIT,
      job,
      async () => {
        await this.splits.splitAfterPayment(job.data);
        this.logger.job({
          job: QUEUE_NAMES.PAYMENT_SPLIT,
          jobId: job.id,
          message: 'Cashfree Easy Split applied',
          orderId,
          vendorId: job.data.vendorId,
        });
        return { status: 'ok' as const, orderId };
      },
      { registrationId: orderId },
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<PaymentSplitJobPayload> | undefined, error: Error): void {
    this.logger.job({
      level: 'error',
      job: QUEUE_NAMES.PAYMENT_SPLIT,
      jobId: job?.id,
      message: error.message,
      orderId: job?.data?.orderId,
    });
  }
}
