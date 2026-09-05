import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, reservationExpiryJobId } from './queue-names';

@Injectable()
export class ReservationJobsService {
  private readonly logger = new Logger(ReservationJobsService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.RESERVATION_EXPIRY)
    private readonly expiryQueue: Queue,
  ) {}

  async scheduleExpiry(registrationId: string, expiresAt: Date): Promise<void> {
    const delay = Math.max(0, expiresAt.getTime() - Date.now());
    try {
      await this.expiryQueue.add(
        'expire',
        { mode: 'expire' as const, registrationId },
        {
          jobId: reservationExpiryJobId(registrationId),
          delay,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Could not schedule expiry for ${registrationId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async cancelExpiry(registrationId: string): Promise<void> {
    try {
      await this.expiryQueue.remove(reservationExpiryJobId(registrationId));
    } catch (error) {
      this.logger.warn(
        `Could not cancel expiry for ${registrationId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
