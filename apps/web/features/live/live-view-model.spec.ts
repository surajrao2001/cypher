import type { EventLiveDto, EventLiveEntryDto, EventUpdateDto } from '@cypher/contracts';

import {
  deriveLivePrimary,
  earlyRewardPresentation,
  entryCheckInLabel,
  entryTypeLabel,
  isLiveCompanionRelevant,
  liveCheckInWindowHint,
  livePrimaryActions,
  progressionPresentation,
  dancerOpsStatusLabel,
} from './live-view-model';

const baseLive = (over: Partial<EventLiveDto> = {}): EventLiveDto => ({
  eventId: over.eventId ?? 'evt_1',
  ops: {
    status: 'scheduled',
    timezone: 'Asia/Kolkata',
    ...over.ops,
  },
  checkIn: {
    opensAt: null,
    earlyEndsAt: null,
    closesAt: null,
    attendanceVerified: false,
    earlyCheckInEarned: false,
    myEntries: [],
    ...over.checkIn,
  },
  progression: {
    attendanceXp: 0,
    earlyCheckInXp: 0,
    totalEventDayXp: 0,
    ...over.progression,
  },
  announcements: over.announcements ?? [],
});

function entry(
  partial: Partial<EventLiveEntryDto> & Pick<EventLiveEntryDto, 'registrationId' | 'categoryName'>,
): EventLiveEntryDto {
  return {
    categoryId: 'cat_1',
    entryType: 'solo',
    checkedIn: false,
    checkedInAt: null,
    ...partial,
  };
}

