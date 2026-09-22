/**
 * G1 Event-Day real-Postgres integration tests.
 *
 * Requires DATABASE_URL (default localhost:5433/cypher). Creates and deletes
 * isolated fixture rows tagged with slug prefix `g1it-`.
 *
 * Not mocked Prisma — concurrency and uniqueness are verified against Postgres.
 */
import {
  CategoryEntryType,
  EventOpsStatus,
  EventStatus,
  EventType,
  OrganizerMemberRole,
  OrganizerType,
  PrismaClient,
  RegistrationPaymentStatus,
  RegistrationStatus,
  XpRewardScope,
  XpSourceType,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { CheckInService } from '../check-in/check-in.service';
import { EventDayService } from '../event-day/event-day.service';
import { LiveService } from '../live/live.service';
import { ProgressionService } from '../progression/progression.service';
import {
  competitorCheckInIdempotencyKey,
  G1_CHECK_IN_RULES,
} from '../progression/g1-check-in-rewards';
import { TicketsService } from '../tickets/tickets.service';

const PREFIX = 'g1it';
const prisma = new PrismaClient();

function uid(): string {
  return randomUUID();
}

function code(): string {
  return `${PREFIX}-${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

type Fixture = {
  ownerId: string;
  staffId: string;
  dancerId: string;
  dancerBId: string;
  guestName: string;
  organizerId: string;
  organizerBId: string;
  eventId: string;
  eventBId: string;
  soloCatId: string;
  teamCatId: string;
  secondSoloCatId: string;
};

async function seedBase(): Promise<Fixture> {
  const ownerId = uid();
  const staffId = uid();
  const dancerId = uid();
  const dancerBId = uid();
  const organizerId = uid();
  const organizerBId = uid();
  const eventId = uid();
  const eventBId = uid();
  const soloCatId = uid();
  const teamCatId = uid();
  const secondSoloCatId = uid();
  const slug = `${PREFIX}-${code()}`;

  await prisma.user.createMany({
    data: [{ id: ownerId }, { id: staffId }, { id: dancerId }, { id: dancerBId }],
  });

  await prisma.organizer.create({
    data: {
      id: organizerId,
      orgName: `${PREFIX} Org`,
      slug: `${slug}-org`,
      type: OrganizerType.independent,
      createdById: ownerId,
      members: {
        create: [
          { userId: ownerId, role: OrganizerMemberRole.owner },
          { userId: staffId, role: OrganizerMemberRole.editor },
        ],
      },
    },
  });

  await prisma.organizer.create({
    data: {
      id: organizerBId,
      orgName: `${PREFIX} Org B`,
      slug: `${slug}-org-b`,
      type: OrganizerType.independent,
      createdById: ownerId,
      members: {
        create: [{ userId: ownerId, role: OrganizerMemberRole.owner }],
      },
    },
  });

  const start = new Date('2026-09-19T12:00:00.000Z');
  await prisma.event.create({
    data: {
      id: eventId,
      organizerId,
      slug: `${slug}-evt`,
      title: `${PREFIX} Ground Zero`,
      eventType: EventType.battle,
      city: 'Bengaluru',
      venue: 'Warehouse',
      startTime: start,
      status: EventStatus.published,
      categories: {
        create: [
          {
            id: soloCatId,
            name: '1V1 Hip Hop',
            entryType: CategoryEntryType.solo,
            capacity: 64,
            priceMinor: 0,
          },
          {
            id: teamCatId,
            name: '2V2 Open Style',
            entryType: CategoryEntryType.team,
            minTeamSize: 2,
            maxTeamSize: 2,
            capacity: 32,
            priceMinor: 0,
          },
          {
            id: secondSoloCatId,
            name: '1V1 Open',
            entryType: CategoryEntryType.solo,
            capacity: 64,
            priceMinor: 0,
          },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      id: eventBId,
      organizerId: organizerBId,
      slug: `${slug}-evt-b`,
      title: `${PREFIX} Other Org Event`,
      eventType: EventType.battle,
      city: 'Bengaluru',
      startTime: start,
      status: EventStatus.published,
    },
  });

  return {
    ownerId,
    staffId,
    dancerId,
    dancerBId,
    guestName: 'Guest Dancer',
    organizerId,
    organizerBId,
    eventId,
    eventBId,
    soloCatId,
    teamCatId,
    secondSoloCatId,
  };
}

async function cleanupByOrganizer(organizerIds: string[]) {
  const events = await prisma.event.findMany({
    where: { organizerId: { in: organizerIds } },
    select: { id: true },
  });
  const eventIds = events.map((e) => e.id);
  if (eventIds.length > 0) {
    await prisma.xpTransaction.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.checkIn.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.eventUpdate.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.eventDayConfig.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.registrationParticipant.deleteMany({
      where: { registration: { eventId: { in: eventIds } } },
    });
    await prisma.registration.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.eventCategory.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  }
  await prisma.organizerMember.deleteMany({ where: { organizerId: { in: organizerIds } } });
  await prisma.organizer.deleteMany({ where: { id: { in: organizerIds } } });
}

async function createConfirmedRegistration(args: {
  purchaserId: string;
  eventId: string;
  categoryId: string;
  participants: Array<{ userId: string | null; displayName: string }>;
  ticket?: TicketsService;
}) {
  const id = uid();
  const tickets =
    args.ticket ??
    new TicketsService({
      get: () => 'g1-integration-ticket-secret',
    } as never);
  const { payload, hash } = tickets.issueHash(id);
  await prisma.registration.create({
    data: {
      id,
      userId: args.purchaserId,
      eventId: args.eventId,
      categoryId: args.categoryId,
      registrationStatus: RegistrationStatus.confirmed,
      paymentStatus: RegistrationPaymentStatus.not_started,
      totalAmountMinor: 0,
      registrationCode: code(),
      ticketQrToken: hash,
      confirmedAt: new Date(),
      participants: {
        create: args.participants.map((p, i) => ({
          userId: p.userId,
          displayName: p.displayName,
          dancerName: p.displayName,
          isTeamCaptain: i === 0,
        })),
      },
    },
  });
  return { id, qrToken: payload, registrationCode: (await prisma.registration.findUniqueOrThrow({ where: { id } })).registrationCode };
}

function buildServices(progression?: ProgressionService) {
  const tickets = new TicketsService({
    get: () => 'g1-integration-ticket-secret',
  } as never);
  const eventDay = new EventDayService(prisma as never);
  const prog = progression ?? new ProgressionService();
  const checkIn = new CheckInService(prisma as never, tickets, eventDay, prog);
  const live = new LiveService(prisma as never, eventDay, prog);
  return { tickets, eventDay, checkIn, live, progression: prog };
}

describe('G1 real Postgres integration', () => {
  let fx!: Fixture;
  let services: ReturnType<typeof buildServices>;
  let dbReady = false;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbReady = true;
    } catch (err) {
      // Local `pnpm test` without Postgres should skip, not fail the suite.
      console.warn(
        '[g1.integration] Skipping: Postgres unavailable.',
        err instanceof Error ? err.message : err,
      );
    }
  });

  afterAll(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });

  beforeEach(async () => {
    if (!dbReady) {
      pending('Requires Postgres at DATABASE_URL');
      return;
    }
    fx = await seedBase();
    services = buildServices();
  });

  afterEach(async () => {
    if (!dbReady) return;
    await cleanupByOrganizer([fx.organizerId, fx.organizerBId]);
    const userIds = [fx.ownerId, fx.staffId, fx.dancerId, fx.dancerBId];
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  });

  // Note: fx is assigned in beforeEach when dbReady; afterEach no-ops when skipped.

  it('A: simultaneous same-registration check-in → one CheckIn, one attendance XP', async () => {
    const reg = await createConfirmedRegistration({
      purchaserId: fx.dancerId,
      eventId: fx.eventId,
      categoryId: fx.soloCatId,
      participants: [{ userId: fx.dancerId, displayName: 'Dancer A' }],
      ticket: services.tickets,
    });

    const [r1, r2] = await Promise.all([
      services.checkIn.create(fx.staffId, fx.organizerId, fx.eventId, {
        registrationCode: reg.registrationCode,
        channel: 'CODE',
      }),
      services.checkIn.create(fx.ownerId, fx.organizerId, fx.eventId, {
        registrationCode: reg.registrationCode,
        channel: 'CODE',
      }),
    ]);

    expect(r1.registrationId).toBe(reg.id);
    expect(r2.registrationId).toBe(reg.id);
    expect(r1.id).toBe(r2.id);

    const checkIns = await prisma.checkIn.count({ where: { registrationId: reg.id } });
    expect(checkIns).toBe(1);

    const xp = await prisma.xpTransaction.findMany({
      where: {
        eventId: fx.eventId,
        userId: fx.dancerId,
        ruleKey: G1_CHECK_IN_RULES.COMPETITOR_CHECK_IN.ruleKey,
      },
    });
    expect(xp).toHaveLength(1);
    expect(xp[0]!.amount).toBe(40);
  });

  it('B: two registrations same user → two CheckIns, one attendance reward', async () => {
    const r1 = await createConfirmedRegistration({
      purchaserId: fx.dancerId,
      eventId: fx.eventId,
      categoryId: fx.soloCatId,
      participants: [{ userId: fx.dancerId, displayName: 'A' }],
      ticket: services.tickets,
    });
    const r2 = await createConfirmedRegistration({
      purchaserId: fx.dancerId,
      eventId: fx.eventId,
      categoryId: fx.secondSoloCatId,
      participants: [{ userId: fx.dancerId, displayName: 'A' }],
      ticket: services.tickets,
    });

    await Promise.all([
      services.checkIn.create(fx.staffId, fx.organizerId, fx.eventId, {
        registrationCode: r1.registrationCode,
      }),
      services.checkIn.create(fx.staffId, fx.organizerId, fx.eventId, {
        registrationCode: r2.registrationCode,
      }),
    ]);

    expect(await prisma.checkIn.count({ where: { eventId: fx.eventId } })).toBe(2);
    expect(
      await prisma.xpTransaction.count({
        where: {
          eventId: fx.eventId,
          userId: fx.dancerId,
          ruleKey: G1_CHECK_IN_RULES.COMPETITOR_CHECK_IN.ruleKey,
        },
      }),
    ).toBe(1);
  });

  it('C: multi-reg early window → one attendance + one early', async () => {
    await prisma.eventDayConfig.create({
      data: {
        eventId: fx.eventId,
        timezone: 'Asia/Kolkata',
        checkInOpensAt: new Date('2020-01-01T00:00:00.000Z'),
        earlyCheckInEndsAt: new Date('2099-01-01T00:00:00.000Z'),
        checkInClosesAt: new Date('2099-12-31T00:00:00.000Z'),
        opsStatus: EventOpsStatus.check_in_open,
      },
    });

    const r1 = await createConfirmedRegistration({
      purchaserId: fx.dancerId,
      eventId: fx.eventId,
      categoryId: fx.soloCatId,
      participants: [{ userId: fx.dancerId, displayName: 'A' }],
      ticket: services.tickets,
    });
    const r2 = await createConfirmedRegistration({
      purchaserId: fx.dancerId,
      eventId: fx.eventId,
      categoryId: fx.secondSoloCatId,
      participants: [{ userId: fx.dancerId, displayName: 'A' }],
      ticket: services.tickets,
    });

    await services.checkIn.create(fx.staffId, fx.organizerId, fx.eventId, {
      registrationCode: r1.registrationCode,
    });
    await services.checkIn.create(fx.staffId, fx.organizerId, fx.eventId, {
      registrationCode: r2.registrationCode,
    });

    expect(await prisma.checkIn.count({ where: { eventId: fx.eventId } })).toBe(2);
    const rows = await prisma.xpTransaction.findMany({
      where: { eventId: fx.eventId, userId: fx.dancerId },
    });
    expect(rows.filter((r) => r.ruleKey === 'COMPETITOR_CHECK_IN')).toHaveLength(1);
    expect(rows.filter((r) => r.ruleKey === 'EARLY_CHECK_IN')).toHaveLength(1);

    const live = await services.live.getMyEventLive(fx.dancerId, fx.eventId);
    expect(live.checkIn.myEntries).toHaveLength(2);
    expect(live.checkIn.attendanceVerified).toBe(true);
    expect(live.progression).toEqual({
      attendanceXp: 40,
      earlyCheckInXp: 25,
      totalEventDayXp: 65,
    });
  });

  it('D: team with two linked + guest → one CheckIn, XP for linked only', async () => {
    const reg = await createConfirmedRegistration({
      purchaserId: fx.dancerId,
      eventId: fx.eventId,
      categoryId: fx.teamCatId,
      participants: [
        { userId: fx.dancerId, displayName: 'Cap' },
        { userId: fx.dancerBId, displayName: 'Mate' },
        { userId: null, displayName: fx.guestName },
      ],
      ticket: services.tickets,
    });

    await services.checkIn.create(fx.staffId, fx.organizerId, fx.eventId, {
      registrationCode: reg.registrationCode,
    });

    expect(await prisma.checkIn.count({ where: { registrationId: reg.id } })).toBe(1);
    const xp = await prisma.xpTransaction.findMany({ where: { eventId: fx.eventId } });
    expect(xp.map((r) => r.userId).sort()).toEqual([fx.dancerBId, fx.dancerId].sort());
    expect(xp.every((r) => r.ruleKey === 'COMPETITOR_CHECK_IN')).toBe(true);
  });

  it('E: simultaneous identical XP idempotency key → one row', async () => {
    const checkInId = uid();
    // Need a CheckIn row for FK-less sourceId (sourceId is UUID, no FK)
    const key = competitorCheckInIdempotencyKey(fx.eventId, fx.dancerId);
    const prog = new ProgressionService();

    await Promise.all([
      prog.ensureG1CheckInRewards(prisma, {
        eventId: fx.eventId,
        checkInId,
        eligibleUserIds: [fx.dancerId],
        earlyEligible: false,
      }),
      prog.ensureG1CheckInRewards(prisma, {
        eventId: fx.eventId,
        checkInId: uid(),
        eligibleUserIds: [fx.dancerId],
        earlyEligible: false,
      }),
    ]);

    expect(await prisma.xpTransaction.count({ where: { idempotencyKey: key } })).toBe(1);
  });

  it('historical rescan does not backfill XP', async () => {
    const reg = await createConfirmedRegistration({
      purchaserId: fx.dancerId,
      eventId: fx.eventId,
      categoryId: fx.soloCatId,
      participants: [{ userId: fx.dancerId, displayName: 'A' }],
      ticket: services.tickets,
    });

    await prisma.checkIn.create({
      data: {
        eventId: fx.eventId,
        registrationId: reg.id,
        checkedInByUserId: fx.staffId,
        channel: 'MANUAL',
        checkedInAt: new Date('2026-01-01T10:00:00.000Z'),
      },
    });

    const before = await prisma.xpTransaction.count({ where: { eventId: fx.eventId } });
    const dto = await services.checkIn.create(fx.staffId, fx.organizerId, fx.eventId, {
      registrationCode: reg.registrationCode,
    });
    const after = await prisma.xpTransaction.count({ where: { eventId: fx.eventId } });

    expect(dto.registrationId).toBe(reg.id);
    expect(before).toBe(0);
    expect(after).toBe(0);
  });

  it('progression failure rolls back CheckIn (atomicity)', async () => {
    const reg = await createConfirmedRegistration({
      purchaserId: fx.dancerId,
      eventId: fx.eventId,
      categoryId: fx.soloCatId,
      participants: [{ userId: fx.dancerId, displayName: 'A' }],
      ticket: services.tickets,
    });

    const boom = new ProgressionService();
    jest.spyOn(boom, 'ensureG1CheckInRewards').mockRejectedValue(new Error('forced progression fail'));
    const failing = buildServices(boom);

    await expect(
      failing.checkIn.create(fx.staffId, fx.organizerId, fx.eventId, {
        registrationCode: reg.registrationCode,
      }),
    ).rejects.toThrow(/forced progression fail/);

    expect(await prisma.checkIn.count({ where: { registrationId: reg.id } })).toBe(0);
    expect(await prisma.xpTransaction.count({ where: { eventId: fx.eventId } })).toBe(0);
  });

  it('reversal-aware Live: attendance CheckIn remains; XP nets to 0', async () => {
    const reg = await createConfirmedRegistration({
      purchaserId: fx.dancerId,
      eventId: fx.eventId,
      categoryId: fx.soloCatId,
      participants: [{ userId: fx.dancerId, displayName: 'A' }],
      ticket: services.tickets,
    });
    await services.checkIn.create(fx.staffId, fx.organizerId, fx.eventId, {
      registrationCode: reg.registrationCode,
    });

    const earn = await prisma.xpTransaction.findFirstOrThrow({
      where: {
        userId: fx.dancerId,
        eventId: fx.eventId,
        ruleKey: 'COMPETITOR_CHECK_IN',
      },
    });
    await prisma.xpTransaction.create({
      data: {
        userId: fx.dancerId,
        amount: -40,
        ruleKey: 'COMPETITOR_CHECK_IN',
        ruleVersion: 1,
        scope: XpRewardScope.EVENT,
        eventId: fx.eventId,
        sourceType: XpSourceType.check_in,
        sourceId: earn.sourceId,
        idempotencyKey: `REV:${earn.idempotencyKey}`,
        reversalOfId: earn.id,
      },
    });

    const live = await services.live.getMyEventLive(fx.dancerId, fx.eventId);
    expect(live.checkIn.attendanceVerified).toBe(true);
    expect(live.progression.attendanceXp).toBe(0);
    expect(live.progression.totalEventDayXp).toBe(0);
  });

  it('Live GET is read-only (no EventDayConfig insert on historical event)', async () => {
    const reg = await createConfirmedRegistration({
      purchaserId: fx.dancerId,
      eventId: fx.eventId,
      categoryId: fx.soloCatId,
      participants: [{ userId: fx.dancerId, displayName: 'A' }],
      ticket: services.tickets,
    });
    await prisma.checkIn.create({
      data: {
        eventId: fx.eventId,
        registrationId: reg.id,
        checkedInByUserId: fx.staffId,
        channel: 'MANUAL',
      },
    });

    const cfgBefore = await prisma.eventDayConfig.count({ where: { eventId: fx.eventId } });
    const xpBefore = await prisma.xpTransaction.count({ where: { eventId: fx.eventId } });
    const ciBefore = await prisma.checkIn.count({ where: { eventId: fx.eventId } });

    const live = await services.live.getMyEventLive(fx.dancerId, fx.eventId);
    expect(live.ops.status).toBe('scheduled');
    expect(live.ops.timezone).toBe('Asia/Kolkata');
    expect(live.progression.totalEventDayXp).toBe(0);
    expect(live.checkIn.attendanceVerified).toBe(true);

    expect(await prisma.eventDayConfig.count({ where: { eventId: fx.eventId } })).toBe(cfgBefore);
    expect(await prisma.xpTransaction.count({ where: { eventId: fx.eventId } })).toBe(xpBefore);
    expect(await prisma.checkIn.count({ where: { eventId: fx.eventId } })).toBe(ciBefore);
  });

  it('permissions: editor can PATCH, cannot ops; cross-org denied; any member GET', async () => {
    // editor PATCH ok
    await expect(
      services.eventDay.patchDayConfig(fx.staffId, fx.organizerId, fx.eventId, {
        timezone: 'Asia/Kolkata',
        checkInOpensAt: '2026-09-19T10:30:00.000Z',
        checkInClosesAt: '2026-09-19T12:30:00.000Z',
      }),
    ).resolves.toMatchObject({ timezone: 'Asia/Kolkata' });

    // editor ops denied
    await expect(
      services.eventDay.setOpsStatus(fx.staffId, fx.organizerId, fx.eventId, {
        opsStatus: 'check_in_open',
      }),
    ).rejects.toThrow(/permission/i);

    // owner ops ok
    await expect(
      services.eventDay.setOpsStatus(fx.ownerId, fx.organizerId, fx.eventId, {
        opsStatus: 'check_in_open',
      }),
    ).resolves.toMatchObject({ opsStatus: 'check_in_open' });

    // GET allowed for editor
    await expect(
      services.eventDay.getDayConfig(fx.staffId, fx.organizerId, fx.eventId),
    ).resolves.toBeTruthy();

    // cross-org denied
    await expect(
      services.eventDay.getDayConfig(fx.staffId, fx.organizerId, fx.eventBId),
    ).rejects.toThrow();
    await expect(
      services.checkIn.create(fx.staffId, fx.organizerId, fx.eventBId, {
        registrationCode: 'nope',
      }),
    ).rejects.toThrow();
  });

  it('timezone-only PATCH does not mutate window instants', async () => {
    const opens = new Date('2026-09-19T10:30:00.000Z');
    const closes = new Date('2026-09-19T12:30:00.000Z');
    await prisma.eventDayConfig.create({
      data: {
        eventId: fx.eventId,
        timezone: 'Asia/Kolkata',
        checkInOpensAt: opens,
        checkInClosesAt: closes,
        opsStatus: EventOpsStatus.scheduled,
      },
    });

    const patched = await services.eventDay.patchDayConfig(fx.ownerId, fx.organizerId, fx.eventId, {
      timezone: 'Asia/Singapore',
    });
    expect(patched.timezone).toBe('Asia/Singapore');
    expect(new Date(patched.checkInOpensAt!).toISOString()).toBe(opens.toISOString());
    expect(new Date(patched.checkInClosesAt!).toISOString()).toBe(closes.toISOString());
  });

  it('early window boundaries: opens inclusive, earlyEnd exclusive', async () => {
    const opens = new Date('2026-09-19T10:30:00.000Z');
    const earlyEnd = new Date('2026-09-19T11:00:00.000Z');
    await prisma.eventDayConfig.create({
      data: {
        eventId: fx.eventId,
        timezone: 'Asia/Kolkata',
        checkInOpensAt: opens,
        earlyCheckInEndsAt: earlyEnd,
        checkInClosesAt: new Date('2026-09-19T12:30:00.000Z'),
        opsStatus: EventOpsStatus.check_in_open,
      },
    });

    // Boundary helpers (same as CheckInService)
    const { isEarlyCheckInEligible } = await import('../check-in/check-in.service');
    const cfg = await services.eventDay.getEffectiveConfig(fx.eventId);
    expect(isEarlyCheckInEligible(cfg, opens)).toBe(true);
    expect(isEarlyCheckInEligible(cfg, new Date(earlyEnd.getTime() - 1))).toBe(true);
    expect(isEarlyCheckInEligible(cfg, earlyEnd)).toBe(false);
  });

  it('dancer privacy: Live only returns own entries/XP', async () => {
    const mine = await createConfirmedRegistration({
      purchaserId: fx.dancerId,
      eventId: fx.eventId,
      categoryId: fx.soloCatId,
      participants: [{ userId: fx.dancerId, displayName: 'Me' }],
      ticket: services.tickets,
    });
    const theirs = await createConfirmedRegistration({
      purchaserId: fx.dancerBId,
      eventId: fx.eventId,
      categoryId: fx.secondSoloCatId,
      participants: [{ userId: fx.dancerBId, displayName: 'Other' }],
      ticket: services.tickets,
    });
    await services.checkIn.create(fx.staffId, fx.organizerId, fx.eventId, {
      registrationCode: mine.registrationCode,
    });
    await services.checkIn.create(fx.staffId, fx.organizerId, fx.eventId, {
      registrationCode: theirs.registrationCode,
    });

    const live = await services.live.getMyEventLive(fx.dancerId, fx.eventId);
    expect(live.checkIn.myEntries.map((e) => e.registrationId)).toEqual([mine.id]);
    expect(live.progression.attendanceXp).toBe(40);

    const other = await services.live.getMyEventLive(fx.dancerBId, fx.eventId);
    expect(other.checkIn.myEntries.map((e) => e.registrationId)).toEqual([theirs.id]);
  });

  it('full G1 flow: register → QR → check-in → XP → Live', async () => {
    const reg = await createConfirmedRegistration({
      purchaserId: fx.dancerId,
      eventId: fx.eventId,
      categoryId: fx.soloCatId,
      participants: [{ userId: fx.dancerId, displayName: 'Flow' }],
      ticket: services.tickets,
    });

    await prisma.eventDayConfig.create({
      data: {
        eventId: fx.eventId,
        timezone: 'Asia/Kolkata',
        checkInOpensAt: new Date('2020-01-01T00:00:00.000Z'),
        earlyCheckInEndsAt: new Date('2099-01-01T00:00:00.000Z'),
        checkInClosesAt: new Date('2099-12-31T00:00:00.000Z'),
        opsStatus: EventOpsStatus.check_in_open,
      },
    });

    const dto = await services.checkIn.create(fx.staffId, fx.organizerId, fx.eventId, {
      qrToken: reg.qrToken,
      channel: 'SCAN',
    });
    expect(dto.progression?.totalEventDayXp).toBe(65);

    const live = await services.live.getMyEventLive(fx.dancerId, fx.eventId);
    expect(live.checkIn.myEntries[0]?.checkedIn).toBe(true);
    expect(live.checkIn.earlyCheckInEarned).toBe(true);
    expect(live.progression.totalEventDayXp).toBe(65);
  });
});
