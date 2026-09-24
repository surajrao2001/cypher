import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventOpsStatus, OrganizerMemberRole } from '@prisma/client';
import { EventDayService } from './event-day.service';
import { canTransitionOpsStatus, EVENT_OPS_TRANSITIONS } from './event-day.transitions';

describe('EventDayService', () => {
  const EVENT_ID = '11111111-1111-4111-8111-111111111111';
  const ORG_ID = '22222222-2222-4222-8222-222222222222';
  const USER_ID = '33333333-3333-4333-8333-333333333333';

  const opens = new Date('2026-09-22T03:30:00.000Z');
  const earlyEnds = new Date('2026-09-22T04:30:00.000Z');
  const closes = new Date('2026-09-22T12:30:00.000Z');

  const prisma = {
    organizerMember: { findUnique: jest.fn() },
    event: { findFirst: jest.fn() },
    eventDayConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    xpTransaction: { count: jest.fn() },
  };

  const service = new EventDayService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.organizerMember.findUnique.mockResolvedValue({ role: OrganizerMemberRole.owner });
    prisma.event.findFirst.mockResolvedValue({ id: EVENT_ID, organizerId: ORG_ID });
    prisma.eventDayConfig.findUnique.mockResolvedValue(null);
    prisma.xpTransaction.count.mockResolvedValue(0);
  });

  function memberAs(role: OrganizerMemberRole) {
    prisma.organizerMember.findUnique.mockResolvedValue({ role });
  }

  function persistedRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'cfg-1',
      eventId: EVENT_ID,
      timezone: 'Asia/Kolkata',
      checkInOpensAt: opens,
      earlyCheckInEndsAt: earlyEnds,
      checkInClosesAt: closes,
      opsStatus: EventOpsStatus.scheduled,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  // A
  it('GET returns persisted config when row exists', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(persistedRow());
    const dto = await service.getDayConfig(USER_ID, ORG_ID, EVENT_ID);
    expect(dto).toEqual({
      eventId: EVENT_ID,
      timezone: 'Asia/Kolkata',
      checkInOpensAt: opens.toISOString(),
      earlyCheckInEndsAt: earlyEnds.toISOString(),
      checkInClosesAt: closes.toISOString(),
      opsStatus: 'scheduled',
    });
    expect(prisma.eventDayConfig.upsert).not.toHaveBeenCalled();
  });

  // B + W
  it('GET returns defaults when missing and does not insert (pre-G1 event)', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(null);
    const dto = await service.getDayConfig(USER_ID, ORG_ID, EVENT_ID);
    expect(dto).toEqual({
      eventId: EVENT_ID,
      timezone: 'Asia/Kolkata',
      checkInOpensAt: null,
      earlyCheckInEndsAt: null,
      checkInClosesAt: null,
      opsStatus: 'scheduled',
    });
    expect(prisma.eventDayConfig.upsert).not.toHaveBeenCalled();
    expect(prisma.eventDayConfig.findUnique).toHaveBeenCalledWith({ where: { eventId: EVENT_ID } });
  });

  // C
  it('PATCH first configuration creates via upsert', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(null);
    prisma.eventDayConfig.upsert.mockResolvedValue(
      persistedRow({
        checkInOpensAt: opens,
        earlyCheckInEndsAt: null,
        checkInClosesAt: closes,
      }),
    );

    const dto = await service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
      checkInOpensAt: opens.toISOString(),
      checkInClosesAt: closes.toISOString(),
    });

    expect(prisma.eventDayConfig.upsert).toHaveBeenCalledTimes(1);
    const args = prisma.eventDayConfig.upsert.mock.calls[0]![0];
    expect(args.create.eventId).toBe(EVENT_ID);
    expect(args.create.checkInOpensAt).toEqual(opens);
    expect(args.create.checkInClosesAt).toEqual(closes);
    expect(args.create.earlyCheckInEndsAt).toBeNull();
    expect(args.create.opsStatus).toBe(EventOpsStatus.scheduled);
    expect(dto.checkInOpensAt).toBe(opens.toISOString());
  });

  // D + E
  it('PATCH updates only supplied fields; omitted stay unchanged', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(persistedRow());
    prisma.eventDayConfig.upsert.mockImplementation(async ({ update }) =>
      persistedRow({
        timezone: update.timezone,
        checkInOpensAt: update.checkInOpensAt,
        earlyCheckInEndsAt: update.earlyCheckInEndsAt,
        checkInClosesAt: update.checkInClosesAt,
        opsStatus: update.opsStatus,
      }),
    );

    await service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
      timezone: 'Asia/Singapore',
    });

    const args = prisma.eventDayConfig.upsert.mock.calls[0]![0];
    expect(args.update.timezone).toBe('Asia/Singapore');
    expect(args.update.checkInOpensAt).toEqual(opens);
    expect(args.update.earlyCheckInEndsAt).toEqual(earlyEnds);
    expect(args.update.checkInClosesAt).toEqual(closes);
  });

  // F
  it('PATCH null clears only that window', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(persistedRow());
    prisma.eventDayConfig.upsert.mockResolvedValue(
      persistedRow({ earlyCheckInEndsAt: null }),
    );

    await service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
      earlyCheckInEndsAt: null,
    });

    const args = prisma.eventDayConfig.upsert.mock.calls[0]![0];
    expect(args.update.earlyCheckInEndsAt).toBeNull();
    expect(args.update.checkInOpensAt).toEqual(opens);
    expect(args.update.checkInClosesAt).toEqual(closes);
  });

  // empty PATCH must not null windows
  it('PATCH empty body preserves existing windows', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(persistedRow());
    prisma.eventDayConfig.upsert.mockResolvedValue(persistedRow());

    await service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {});

    const args = prisma.eventDayConfig.upsert.mock.calls[0]![0];
    expect(args.update.checkInOpensAt).toEqual(opens);
    expect(args.update.earlyCheckInEndsAt).toEqual(earlyEnds);
    expect(args.update.checkInClosesAt).toEqual(closes);
  });

  // G
  it('PATCH accepts valid full window', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(null);
    prisma.eventDayConfig.upsert.mockResolvedValue(persistedRow());
    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
        checkInOpensAt: opens.toISOString(),
        earlyCheckInEndsAt: earlyEnds.toISOString(),
        checkInClosesAt: closes.toISOString(),
      }),
    ).resolves.toBeDefined();
  });

  // H
  it('rejects open == close', async () => {
    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
        checkInOpensAt: opens.toISOString(),
        checkInClosesAt: opens.toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // I
  it('rejects open > close', async () => {
    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
        checkInOpensAt: closes.toISOString(),
        checkInClosesAt: opens.toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // J
  it('rejects earlyEnd == open', async () => {
    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
        checkInOpensAt: opens.toISOString(),
        earlyCheckInEndsAt: opens.toISOString(),
        checkInClosesAt: closes.toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // K
  it('accepts earlyEnd == close', async () => {
    prisma.eventDayConfig.upsert.mockResolvedValue(
      persistedRow({ earlyCheckInEndsAt: closes }),
    );
    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
        checkInOpensAt: opens.toISOString(),
        earlyCheckInEndsAt: closes.toISOString(),
        checkInClosesAt: closes.toISOString(),
      }),
    ).resolves.toBeDefined();
  });

  // L
  it('rejects earlyEnd > close', async () => {
    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
        checkInOpensAt: opens.toISOString(),
        earlyCheckInEndsAt: '2026-09-22T13:00:00.000Z',
        checkInClosesAt: closes.toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // M
  it('rejects earlyEnd without open', async () => {
    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
        earlyCheckInEndsAt: earlyEnds.toISOString(),
        checkInClosesAt: closes.toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // N
  it('rejects earlyEnd without close', async () => {
    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
        checkInOpensAt: opens.toISOString(),
        earlyCheckInEndsAt: earlyEnds.toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // merged validation: closing early against existing earlyEnd
  it('rejects PATCH that breaks merged earlyEnd vs closes relationship', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(persistedRow());
    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
        checkInClosesAt: '2026-09-22T04:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.eventDayConfig.upsert).not.toHaveBeenCalled();
  });

  // O
  it('rejects invalid timezone', async () => {
    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, { timezone: 'IST' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, { timezone: 'India' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, { timezone: 'foo/bar' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // P
  it('timezone-only change keeps existing UTC instants', async () => {
    const instantX = opens;
    prisma.eventDayConfig.findUnique.mockResolvedValue(
      persistedRow({
        timezone: 'Asia/Kolkata',
        checkInOpensAt: instantX,
        earlyCheckInEndsAt: null,
        checkInClosesAt: closes,
      }),
    );
    prisma.eventDayConfig.upsert.mockImplementation(async ({ update }) =>
      persistedRow({
        timezone: update.timezone,
        checkInOpensAt: update.checkInOpensAt,
        earlyCheckInEndsAt: update.earlyCheckInEndsAt,
        checkInClosesAt: update.checkInClosesAt,
      }),
    );

    const dto = await service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
      timezone: 'Asia/Singapore',
    });

    const args = prisma.eventDayConfig.upsert.mock.calls[0]![0];
    expect(args.update.timezone).toBe('Asia/Singapore');
    expect(args.update.checkInOpensAt).toEqual(instantX);
    expect(dto.checkInOpensAt).toBe(instantX.toISOString());
  });

  // Q
  it('rejects unauthorized organizer member', async () => {
    prisma.organizerMember.findUnique.mockResolvedValue(null);
    await expect(service.getDayConfig(USER_ID, ORG_ID, EVENT_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects editor for ops-status; allows editor for PATCH', async () => {
    memberAs(OrganizerMemberRole.editor);
    prisma.eventDayConfig.upsert.mockResolvedValue(persistedRow({ earlyCheckInEndsAt: null }));

    await expect(
      service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, { timezone: 'Asia/Kolkata' }),
    ).resolves.toBeDefined();

    await expect(
      service.setOpsStatus(USER_ID, ORG_ID, EVENT_ID, { opsStatus: 'check_in_open' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // R
  it('rejects wrong organizer/event pairing', async () => {
    prisma.event.findFirst.mockResolvedValue(null);
    await expect(service.getDayConfig(USER_ID, ORG_ID, EVENT_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // S
  it('allows valid ops transition scheduled → check_in_open', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(null);
    prisma.eventDayConfig.upsert.mockResolvedValue(
      persistedRow({
        checkInOpensAt: null,
        earlyCheckInEndsAt: null,
        checkInClosesAt: null,
        opsStatus: EventOpsStatus.check_in_open,
      }),
    );

    const dto = await service.setOpsStatus(USER_ID, ORG_ID, EVENT_ID, {
      opsStatus: 'check_in_open',
    });
    expect(dto.opsStatus).toBe('check_in_open');
    expect(prisma.xpTransaction.count).not.toHaveBeenCalled();
  });

  // T
  it('rejects invalid ops transition scheduled → completed', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(null);
    await expect(
      service.setOpsStatus(USER_ID, ORG_ID, EVENT_ID, { opsStatus: 'completed' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.eventDayConfig.upsert).not.toHaveBeenCalled();
  });

  // U
  it('completed is terminal', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(
      persistedRow({ opsStatus: EventOpsStatus.completed }),
    );
    await expect(
      service.setOpsStatus(USER_ID, ORG_ID, EVENT_ID, { opsStatus: 'event_live' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(EVENT_OPS_TRANSITIONS.completed).toEqual([]);
  });

  it('same ops status is idempotent', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(
      persistedRow({ opsStatus: EventOpsStatus.check_in_open }),
    );
    prisma.eventDayConfig.upsert.mockResolvedValue(
      persistedRow({ opsStatus: EventOpsStatus.check_in_open }),
    );
    await expect(
      service.setOpsStatus(USER_ID, ORG_ID, EVENT_ID, { opsStatus: 'check_in_open' }),
    ).resolves.toBeDefined();
    expect(canTransitionOpsStatus(EventOpsStatus.check_in_open, EventOpsStatus.check_in_open)).toBe(
      true,
    );
  });

  // V — concurrent first PATCH uses upsert (not find→create race)
  it('first PATCH uses upsert for concurrent-safe create', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(null);
    prisma.eventDayConfig.upsert.mockResolvedValue(
      persistedRow({ earlyCheckInEndsAt: null }),
    );
    await service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
      checkInOpensAt: opens.toISOString(),
      checkInClosesAt: closes.toISOString(),
    });
    expect(prisma.eventDayConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId: EVENT_ID },
        create: expect.any(Object),
        update: expect.any(Object),
      }),
    );
  });

  it('ops-status and PATCH do not write XpTransaction', async () => {
    prisma.eventDayConfig.upsert.mockResolvedValue(persistedRow({ earlyCheckInEndsAt: null }));
    await service.patchDayConfig(USER_ID, ORG_ID, EVENT_ID, {
      checkInOpensAt: opens.toISOString(),
      checkInClosesAt: closes.toISOString(),
    });
    await service.setOpsStatus(USER_ID, ORG_ID, EVENT_ID, { opsStatus: 'check_in_open' });
    expect(prisma.xpTransaction).toBeDefined();
    expect(Object.keys(prisma).filter((k) => k.toLowerCase().includes('xp'))).toEqual([
      'xpTransaction',
    ]);
    // service never touches xpTransaction
    expect(prisma.xpTransaction.count).not.toHaveBeenCalled();
  });

  it('getEffectiveConfig is side-effect free', async () => {
    prisma.eventDayConfig.findUnique.mockResolvedValue(null);
    const effective = await service.getEffectiveConfig(EVENT_ID);
    expect(effective.persisted).toBe(false);
    expect(effective.timezone).toBe('Asia/Kolkata');
    expect(prisma.eventDayConfig.upsert).not.toHaveBeenCalled();
  });
});

describe('EVENT_OPS_TRANSITIONS', () => {
  it('encodes the G1 forward path with limited corrections', () => {
    expect(canTransitionOpsStatus(EventOpsStatus.scheduled, EventOpsStatus.check_in_open)).toBe(
      true,
    );
    expect(canTransitionOpsStatus(EventOpsStatus.scheduled, EventOpsStatus.completed)).toBe(false);
    expect(canTransitionOpsStatus(EventOpsStatus.check_in_open, EventOpsStatus.check_in_closed)).toBe(
      true,
    );
    expect(canTransitionOpsStatus(EventOpsStatus.check_in_closed, EventOpsStatus.event_live)).toBe(
      true,
    );
    expect(canTransitionOpsStatus(EventOpsStatus.event_live, EventOpsStatus.completed)).toBe(true);
  });
});
