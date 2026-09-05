import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus, RegistrationStatus } from '@prisma/client';
import { RegistrationsService } from './registrations.service';

describe('RegistrationsService', () => {
  const profile = {
    id: 'user-1',
    name: 'Suraj',
    dancerName: 'Cypher',
  };

  const category = {
    id: 'cat-1',
    eventId: 'evt-1',
    name: 'Breaking 1v1',
    entryType: 'solo',
    minTeamSize: 1,
    maxTeamSize: 1,
    priceMinor: 0,
    capacity: 2,
    reservedCount: 0,
    confirmedCount: 0,
    event: {
      id: 'evt-1',
      slug: 'andheri',
      title: 'Andheri',
      city: 'Mumbai',
      startTime: new Date('2026-10-01T12:00:00.000Z'),
      status: EventStatus.published,
      registrationOpensAt: null,
      registrationClosesAt: null,
      organizer: { orgName: 'MCB' },
    },
  };

  const prisma = {
    profile: {
      findUniqueOrThrow: jest.fn(),
    },
    eventCategory: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    registration: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    registrationParticipant: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };

  const identity = {
    ensureProfile: jest.fn(),
  };

  const tickets = {
    issueHash: jest.fn((id: string) => ({
      payload: `cy1.${id}.sig`,
      hash: `hash-${id}`,
    })),
    buildPayload: jest.fn((id: string) => `cy1.${id}.sig`),
  };

  const reservationJobs = {
    scheduleExpiry: jest.fn().mockResolvedValue(undefined),
    cancelExpiry: jest.fn().mockResolvedValue(undefined),
  };

  const service = new RegistrationsService(
    prisma as never,
    identity as never,
    tickets as never,
    reservationJobs as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    identity.ensureProfile.mockResolvedValue(profile);
    prisma.profile.findUniqueOrThrow.mockResolvedValue(profile);
    prisma.eventCategory.findUnique.mockResolvedValue(category);
    prisma.registration.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn({
        ...prisma,
        $queryRaw: jest.fn().mockResolvedValue([
          { id: 'cat-1', reserved_count: 0, confirmed_count: 0, capacity: 2 },
        ]),
        registration: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 'reg-1',
            userId: 'user-1',
            eventId: 'evt-1',
            categoryId: 'cat-1',
            entryName: null,
            registrationStatus: RegistrationStatus.pending_payment,
            paymentStatus: 'not_started',
            reservationExpiresAt: new Date('2026-10-01T12:15:00.000Z'),
            totalAmountMinor: 0,
            currency: 'INR',
            registrationCode: 'CY-ABC123',
            confirmedAt: null,
            createdAt: new Date('2026-10-01T12:00:00.000Z'),
            category,
            event: category.event,
            participants: [
              {
                id: 'p1',
                userId: 'user-1',
                displayName: 'Cypher',
                dancerName: 'Cypher',
                isTeamCaptain: true,
              },
            ],
          }),
        },
        registrationParticipant: { findFirst: jest.fn().mockResolvedValue(null) },
        eventCategory: { update: jest.fn().mockResolvedValue({}) },
      } as never),
    );
  });

  it('creates a capacity hold for a published category', async () => {
    const result = await service.createHold('user-1', {
      categoryId: 'cat-1',
      participants: [{ displayName: 'Cypher', userId: 'user-1', isTeamCaptain: true }],
    });
    expect(result.registrationStatus).toBe('pending_payment');
    expect(result.registrationCode).toBe('CY-ABC123');
    expect(result.category.name).toBe('Breaking 1v1');
    expect(reservationJobs.scheduleExpiry).toHaveBeenCalledWith(
      'reg-1',
      expect.any(Date),
    );
  });

  it('rejects wrong participant count', async () => {
    await expect(
      service.createHold('user-1', {
        categoryId: 'cat-1',
        participants: [
          { displayName: 'A' },
          { displayName: 'B' },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404s unknown categories', async () => {
    prisma.eventCategory.findUnique.mockResolvedValue(null);
    await expect(
      service.createHold('user-1', {
        categoryId: 'missing',
        participants: [{ displayName: 'Cypher' }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('conflicts when category is full', async () => {
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn({
        ...prisma,
        $queryRaw: jest.fn().mockResolvedValue([
          { id: 'cat-1', reserved_count: 1, confirmed_count: 1, capacity: 2 },
        ]),
        registration: { findFirst: jest.fn().mockResolvedValue(null) },
        registrationParticipant: { findFirst: jest.fn().mockResolvedValue(null) },
        eventCategory: { update: jest.fn() },
      } as never),
    );

    await expect(
      service.createHold('user-1', {
        categoryId: 'cat-1',
        participants: [{ displayName: 'Cypher', userId: 'user-1' }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('confirms a free pending hold', async () => {
    const pending = {
      id: 'reg-1',
      userId: 'user-1',
      eventId: 'evt-1',
      categoryId: 'cat-1',
      entryName: null,
      registrationStatus: RegistrationStatus.pending_payment,
      paymentStatus: 'not_started',
      reservationExpiresAt: new Date('2026-10-01T12:15:00.000Z'),
      totalAmountMinor: 0,
      currency: 'INR',
      registrationCode: 'CY-ABC123',
      confirmedAt: null,
      createdAt: new Date('2026-10-01T12:00:00.000Z'),
      category,
      event: category.event,
      participants: [
        {
          id: 'p1',
          userId: 'user-1',
          displayName: 'Cypher',
          dancerName: 'Cypher',
          isTeamCaptain: true,
        },
      ],
    };
    const confirmed = {
      ...pending,
      registrationStatus: RegistrationStatus.confirmed,
      reservationExpiresAt: null,
      confirmedAt: new Date('2026-10-01T12:01:00.000Z'),
      ticketQrToken: 'hash-reg-1',
    };

    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn({
        $queryRaw: jest.fn().mockResolvedValue([{ id: 'reg-1' }]),
        registration: {
          findFirst: jest.fn().mockResolvedValue(pending),
          update: jest.fn().mockResolvedValue(confirmed),
        },
        eventCategory: { update: jest.fn().mockResolvedValue({}) },
      } as never),
    );

    const result = await service.confirmFree('user-1', 'reg-1');
    expect(result.registrationStatus).toBe('confirmed');
    expect(result.confirmedAt).toBeTruthy();
    expect(result.ticketQrPayload).toBe('cy1.reg-1.sig');
    expect(tickets.issueHash).toHaveBeenCalledWith('reg-1');
    expect(reservationJobs.cancelExpiry).toHaveBeenCalledWith('reg-1');
  });

  it('rejects free confirm for paid holds', async () => {
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn({
        $queryRaw: jest.fn().mockResolvedValue([{ id: 'reg-1' }]),
        registration: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'reg-1',
            registrationStatus: RegistrationStatus.pending_payment,
            totalAmountMinor: 49900,
            category,
            event: category.event,
            participants: [],
          }),
        },
      } as never),
    );

    await expect(service.confirmFree('user-1', 'reg-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
