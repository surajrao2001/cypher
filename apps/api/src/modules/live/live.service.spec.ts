import { NotFoundException } from '@nestjs/common';
import { CategoryEntryType, EventStatus, RegistrationStatus } from '@prisma/client';
import { LIVE_ANNOUNCEMENT_LIMIT, LiveService } from './live.service';

describe('LiveService', () => {
  const EVENT_ID = '11111111-1111-4111-8111-111111111111';
  const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const OTHER_USER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const REG_1 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const REG_2 = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const CAT_1 = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const CAT_2 = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

  const opens = new Date('2026-09-22T03:30:00.000Z');
  const earlyEnd = new Date('2026-09-22T04:30:00.000Z');
  const closes = new Date('2026-09-22T12:30:00.000Z');
  const checkedInAt = new Date('2026-09-22T03:45:00.000Z');

  const prisma = {
    event: { findFirst: jest.fn() },
    registration: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    eventUpdate: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    eventDayConfig: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    checkIn: {
      create: jest.fn(),
      update: jest.fn(),
    },
    xpTransaction: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const eventDay = {
    getEffectiveConfig: jest.fn(),
  };

  const progression = {
    getEventDayProgression: jest.fn(),
    ensureG1CheckInRewards: jest.fn(),
  };

  const service = new LiveService(prisma as never, eventDay as never, progression as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.event.findFirst.mockResolvedValue({ id: EVENT_ID, status: EventStatus.published });
    eventDay.getEffectiveConfig.mockResolvedValue({
      eventId: EVENT_ID,
      timezone: 'Asia/Kolkata',
      checkInOpensAt: null,
      earlyCheckInEndsAt: null,
      checkInClosesAt: null,
      opsStatus: 'scheduled',
      persisted: false,
    });
    prisma.registration.findMany.mockResolvedValue([]);
    prisma.eventUpdate.findMany.mockResolvedValue([]);
    progression.getEventDayProgression.mockResolvedValue({
      attendanceXp: 0,
      earlyCheckInXp: 0,
      totalEventDayXp: 0,
    });
  });

  function assertReadOnly() {
    expect(prisma.eventDayConfig.create).not.toHaveBeenCalled();
    expect(prisma.eventDayConfig.upsert).not.toHaveBeenCalled();
    expect(prisma.eventDayConfig.update).not.toHaveBeenCalled();
    expect(prisma.checkIn.create).not.toHaveBeenCalled();
    expect(prisma.checkIn.update).not.toHaveBeenCalled();
    expect(prisma.xpTransaction.create).not.toHaveBeenCalled();
    expect(prisma.xpTransaction.update).not.toHaveBeenCalled();
    expect(prisma.xpTransaction.delete).not.toHaveBeenCalled();
    expect(prisma.eventUpdate.create).not.toHaveBeenCalled();
    expect(prisma.eventUpdate.update).not.toHaveBeenCalled();
    expect(prisma.registration.create).not.toHaveBeenCalled();
    expect(prisma.registration.update).not.toHaveBeenCalled();
    expect(progression.ensureG1CheckInRewards).not.toHaveBeenCalled();
  }

  // A
  it('no config → effective defaults; no config row created', async () => {
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.ops).toEqual({ status: 'scheduled', timezone: 'Asia/Kolkata' });
    expect(dto.checkIn.opensAt).toBeNull();
    expect(dto.checkIn.earlyEndsAt).toBeNull();
    expect(dto.checkIn.closesAt).toBeNull();
    expect(eventDay.getEffectiveConfig).toHaveBeenCalledWith(EVENT_ID);
    assertReadOnly();
  });

  // B
  it('configured event → correct ops/windows', async () => {
    eventDay.getEffectiveConfig.mockResolvedValue({
      eventId: EVENT_ID,
      timezone: 'Asia/Singapore',
      checkInOpensAt: opens,
      earlyCheckInEndsAt: earlyEnd,
      checkInClosesAt: closes,
      opsStatus: 'check_in_open',
      persisted: true,
    });
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.ops).toEqual({ status: 'check_in_open', timezone: 'Asia/Singapore' });
    expect(dto.checkIn.opensAt).toBe(opens.toISOString());
    expect(dto.checkIn.earlyEndsAt).toBe(earlyEnd.toISOString());
    expect(dto.checkIn.closesAt).toBe(closes.toISOString());
  });

  // C
  it('no registrations → empty entries / false / zero progression', async () => {
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.checkIn.myEntries).toEqual([]);
    expect(dto.checkIn.attendanceVerified).toBe(false);
    expect(dto.checkIn.earlyCheckInEarned).toBe(false);
    expect(dto.progression).toEqual({
      attendanceXp: 0,
      earlyCheckInXp: 0,
      totalEventDayXp: 0,
    });
  });

  // D
  it('one solo registration not checked in', async () => {
    prisma.registration.findMany.mockResolvedValue([
      {
        id: REG_1,
        category: { id: CAT_1, name: '1v1 Hip Hop', entryType: CategoryEntryType.solo },
        checkIn: null,
      },
    ]);
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.checkIn.myEntries).toEqual([
      {
        registrationId: REG_1,
        categoryId: CAT_1,
        categoryName: '1v1 Hip Hop',
        entryType: 'solo',
        checkedIn: false,
        checkedInAt: null,
      },
    ]);
    expect(dto.checkIn.attendanceVerified).toBe(false);
  });

  // E
  it('one solo registration checked in', async () => {
    prisma.registration.findMany.mockResolvedValue([
      {
        id: REG_1,
        category: { id: CAT_1, name: '1v1 Hip Hop', entryType: CategoryEntryType.solo },
        checkIn: { checkedInAt },
      },
    ]);
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.checkIn.myEntries[0]).toMatchObject({
      checkedIn: true,
      checkedInAt: checkedInAt.toISOString(),
    });
    expect(dto.checkIn.attendanceVerified).toBe(true);
  });

  // F
  it('multiple category registrations', async () => {
    prisma.registration.findMany.mockResolvedValue([
      {
        id: REG_1,
        category: { id: CAT_1, name: '1v1 Hip Hop', entryType: CategoryEntryType.solo },
        checkIn: { checkedInAt },
      },
      {
        id: REG_2,
        category: { id: CAT_2, name: '2v2 Open Style', entryType: CategoryEntryType.team },
        checkIn: null,
      },
    ]);
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.checkIn.myEntries).toHaveLength(2);
    expect(dto.checkIn.myEntries.map((e) => e.registrationId)).toEqual([REG_1, REG_2]);
    expect(dto.checkIn.attendanceVerified).toBe(true);
  });

  // G
  it('checked-in team registration containing current user', async () => {
    prisma.registration.findMany.mockResolvedValue([
      {
        id: REG_1,
        category: { id: CAT_1, name: '2v2', entryType: CategoryEntryType.team },
        checkIn: { checkedInAt },
      },
    ]);
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.checkIn.myEntries[0]).toMatchObject({
      entryType: 'team',
      checkedIn: true,
      checkedInAt: checkedInAt.toISOString(),
    });
    expect(dto.checkIn.myEntries[0]).not.toHaveProperty('teammateScanStatus');
    expect(dto.checkIn.attendanceVerified).toBe(true);
  });

  // H
  it('viewer registration included; does not set attendanceVerified', async () => {
    prisma.registration.findMany.mockResolvedValue([
      {
        id: REG_1,
        category: { id: CAT_1, name: 'Audience', entryType: CategoryEntryType.viewer },
        checkIn: { checkedInAt },
      },
    ]);
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.checkIn.myEntries[0]?.entryType).toBe('viewer');
    expect(dto.checkIn.myEntries[0]?.checkedIn).toBe(true);
    expect(dto.checkIn.attendanceVerified).toBe(false);
  });

  // I
  it('attendance reward only → 40/0/40', async () => {
    progression.getEventDayProgression.mockResolvedValue({
      attendanceXp: 40,
      earlyCheckInXp: 0,
      totalEventDayXp: 40,
    });
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.progression).toEqual({
      attendanceXp: 40,
      earlyCheckInXp: 0,
      totalEventDayXp: 40,
    });
    expect(dto.checkIn.earlyCheckInEarned).toBe(false);
  });

  // J
  it('attendance + early → 40/25/65 and earlyCheckInEarned', async () => {
    progression.getEventDayProgression.mockResolvedValue({
      attendanceXp: 40,
      earlyCheckInXp: 25,
      totalEventDayXp: 65,
    });
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.progression.totalEventDayXp).toBe(65);
    expect(dto.checkIn.earlyCheckInEarned).toBe(true);
  });

  // K + pre-G1 (29)
  it('existing CheckIn + zero XP → attendanceVerified true, progression zero', async () => {
    prisma.registration.findMany.mockResolvedValue([
      {
        id: REG_1,
        category: { id: CAT_1, name: '1v1', entryType: CategoryEntryType.solo },
        checkIn: { checkedInAt },
      },
    ]);
    progression.getEventDayProgression.mockResolvedValue({
      attendanceXp: 0,
      earlyCheckInXp: 0,
      totalEventDayXp: 0,
    });
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.checkIn.attendanceVerified).toBe(true);
    expect(dto.progression).toEqual({
      attendanceXp: 0,
      earlyCheckInXp: 0,
      totalEventDayXp: 0,
    });
    expect(dto.checkIn.earlyCheckInEarned).toBe(false);
    assertReadOnly();
  });

  // L — early earned from ledger, not window recalculation
  it('earlyCheckInEarned follows ledger even if windows later edited', async () => {
    eventDay.getEffectiveConfig.mockResolvedValue({
      checkInOpensAt: null,
      earlyCheckInEndsAt: null,
      checkInClosesAt: null,
      timezone: 'Asia/Kolkata',
      opsStatus: 'scheduled',
      persisted: true,
    });
    progression.getEventDayProgression.mockResolvedValue({
      attendanceXp: 40,
      earlyCheckInXp: 25,
      totalEventDayXp: 65,
    });
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.checkIn.earlyEndsAt).toBeNull();
    expect(dto.checkIn.earlyCheckInEarned).toBe(true);
  });

  // M
  it('reversed attendance: CheckIn may remain verified; XP zero from progression service', async () => {
    prisma.registration.findMany.mockResolvedValue([
      {
        id: REG_1,
        category: { id: CAT_1, name: '1v1', entryType: CategoryEntryType.solo },
        checkIn: { checkedInAt },
      },
    ]);
    progression.getEventDayProgression.mockResolvedValue({
      attendanceXp: 0,
      earlyCheckInXp: 0,
      totalEventDayXp: 0,
    });
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.checkIn.attendanceVerified).toBe(true);
    expect(dto.progression.attendanceXp).toBe(0);
  });

  // N
  it('reversed early → earlyCheckInEarned false', async () => {
    progression.getEventDayProgression.mockResolvedValue({
      attendanceXp: 40,
      earlyCheckInXp: 0,
      totalEventDayXp: 40,
    });
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.checkIn.earlyCheckInEarned).toBe(false);
  });

  // Q — query only current user
  it('registration query scoped to authenticated user', async () => {
    await service.getMyEventLive(USER_ID, EVENT_ID);
    const where = prisma.registration.findMany.mock.calls[0]![0].where;
    expect(where.eventId).toBe(EVENT_ID);
    expect(where.registrationStatus).toBe(RegistrationStatus.confirmed);
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { participants: { some: { userId: USER_ID } } },
        { userId: USER_ID, category: { entryType: CategoryEntryType.viewer } },
      ]),
    );
    expect(JSON.stringify(where)).not.toContain(OTHER_USER);
  });

  // announcements limit
  it('announcements take newest LIVE_ANNOUNCEMENT_LIMIT', async () => {
    await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(prisma.eventUpdate.findMany).toHaveBeenCalledWith({
      where: { eventId: EVENT_ID },
      orderBy: { publishedAt: 'desc' },
      take: LIVE_ANNOUNCEMENT_LIMIT,
    });
  });

  it('maps announcements to EventUpdateDto shape', async () => {
    const publishedAt = new Date('2026-09-22T02:00:00.000Z');
    prisma.eventUpdate.findMany.mockResolvedValue([
      {
        id: '88888888-8888-4888-8888-888888888888',
        eventId: EVENT_ID,
        authorUserId: '99999999-9999-4999-8999-999999999999',
        kind: 'SCHEDULE',
        title: 'Doors',
        body: 'Open at 9',
        posterUrl: null,
        publishedAt,
        createdAt: publishedAt,
        updatedAt: publishedAt,
      },
    ]);
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(dto.announcements[0]).toEqual({
      id: '88888888-8888-4888-8888-888888888888',
      eventId: EVENT_ID,
      authorUserId: '99999999-9999-4999-8999-999999999999',
      kind: 'SCHEDULE',
      title: 'Doors',
      body: 'Open at 9',
      posterUrl: null,
      publishedAt: publishedAt.toISOString(),
      createdAt: publishedAt.toISOString(),
      updatedAt: publishedAt.toISOString(),
    });
  });

  // draft / unknown event
  it('404 when event not dancer-visible', async () => {
    prisma.event.findFirst.mockResolvedValue(null);
    await expect(service.getMyEventLive(USER_ID, EVENT_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // R — no other competitors leaked in DTO
  it('response contains only approved EventLiveDto fields', async () => {
    const dto = await service.getMyEventLive(USER_ID, EVENT_ID);
    expect(Object.keys(dto).sort()).toEqual([
      'announcements',
      'checkIn',
      'eventId',
      'ops',
      'progression',
    ]);
    expect(dto).not.toHaveProperty('prelims');
    expect(dto).not.toHaveProperty('bracket');
    expect(dto.progression).not.toHaveProperty('idempotencyKey');
  });
});