describe('live-view-model', () => {
  it('A: scheduled + no check-in', () => {
    const live = baseLive({
      ops: { status: 'scheduled', timezone: 'Asia/Kolkata' },
      checkIn: {
        opensAt: '2026-09-19T10:30:00.000Z',
        earlyEndsAt: null,
        closesAt: '2026-09-19T12:30:00.000Z',
        attendanceVerified: false,
        earlyCheckInEarned: false,
        myEntries: [entry({ registrationId: 'r1', categoryName: '1V1' })],
      },
    });
    const primary = deriveLivePrimary(live, new Date('2026-09-19T08:00:00.000Z'));
    expect(primary.kind).toBe('before_open');
    expect(primary.showViewPass).toBe(true);
    expect(livePrimaryActions(primary)).toEqual(['view_pass']);
    expect(livePrimaryActions(primary)).not.toContain('check_in' as never);
  });

  it('B: check-in open + early active', () => {
    const live = baseLive({
      ops: { status: 'check_in_open', timezone: 'Asia/Kolkata' },
      checkIn: {
        opensAt: '2026-09-19T10:30:00.000Z',
        earlyEndsAt: '2026-09-19T11:00:00.000Z',
        closesAt: '2026-09-19T12:30:00.000Z',
        attendanceVerified: false,
        earlyCheckInEarned: false,
        myEntries: [entry({ registrationId: 'r1', categoryName: '1V1' })],
      },
    });
    const now = new Date('2026-09-19T10:45:00.000Z');
    expect(liveCheckInWindowHint(live, now)).toMatch(/Early check-in/i);
    expect(earlyRewardPresentation(live, now).kind).toBe('active');
    const primary = deriveLivePrimary(live, now);
    expect(primary.kind).toBe('open_not_checked_in');
  });

  it('C: check-in open + early already earned', () => {
    const live = baseLive({
      ops: { status: 'check_in_open', timezone: 'Asia/Kolkata' },
      checkIn: {
        opensAt: '2026-09-19T10:30:00.000Z',
        earlyEndsAt: '2026-09-19T11:00:00.000Z',
        closesAt: '2026-09-19T12:30:00.000Z',
        attendanceVerified: true,
        earlyCheckInEarned: true,
        myEntries: [
          entry({
            registrationId: 'r1',
            categoryName: '1V1',
            checkedIn: true,
            checkedInAt: '2026-09-19T10:40:00.000Z',
          }),
        ],
      },
      progression: { attendanceXp: 40, earlyCheckInXp: 25, totalEventDayXp: 65 },
    });
    expect(earlyRewardPresentation(live).kind).toBe('earned');
    expect(progressionPresentation(live)?.total).toBe(65);
  });

  it('D: checked-in attendance only', () => {
    const live = baseLive({
      ops: { status: 'check_in_open', timezone: 'Asia/Kolkata' },
      checkIn: {
        opensAt: '2026-09-19T10:30:00.000Z',
        earlyEndsAt: null,
        closesAt: '2026-09-19T12:30:00.000Z',
        attendanceVerified: true,
        earlyCheckInEarned: false,
        myEntries: [
          entry({
            registrationId: 'r1',
            categoryName: '1V1',
            checkedIn: true,
            checkedInAt: '2026-09-19T11:12:00.000Z',
          }),
        ],
      },
      progression: { attendanceXp: 40, earlyCheckInXp: 0, totalEventDayXp: 40 },
    });
    const primary = deriveLivePrimary(live);
    expect(primary.kind).toBe('checked_in');
    expect(progressionPresentation(live)?.lines).toHaveLength(1);
  });

  it('E: checked-in attendance + early', () => {
    const live = baseLive({
      progression: { attendanceXp: 40, earlyCheckInXp: 25, totalEventDayXp: 65 },
      checkIn: {
        opensAt: null,
        earlyEndsAt: null,
        closesAt: null,
        attendanceVerified: true,
        earlyCheckInEarned: true,
        myEntries: [
          entry({
            registrationId: 'r1',
            categoryName: '1V1',
            checkedIn: true,
            checkedInAt: '2026-09-19T10:40:00.000Z',
          }),
        ],
      },
    });
    const prog = progressionPresentation(live)!;
    expect(prog.total).toBe(65);
    expect(prog.lines.map((l) => l.xp)).toEqual([40, 25]);
  });

  it('F: multiple registrations with mixed check-in', () => {
    const live = baseLive({
      checkIn: {
        opensAt: null,
        earlyEndsAt: null,
        closesAt: null,
        attendanceVerified: true,
        earlyCheckInEarned: false,
        myEntries: [
          entry({
            registrationId: 'r1',
            categoryName: '1V1 HIP HOP',
            checkedIn: true,
            checkedInAt: '2026-09-19T10:42:00.000Z',
          }),
          entry({
            registrationId: 'r2',
            categoryName: '2V2 OPEN',
            entryType: 'team',
            checkedIn: false,
          }),
        ],
      },
      progression: { attendanceXp: 40, earlyCheckInXp: 0, totalEventDayXp: 40 },
    });
    expect(live.checkIn.myEntries[0]!.checkedIn).toBe(true);
    expect(live.checkIn.myEntries[1]!.checkedIn).toBe(false);
    expect(entryCheckInLabel(live.checkIn.myEntries[1]!, 'Asia/Kolkata')).toMatch(/Waiting/i);
    expect(deriveLivePrimary(live).kind).toBe('checked_in');
  });

  it('G: team registration', () => {
    expect(entryTypeLabel('team')).toBe('Team');
    const live = baseLive({
      checkIn: {
        opensAt: null,
        earlyEndsAt: null,
        closesAt: null,
        attendanceVerified: true,
        earlyCheckInEarned: false,
        myEntries: [
          entry({
            registrationId: 'r1',
            categoryName: '2V2',
            entryType: 'team',
            checkedIn: true,
            checkedInAt: '2026-09-19T10:42:00.000Z',
          }),
        ],
      },
      progression: { attendanceXp: 40, earlyCheckInXp: 0, totalEventDayXp: 40 },
    });
    expect(entryCheckInLabel(live.checkIn.myEntries[0]!, 'Asia/Kolkata')).toMatch(/Checked in/i);
  });

  it('H: viewer registration', () => {
    expect(entryTypeLabel('viewer')).toBe('Audience Pass');
    const live = baseLive({
      checkIn: {
        opensAt: null,
        earlyEndsAt: null,
        closesAt: null,
        attendanceVerified: false,
        earlyCheckInEarned: false,
        myEntries: [
          entry({
            registrationId: 'r1',
            categoryName: 'Audience',
            entryType: 'viewer',
            checkedIn: true,
            checkedInAt: '2026-09-19T10:42:00.000Z',
          }),
        ],
      },
      progression: { attendanceXp: 0, earlyCheckInXp: 0, totalEventDayXp: 0 },
    });
    expect(progressionPresentation(live)).toBeNull();
    expect(deriveLivePrimary(live).kind).toBe('checked_in');
  });

  it('I: event live but user not checked in', () => {
    const live = baseLive({
      ops: { status: 'event_live', timezone: 'Asia/Kolkata' },
      checkIn: {
        opensAt: null,
        earlyEndsAt: null,
        closesAt: null,
        attendanceVerified: false,
        earlyCheckInEarned: false,
        myEntries: [entry({ registrationId: 'r1', categoryName: '1V1' })],
      },
    });
    const primary = deriveLivePrimary(live);
    expect(primary.kind).toBe('live_not_checked_in');
    expect(primary.showViewPass).toBe(true);
  });

  it('J: completed event', () => {
    const live = baseLive({
      ops: { status: 'completed', timezone: 'Asia/Kolkata' },
      checkIn: {
        opensAt: null,
        earlyEndsAt: null,
        closesAt: null,
        attendanceVerified: true,
        earlyCheckInEarned: true,
        myEntries: [
          entry({
            registrationId: 'r1',
            categoryName: '1V1',
            checkedIn: true,
            checkedInAt: '2026-09-19T10:42:00.000Z',
          }),
        ],
      },
      progression: { attendanceXp: 40, earlyCheckInXp: 25, totalEventDayXp: 65 },
    });
    expect(deriveLivePrimary(live).kind).toBe('completed');
    expect(dancerOpsStatusLabel('completed')).toBe('Event complete');
  });

  it('K: no registrations', () => {
    const live = baseLive();
    const primary = deriveLivePrimary(live);
    expect(primary.kind).toBe('no_entries');
    expect(primary.showViewEvent).toBe(true);
    expect(primary.showViewPass).toBe(false);
  });

  it('L/O: pre-G1 checked-in + zero XP omits XP block', () => {
    const live = baseLive({
      checkIn: {
        opensAt: null,
        earlyEndsAt: null,
        closesAt: null,
        attendanceVerified: true,
        earlyCheckInEarned: false,
        myEntries: [
          entry({
            registrationId: 'r1',
            categoryName: '1V1',
            checkedIn: true,
            checkedInAt: '2026-09-19T10:42:00.000Z',
          }),
        ],
      },
      progression: { attendanceXp: 0, earlyCheckInXp: 0, totalEventDayXp: 0 },
    });
    expect(progressionPresentation(live)).toBeNull();
    expect(deriveLivePrimary(live).title).toMatch(/in/i);
  });

  it('M/N: announcements empty vs present', () => {
    expect(baseLive().announcements).toHaveLength(0);
    const withUpdates = baseLive({
      announcements: [
        {
          id: 'u1',
          eventId: 'evt_1',
          authorUserId: 'u',
          kind: 'GENERAL',
          title: 'Doors',
          body: 'Gate 2',
          posterUrl: null,
          publishedAt: '2026-09-19T10:08:00.000Z',
          createdAt: '2026-09-19T10:08:00.000Z',
          updatedAt: '2026-09-19T10:08:00.000Z',
        } satisfies EventUpdateDto,
      ],
    });
    expect(withUpdates.announcements).toHaveLength(1);
  });

  it('P: no self-check-in action exists', () => {
    const kinds = [
      'scheduled',
      'check_in_open',
      'event_live',
      'completed',
    ] as const;
    for (const status of kinds) {
      const live = baseLive({
        ops: { status, timezone: 'Asia/Kolkata' },
        checkIn: {
          opensAt: null,
          earlyEndsAt: null,
          closesAt: null,
          attendanceVerified: false,
          earlyCheckInEarned: false,
          myEntries: [entry({ registrationId: 'r1', categoryName: '1V1' })],
        },
      });
      const actions = livePrimaryActions(deriveLivePrimary(live));
      expect(actions.every((a) => a === 'view_pass' || a === 'view_event')).toBe(true);
    }
  });

  it('Q: timezone display uses event timezone', () => {
    const live = baseLive({
      ops: { status: 'scheduled', timezone: 'Asia/Kolkata' },
      checkIn: {
        opensAt: '2026-09-19T10:30:00.000Z',
        earlyEndsAt: null,
        closesAt: null,
        attendanceVerified: false,
        earlyCheckInEarned: false,
        myEntries: [entry({ registrationId: 'r1', categoryName: '1V1' })],
      },
    });
    const hint = liveCheckInWindowHint(live, new Date('2026-09-19T08:00:00.000Z'));
    expect(hint).toMatch(/4:00\s*PM/i);
  });

  it('entry relevance helper is date-based without Live API', () => {
    expect(isLiveCompanionRelevant('2026-09-22T12:00:00.000Z', new Date('2026-09-22T08:00:00.000Z'))).toBe(
      true,
    );
    expect(isLiveCompanionRelevant('2026-10-01T12:00:00.000Z', new Date('2026-09-22T08:00:00.000Z'))).toBe(
      false,
    );
  });
});
