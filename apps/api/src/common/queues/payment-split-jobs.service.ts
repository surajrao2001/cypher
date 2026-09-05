import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PAYMENT_SPLIT_DELAY_MS, QUEUE_NAMES, paymentSplitJobId } from './queue-names';

export type PaymentSplitJobPayload = {
  orderId: string;
  vendorId: string;
  amountMajor: number;
};

@Injectable()
export class PaymentSplitJobsService {
  private readonly logger = new Logger(PaymentSplitJobsService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.PAYMENT_SPLIT)
    private readonly splitQueue: Queue<PaymentSplitJobPayload>,
  ) {}

  async scheduleSplit(payload: PaymentSplitJobPayload, delayMs = PAYMENT_SPLIT_DELAY_MS): Promise<void> {
    try {
      await this.splitQueue.add('split', payload, {
        jobId: paymentSplitJobId(payload.orderId),
        delay: Math.max(0, delayMs),
        attempts: 8,
        backoff: { type: 'exponential', delay: 15_000 },
      });
    } catch (error) {
      this.logger.warn(
        `Could not schedule split for ${payload.orderId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
