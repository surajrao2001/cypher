jest.mock('@nestjs/bullmq', () => ({
  Processor: () => (target: unknown) => target,
  OnWorkerEvent: () => () => undefined,
  InjectQueue: () => () => undefined,
  WorkerHost: class WorkerHost {},
}));

jest.mock('../prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { Job } from 'bullmq';
import { StructuredLogger } from '../config/logger';
import type { ReservationExpiryJobPayload } from '../jobs/payloads';
import { QUEUE_NAMES } from '../jobs/queue-names';
import type { ReservationExpiryService } from '../reservation-expiry.service';
import { ReservationExpiryConsumer } from './reservation-expiry.consumer';

describe('ReservationExpiryConsumer', () => {
  const logger = new StructuredLogger({
    environment: 'test',
    level: 'error',
    stdout: { write: () => true },
    stderr: { write: () => true },
  });

  const queue = { add: jest.fn().mockResolvedValue(undefined) };

  it('expires a registration job via the expiry service', async () => {
    const expiry = {
      expireOne: jest.fn().mockResolvedValue('expired'),
      sweepDue: jest.fn(),
    } as unknown as ReservationExpiryService;
    const consumer = new ReservationExpiryConsumer(expiry, logger, queue as never);
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
    expect(expiry.expireOne).toHaveBeenCalledWith('reg-1');
  });

  it('runs sweep jobs', async () => {
    const expiry = {
      expireOne: jest.fn(),
      sweepDue: jest.fn().mockResolvedValue({ scanned: 3, expired: 1 }),
    } as unknown as ReservationExpiryService;
    const consumer = new ReservationExpiryConsumer(expiry, logger, queue as never);
    const job = {
      id: 'job-sweep',
      name: 'sweep',
      queueName: QUEUE_NAMES.RESERVATION_EXPIRY,
      attemptsMade: 0,
      data: { mode: 'sweep' },
    } as Job<ReservationExpiryJobPayload>;

    await expect(consumer.process(job)).resolves.toEqual({
      status: 'ok',
      scanned: 3,
      expired: 1,
    });
    expect(expiry.sweepDue).toHaveBeenCalled();
  });

  it('rejects payloads without registrationId', async () => {
    const expiry = {
      expireOne: jest.fn(),
      sweepDue: jest.fn(),
    } as unknown as ReservationExpiryService;
    const consumer = new ReservationExpiryConsumer(expiry, logger, queue as never);
    const job = {
      id: 'job-2',
      name: 'expire',
      queueName: QUEUE_NAMES.RESERVATION_EXPIRY,
      attemptsMade: 0,
      data: {},
    } as Job<ReservationExpiryJobPayload>;

    await expect(consumer.process(job)).rejects.toThrow(/registrationId/);
  });

  it('registers a repeatable sweep on init', async () => {
    const expiry = {
      expireOne: jest.fn(),
      sweepDue: jest.fn(),
    } as unknown as ReservationExpiryService;
    const consumer = new ReservationExpiryConsumer(expiry, logger, queue as never);
    await consumer.onModuleInit();
    expect(queue.add).toHaveBeenCalledWith(
      'sweep',
      { mode: 'sweep' },
      expect.objectContaining({
        jobId: 'reservation-expiry:sweep',
        repeat: { every: 60_000 },
      }),
    );
  });
});
