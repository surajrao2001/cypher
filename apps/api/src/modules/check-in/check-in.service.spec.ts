import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CategoryEntryType, CheckInChannel, RegistrationStatus } from '@prisma/client';
import {
  CheckInService,
  isEarlyCheckInEligible,
  resolveEligibleCompetitorUserIds,
} from './check-in.service';
import { isIdempotencyKeyConflict } from '../progression/progression.service';
import { G1_CHECK_IN_RULES } from '../progression/g1-check-in-rewards';

describe('resolveEligibleCompetitorUserIds', () => {
  it('solo linked participant', () => {
    expect(
      resolveEligibleCompetitorUserIds({
        category: { entryType: CategoryEntryType.solo },
        participants: [{ userId: 'u1' }],
      }),
    ).toEqual(['u1']);
  });

  it('team linked + guest', () => {
    expect(
      resolveEligibleCompetitorUserIds({
        category: { entryType: CategoryEntryType.team },
        participants: [{ userId: 'a' }, { userId: 'b' }, { userId: null }],
      }),
    ).toEqual(['a', 'b']);
  });

  it('dedupes duplicate linked user', () => {
    expect(
      resolveEligibleCompetitorUserIds({
        category: { entryType: CategoryEntryType.team },
        participants: [{ userId: 'a' }, { userId: 'a' }],
      }),
    ).toEqual(['a']);
  });

  it('viewer → none', () => {
    expect(
      resolveEligibleCompetitorUserIds({
        category: { entryType: CategoryEntryType.viewer },
        participants: [{ userId: 'u1' }],
      }),
    ).toEqual([]);
  });
});

describe('isEarlyCheckInEligible', () => {
  const opens = new Date('2026-09-22T03:30:00.000Z');
  const earlyEnd = new Date('2026-09-22T04:30:00.000Z');

  it('exact start → eligible', () => {
    expect(isEarlyCheckInEligible({ checkInOpensAt: opens, earlyCheckInEndsAt: earlyEnd }, opens)).toBe(
      true,
    );
  });

  it('exact end → not eligible', () => {
    expect(
      isEarlyCheckInEligible({ checkInOpensAt: opens, earlyCheckInEndsAt: earlyEnd }, earlyEnd),
    ).toBe(false);
  });

  it('missing windows → not eligible', () => {
    expect(isEarlyCheckInEligible({ checkInOpensAt: null, earlyCheckInEndsAt: earlyEnd }, opens)).toBe(
      false,
    );
    expect(isEarlyCheckInEligible({ checkInOpensAt: opens, earlyCheckInEndsAt: null }, opens)).toBe(
      false,
    );
  });
});

describe('isIdempotencyKeyConflict', () => {
  it('accepts idempotency_key P2002', () => {
    expect(
      isIdempotencyKeyConflict({ code: 'P2002', meta: { target: ['idempotency_key'] } }),
    ).toBe(true);
  });

  it('rejects unrelated P2002', () => {
    expect(isIdempotencyKeyConflict({ code: 'P2002', meta: { target: ['registration_id'] } })).toBe(
      false,
    );
  });
});

