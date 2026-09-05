import type { DefaultJobOptions } from 'bullmq';
import { QUEUE_NAMES } from '../jobs/queue-names';

export const defaultJobOptions: DefaultJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
};

export const WORKER_CONCURRENCY: Record<(typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES], number> = {
  [QUEUE_NAMES.RESERVATION_EXPIRY]: 5,
  [QUEUE_NAMES.NOTIFICATIONS]: 10,
  [QUEUE_NAMES.MEDIA]: 2,
  [QUEUE_NAMES.EXPORTS]: 1,
};
