import { QUEUE_NAMES, reservationExpiryJobId } from './queue-names';
import { ReservationJobsService } from './reservation-jobs.service';

describe('ReservationJobsService', () => {
  it('schedules a delayed expire job with stable id', async () => {
    const add = jest.fn().mockResolvedValue({});
    const service = new ReservationJobsService({ add, remove: jest.fn() } as never);
    const expiresAt = new Date(Date.now() + 60_000);

    await service.scheduleExpiry('reg-1', expiresAt);

    expect(add).toHaveBeenCalledWith(
      'expire',
      { mode: 'expire', registrationId: 'reg-1' },
      expect.objectContaining({
        jobId: reservationExpiryJobId('reg-1'),
        delay: expect.any(Number),
      }),
    );
    expect(QUEUE_NAMES.RESERVATION_EXPIRY).toBe('reservation-expiry');
  });

  it('swallows schedule failures', async () => {
    const service = new ReservationJobsService({
      add: jest.fn().mockRejectedValue(new Error('redis down')),
      remove: jest.fn(),
    } as never);
    await expect(service.scheduleExpiry('reg-1', new Date())).resolves.toBeUndefined();
  });

  it('cancels a scheduled expire job', async () => {
    const remove = jest.fn().mockResolvedValue(1);
    const service = new ReservationJobsService({ add: jest.fn(), remove } as never);
    await service.cancelExpiry('reg-1');
    expect(remove).toHaveBeenCalledWith('expire:reg-1');
  });
});
