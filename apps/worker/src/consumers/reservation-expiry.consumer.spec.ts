import { Job } from 'bullmq';
import { StructuredLogger } from '../config/logger';
import type { ReservationExpiryJobPayload } from '../jobs/payloads';
import { QUEUE_NAMES } from '../jobs/queue-names';
import type { PrismaService } from '../prisma.service';
import { ReservationExpiryConsumer } from './reservation-expiry.consumer';

describe('ReservationExpiryConsumer', () => {
  const logger = new StructuredLogger({
    environment: 'test',
    level: 'error',
    stdout: { write: () => true },
    stderr: { write: () => true },
  });

  it('logs and completes for a valid registration payload', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: 'reg-1',
      registrationStatus: 'pending_payment',
      paymentStatus: 'pending',
      reservationExpiresAt: new Date('2026-09-01T12:00:00.000Z'),
      categoryId: 'cat-1',
    });
    const prisma = { registration: { findUnique } } as unknown as PrismaService;
    const consumer = new ReservationExpiryConsumer(prisma, logger);
    const job = {
      id: 'job-1',
      name: 'expire',
      queueName: QUEUE_NAMES.RESERVATION_EXPIRY,
      attemptsMade: 0,
      data: { registrationId: 'reg-1' },
    } as Job<ReservationExpiryJobPayload>;

    await expect(consumer.process(job)).resolves.toEqual({
      status: 'ok',
      registrationId: 'reg-1',
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      select: {
        id: true,
        registrationStatus: true,
        paymentStatus: true,
        reservationExpiresAt: true,
        categoryId: true,
      },
    });
  });

  it('does not throw not-implemented and rejects invalid payloads', async () => {
    const prisma = { registration: { findUnique: jest.fn() } } as unknown as PrismaService;
    const consumer = new ReservationExpiryConsumer(prisma, logger);
    const job = {
      id: 'job-2',
      name: 'expire',
      queueName: QUEUE_NAMES.RESERVATION_EXPIRY,
      attemptsMade: 0,
      data: {},
    } as Job<ReservationExpiryJobPayload>;

    await expect(consumer.process(job)).rejects.toThrow(/registrationId/);
    await expect(consumer.process(job)).rejects.not.toThrow(/not implemented/i);
  });
});
