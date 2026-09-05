import { RegistrationStatus } from '@prisma/client';
import { ReservationExpiryService } from './reservation-expiry.service';
import type { PrismaService } from './prisma.service';

describe('ReservationExpiryService', () => {
  const now = new Date('2026-09-05T12:00:00.000Z');

  it('expires a due pending hold and releases reserved capacity', async () => {
    const update = jest.fn().mockResolvedValue({});
    const executeRaw = jest.fn().mockResolvedValue(1);
    const findUnique = jest.fn().mockResolvedValue({
      id: 'reg-1',
      categoryId: 'cat-1',
      registrationStatus: RegistrationStatus.pending_payment,
      reservationExpiresAt: new Date('2026-09-05T11:59:00.000Z'),
    });
    const prisma = {
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
        fn({
          $queryRaw: jest.fn().mockResolvedValue([{ id: 'reg-1' }]),
          $executeRaw: executeRaw,
          registration: { findUnique, update },
        }),
      ),
    } as unknown as PrismaService;

    const service = new ReservationExpiryService(prisma);
    await expect(service.expireOne('reg-1', now)).resolves.toBe('expired');
    expect(update).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      data: {
        registrationStatus: RegistrationStatus.expired,
        reservationExpiresAt: null,
      },
    });
    expect(executeRaw).toHaveBeenCalled();
  });

  it('skips when registration is already confirmed', async () => {
    const update = jest.fn();
    const prisma = {
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
        fn({
          $queryRaw: jest.fn().mockResolvedValue([{ id: 'reg-1' }]),
          $executeRaw: jest.fn(),
          registration: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'reg-1',
              categoryId: 'cat-1',
              registrationStatus: RegistrationStatus.confirmed,
              reservationExpiresAt: null,
            }),
            update,
          },
        }),
      ),
    } as unknown as PrismaService;

    const service = new ReservationExpiryService(prisma);
    await expect(service.expireOne('reg-1', now)).resolves.toBe('skipped');
    expect(update).not.toHaveBeenCalled();
  });

  it('skips when hold is not due yet', async () => {
    const update = jest.fn();
    const prisma = {
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
        fn({
          $queryRaw: jest.fn().mockResolvedValue([{ id: 'reg-1' }]),
          $executeRaw: jest.fn(),
          registration: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'reg-1',
              categoryId: 'cat-1',
              registrationStatus: RegistrationStatus.pending_payment,
              reservationExpiresAt: new Date('2026-09-05T12:10:00.000Z'),
            }),
            update,
          },
        }),
      ),
    } as unknown as PrismaService;

    const service = new ReservationExpiryService(prisma);
    await expect(service.expireOne('reg-1', now)).resolves.toBe('skipped');
    expect(update).not.toHaveBeenCalled();
  });

  it('sweeps due holds', async () => {
    const prisma = {
      registration: {
        findMany: jest.fn().mockResolvedValue([{ id: 'reg-1' }, { id: 'reg-2' }]),
      },
      $transaction: jest
        .fn()
        .mockResolvedValueOnce('expired')
        .mockResolvedValueOnce('skipped'),
    } as unknown as PrismaService;

    const service = new ReservationExpiryService(prisma);
    const expireOne = jest
      .spyOn(service, 'expireOne')
      .mockResolvedValueOnce('expired')
      .mockResolvedValueOnce('skipped');

    await expect(service.sweepDue(now)).resolves.toEqual({ scanned: 2, expired: 1 });
    expect(expireOne).toHaveBeenCalledTimes(2);
  });
});
