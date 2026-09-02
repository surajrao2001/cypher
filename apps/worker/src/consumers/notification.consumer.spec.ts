import { Job } from 'bullmq';
import { StructuredLogger } from '../config/logger';
import type { NotificationJobPayload } from '../jobs/payloads';
import { QUEUE_NAMES } from '../jobs/queue-names';
import type { PrismaService } from '../prisma.service';
import { NotificationConsumer } from './notification.consumer';

describe('NotificationConsumer', () => {
  const logger = new StructuredLogger({
    environment: 'test',
    level: 'error',
    stdout: { write: () => true },
    stderr: { write: () => true },
  });

  it('logs and completes for a valid notification payload', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: 'reg-1',
      userId: 'user-1',
      registrationStatus: 'confirmed',
    });
    const prisma = { registration: { findUnique } } as unknown as PrismaService;
    const consumer = new NotificationConsumer(prisma, logger);
    const job = {
      id: 'job-1',
      name: 'registration-confirmed',
      queueName: QUEUE_NAMES.NOTIFICATIONS,
      attemptsMade: 0,
      data: { registrationId: 'reg-1', type: 'registration-confirmed' },
    } as Job<NotificationJobPayload>;

    await expect(consumer.process(job)).resolves.toEqual({
      status: 'ok',
      registrationId: 'reg-1',
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      select: { id: true, userId: true, registrationStatus: true },
    });
  });
});