describe('CheckInService', () => {
  const EVENT_ID = '11111111-1111-4111-8111-111111111111';
  const ORG_ID = '22222222-2222-4222-8222-222222222222';
  const STAFF_ID = '33333333-3333-4333-8333-333333333333';
  const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const REG_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const CAT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const CHECK_IN_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

  const opens = new Date('2026-09-22T03:30:00.000Z');
  const earlyEnd = new Date('2026-09-22T04:30:00.000Z');
  const checkedInAt = new Date('2026-09-22T03:45:00.000Z');

  const prisma = {
    organizerMember: { findUnique: jest.fn() },
    event: { findFirst: jest.fn() },
    registration: { findFirst: jest.fn(), count: jest.fn() },
    checkIn: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    xpTransaction: { create: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  const tickets = {
    verifyPayload: jest.fn(),
    hashPayload: jest.fn(),
  };

  const eventDay = {
    getEffectiveConfig: jest.fn(),
  };

  const progression = {
    ensureG1CheckInRewards: jest.fn(),
    getEventDayProgression: jest.fn(),
  };

  const service = new CheckInService(
    prisma as never,
    tickets as never,
    eventDay as never,
    progression as never,
  );

  function soloRegistration(overrides: Record<string, unknown> = {}) {
    return {
      id: REG_ID,
      eventId: EVENT_ID,
      userId: USER_A,
      registrationStatus: RegistrationStatus.confirmed,
      registrationCode: 'ABC123',
      entryName: null,
      ticketQrToken: 'hash',
      checkIn: null,
      participants: [
        { userId: USER_A, displayName: 'A', dancerName: 'A', createdAt: new Date() },
      ],
      category: { id: CAT_ID, name: '1v1', entryType: CategoryEntryType.solo },
      ...overrides,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.organizerMember.findUnique.mockResolvedValue({ role: 'editor' });
    prisma.event.findFirst.mockResolvedValue({ id: EVENT_ID, organizerId: ORG_ID });
    tickets.verifyPayload.mockReturnValue(REG_ID);
    tickets.hashPayload.mockReturnValue('hash');
    eventDay.getEffectiveConfig.mockResolvedValue({
      eventId: EVENT_ID,
      timezone: 'Asia/Kolkata',
      checkInOpensAt: opens,
      earlyCheckInEndsAt: earlyEnd,
      checkInClosesAt: new Date('2026-09-22T12:00:00.000Z'),
      opsStatus: 'check_in_open',
      persisted: true,
    });
    progression.getEventDayProgression.mockResolvedValue({
      attendanceXp: 40,
      earlyCheckInXp: 25,
      totalEventDayXp: 65,
    });
    progression.ensureG1CheckInRewards.mockResolvedValue(undefined);

    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        registration: {
          findFirst: jest.fn().mockResolvedValue(soloRegistration()),
        },
        checkIn: {
          create: jest.fn().mockResolvedValue({
            id: CHECK_IN_ID,
            eventId: EVENT_ID,
            registrationId: REG_ID,
            checkedInAt,
            checkedInByUserId: STAFF_ID,
            channel: CheckInChannel.SCAN,
          }),
          findUnique: jest.fn(),
        },
        xpTransaction: { create: jest.fn(), findMany: jest.fn() },
      };
      return fn(tx);
    });
  });

  // A + B
  it('confirmed solo competitor check-in creates CheckIn and awards attendance+early', async () => {
    prisma.registration.findFirst.mockResolvedValue(soloRegistration());

    const dto = await service.create(STAFF_ID, ORG_ID, EVENT_ID, { qrToken: 'cy1.x.y' });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(progression.ensureG1CheckInRewards).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        eventId: EVENT_ID,
        checkInId: CHECK_IN_ID,
        eligibleUserIds: [USER_A],
        earlyEligible: true,
      }),
    );
    expect(dto.progression).toEqual({
      attendanceXp: 40,
      earlyCheckInXp: 25,
      totalEventDayXp: 65,
    });
    expect(dto.checkedInByUserId).toBe(STAFF_ID);
    expect(eventDay.getEffectiveConfig).toHaveBeenCalledWith(EVENT_ID);
  });

  // C — covered by earlyEligible true at opens in unit test of helper

  // D
  it('exact early end → attendance only (no early)', async () => {
    prisma.registration.findFirst.mockResolvedValue(soloRegistration());
    eventDay.getEffectiveConfig.mockResolvedValue({
      checkInOpensAt: opens,
      earlyCheckInEndsAt: earlyEnd,
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        registration: { findFirst: jest.fn().mockResolvedValue(soloRegistration()) },
        checkIn: {
          create: jest.fn().mockResolvedValue({
            id: CHECK_IN_ID,
            eventId: EVENT_ID,
            registrationId: REG_ID,
            checkedInAt: earlyEnd,
            checkedInByUserId: STAFF_ID,
            channel: CheckInChannel.SCAN,
          }),
        },
      };
      return fn(tx);
    });
    progression.getEventDayProgression.mockResolvedValue({
      attendanceXp: 40,
      earlyCheckInXp: 0,
      totalEventDayXp: 40,
    });

    await service.create(STAFF_ID, ORG_ID, EVENT_ID, { qrToken: 't' });
    expect(progression.ensureG1CheckInRewards).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ earlyEligible: false }),
    );
  });

  // E + F
  it('no day config / null windows → attendance only; config not created', async () => {
    eventDay.getEffectiveConfig.mockResolvedValue({
      eventId: EVENT_ID,
      timezone: 'Asia/Kolkata',
      checkInOpensAt: null,
      earlyCheckInEndsAt: null,
      checkInClosesAt: null,
      opsStatus: 'scheduled',
      persisted: false,
    });
    prisma.registration.findFirst.mockResolvedValue(soloRegistration());
    progression.getEventDayProgression.mockResolvedValue({
      attendanceXp: 40,
      earlyCheckInXp: 0,
      totalEventDayXp: 40,
    });

    await service.create(STAFF_ID, ORG_ID, EVENT_ID, { qrToken: 't' });
    expect(progression.ensureG1CheckInRewards).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ earlyEligible: false }),
    );
    // EventDayService.getEffectiveConfig is read-only; never upsert from check-in path
    expect(eventDay.getEffectiveConfig).toHaveBeenCalled();
  });

  // G
  it('viewer check-in succeeds with no XP / no progression field', async () => {
    const viewer = soloRegistration({
      category: { id: CAT_ID, name: 'Audience', entryType: CategoryEntryType.viewer },
    });
    prisma.registration.findFirst.mockResolvedValue(viewer);
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        registration: { findFirst: jest.fn().mockResolvedValue(viewer) },
        checkIn: {
          create: jest.fn().mockResolvedValue({
            id: CHECK_IN_ID,
            eventId: EVENT_ID,
            registrationId: REG_ID,
            checkedInAt,
            checkedInByUserId: STAFF_ID,
            channel: CheckInChannel.CODE,
          }),
        },
      };
      return fn(tx);
    });

    const dto = await service.create(STAFF_ID, ORG_ID, EVENT_ID, { registrationCode: 'ABC123' });
    expect(progression.ensureG1CheckInRewards).not.toHaveBeenCalled();
    expect(dto.progression).toBeUndefined();
  });

  // H
  it('unconfirmed registration rejected with no XP', async () => {
    prisma.registration.findFirst.mockResolvedValue(
      soloRegistration({ registrationStatus: RegistrationStatus.pending_payment }),
    );
    await expect(service.create(STAFF_ID, ORG_ID, EVENT_ID, { qrToken: 't' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(progression.ensureG1CheckInRewards).not.toHaveBeenCalled();
  });

  // I + J
  it('team with two linked + guest awards both linked users only', async () => {
    const team = soloRegistration({
      category: { id: CAT_ID, name: '2v2', entryType: CategoryEntryType.team },
      participants: [
        { userId: USER_A, displayName: 'A', dancerName: 'A' },
        { userId: USER_B, displayName: 'B', dancerName: 'B' },
        { userId: null, displayName: 'Guest', dancerName: null },
      ],
    });
    prisma.registration.findFirst.mockResolvedValue(team);
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        registration: { findFirst: jest.fn().mockResolvedValue(team) },
        checkIn: {
          create: jest.fn().mockResolvedValue({
            id: CHECK_IN_ID,
            eventId: EVENT_ID,
            registrationId: REG_ID,
            checkedInAt,
            checkedInByUserId: STAFF_ID,
            channel: CheckInChannel.SCAN,
          }),
        },
      };
      return fn(tx);
    });

    const dto = await service.create(STAFF_ID, ORG_ID, EVENT_ID, { qrToken: 't' });
    expect(progression.ensureG1CheckInRewards).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eligibleUserIds: [USER_A, USER_B] }),
    );
    // Multi-recipient → omit progression on organizer CheckInDto
    expect(dto.progression).toBeUndefined();
  });

  // L — staff never in eligibleUserIds
  it('checkedInBy staff is not an XP recipient', async () => {
    prisma.registration.findFirst.mockResolvedValue(soloRegistration());
    await service.create(STAFF_ID, ORG_ID, EVENT_ID, { qrToken: 't' });
    const args = progression.ensureG1CheckInRewards.mock.calls[0]![1];
    expect(args.eligibleUserIds).toEqual([USER_A]);
    expect(args.eligibleUserIds).not.toContain(STAFF_ID);
  });

  // P — rescan existing: no XP backfill
  it('rescan existing CheckIn returns it without awarding XP', async () => {
    const existing = {
      id: CHECK_IN_ID,
      eventId: EVENT_ID,
      registrationId: REG_ID,
      checkedInAt,
      checkedInByUserId: STAFF_ID,
      channel: CheckInChannel.SCAN,
    };
    prisma.registration.findFirst.mockResolvedValue(soloRegistration({ checkIn: existing }));
    progression.getEventDayProgression.mockResolvedValue({
      attendanceXp: 0,
      earlyCheckInXp: 0,
      totalEventDayXp: 0,
    });

    const dto = await service.create(STAFF_ID, ORG_ID, EVENT_ID, { qrToken: 't' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(progression.ensureG1CheckInRewards).not.toHaveBeenCalled();
    expect(dto.id).toBe(CHECK_IN_ID);
    expect(dto.progression).toEqual({
      attendanceXp: 0,
      earlyCheckInXp: 0,
      totalEventDayXp: 0,
    });
  });

  // auth
  it('rejects non-member', async () => {
    prisma.organizerMember.findUnique.mockResolvedValue(null);
    await expect(service.create(STAFF_ID, ORG_ID, EVENT_ID, { qrToken: 't' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects wrong organizer/event', async () => {
    prisma.event.findFirst.mockResolvedValue(null);
    await expect(service.create(STAFF_ID, ORG_ID, EVENT_ID, { qrToken: 't' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('does not gate on opsStatus alone', async () => {
    eventDay.getEffectiveConfig.mockResolvedValue({
      checkInOpensAt: null,
      earlyCheckInEndsAt: null,
      opsStatus: 'scheduled',
      persisted: false,
    });
    prisma.registration.findFirst.mockResolvedValue(soloRegistration());
    progression.getEventDayProgression.mockResolvedValue({
      attendanceXp: 40,
      earlyCheckInXp: 0,
      totalEventDayXp: 40,
    });
    await expect(service.create(STAFF_ID, ORG_ID, EVENT_ID, { qrToken: 't' })).resolves.toBeDefined();
  });
});

describe('G1_CHECK_IN_RULES', () => {
  it('matches PRD amounts', () => {
    expect(G1_CHECK_IN_RULES.COMPETITOR_CHECK_IN.amount).toBe(40);
    expect(G1_CHECK_IN_RULES.EARLY_CHECK_IN.amount).toBe(25);
    expect(G1_CHECK_IN_RULES.COMPETITOR_CHECK_IN.ruleVersion).toBe(1);
  });
});
