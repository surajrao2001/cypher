import {
  assertEventDayWindows,
  checkInDtoSchema,
  eventDayConfigDtoSchema,
  eventDayProgressionDtoSchema,
  eventLiveDtoSchema,
  ianaTimezoneSchema,
  isoDateTimeStringSchema,
  patchEventDayConfigBodySchema,
  setEventOpsStatusBodySchema,
} from './event-day';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const REG_A = '33333333-3333-4333-8333-333333333333';
const REG_B = '44444444-4444-4444-8444-444444444444';
const CAT_A = '55555555-5555-4555-8555-555555555555';
const CAT_B = '66666666-6666-4666-8666-666666666666';
const CHECK_IN_ID = '77777777-7777-4777-8777-777777777777';
const UPDATE_ID = '88888888-8888-4888-8888-888888888888';

const opens = '2026-09-22T03:30:00.000Z';
const earlyEnds = '2026-09-22T04:30:00.000Z';
const closes = '2026-09-22T12:30:00.000Z';

describe('G1 event-day contracts', () => {
  // A
  it('accepts a valid EventDayConfigDto', () => {
    const parsed = eventDayConfigDtoSchema.safeParse({
      eventId: EVENT_ID,
      timezone: 'Asia/Kolkata',
      checkInOpensAt: opens,
      earlyCheckInEndsAt: earlyEnds,
      checkInClosesAt: closes,
      opsStatus: 'check_in_open',
    });
    expect(parsed.success).toBe(true);
  });

  // B
  it('accepts EventDayConfigDto with all windows null', () => {
    const parsed = eventDayConfigDtoSchema.safeParse({
      eventId: EVENT_ID,
      timezone: 'Asia/Kolkata',
      checkInOpensAt: null,
      earlyCheckInEndsAt: null,
      checkInClosesAt: null,
      opsStatus: 'scheduled',
    });
    expect(parsed.success).toBe(true);
  });

  // C
  it('accepts PATCH with one field', () => {
    const parsed = patchEventDayConfigBodySchema.safeParse({
      timezone: 'Asia/Kolkata',
    });
    expect(parsed.success).toBe(true);
  });

  // D
  it('accepts PATCH clear earlyCheckInEndsAt = null', () => {
    const parsed = patchEventDayConfigBodySchema.safeParse({
      earlyCheckInEndsAt: null,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(Object.prototype.hasOwnProperty.call(parsed.data, 'earlyCheckInEndsAt')).toBe(true);
      expect(parsed.data.earlyCheckInEndsAt).toBeNull();
      expect(Object.prototype.hasOwnProperty.call(parsed.data, 'checkInOpensAt')).toBe(false);
    }
  });

  // E
  it('rejects invalid ops status', () => {
    expect(setEventOpsStatusBodySchema.safeParse({ opsStatus: 'prelims' }).success).toBe(false);
    expect(setEventOpsStatusBodySchema.safeParse({ opsStatus: 'published' }).success).toBe(false);
  });

  // F
  it('accepts Live response with no registrations', () => {
    const parsed = eventLiveDtoSchema.safeParse({
      eventId: EVENT_ID,
      ops: { status: 'scheduled', timezone: 'Asia/Kolkata' },
      checkIn: {
        opensAt: null,
        earlyEndsAt: null,
        closesAt: null,
        attendanceVerified: false,
        earlyCheckInEarned: false,
        myEntries: [],
      },
      progression: { attendanceXp: 0, earlyCheckInXp: 0, totalEventDayXp: 0 },
      announcements: [],
    });
    expect(parsed.success).toBe(true);
  });

  // G
  it('accepts Live with one competitor registration', () => {
    const parsed = eventLiveDtoSchema.safeParse({
      eventId: EVENT_ID,
      ops: { status: 'check_in_open', timezone: 'Asia/Kolkata' },
      checkIn: {
        opensAt: opens,
        earlyEndsAt: earlyEnds,
        closesAt: closes,
        attendanceVerified: false,
        earlyCheckInEarned: false,
        myEntries: [
          {
            registrationId: REG_A,
            categoryId: CAT_A,
            categoryName: '1v1 Hip Hop',
            entryType: 'solo',
            checkedIn: false,
            checkedInAt: null,
          },
        ],
      },
      progression: { attendanceXp: 0, earlyCheckInXp: 0, totalEventDayXp: 0 },
      announcements: [],
    });
    expect(parsed.success).toBe(true);
  });

  // H
  it('accepts Live with multiple category registrations', () => {
    const parsed = eventLiveDtoSchema.safeParse({
      eventId: EVENT_ID,
      ops: { status: 'event_live', timezone: 'Asia/Kolkata' },
      checkIn: {
        opensAt: opens,
        earlyEndsAt: earlyEnds,
        closesAt: closes,
        attendanceVerified: true,
        earlyCheckInEarned: false,
        myEntries: [
          {
            registrationId: REG_A,
            categoryId: CAT_A,
            categoryName: '1v1 Hip Hop',
            entryType: 'solo',
            checkedIn: true,
            checkedInAt: '2026-09-22T05:00:00.000Z',
          },
          {
            registrationId: REG_B,
            categoryId: CAT_B,
            categoryName: '2v2 Open Style',
            entryType: 'team',
            checkedIn: false,
            checkedInAt: null,
          },
        ],
      },
      progression: { attendanceXp: 40, earlyCheckInXp: 0, totalEventDayXp: 40 },
      announcements: [],
    });
    expect(parsed.success).toBe(true);
  });

  // I
  it('represents checked-in team registration at registration level only', () => {
    const parsed = eventLiveDtoSchema.safeParse({
      eventId: EVENT_ID,
      ops: { status: 'check_in_open', timezone: 'Asia/Kolkata' },
      checkIn: {
        opensAt: opens,
        earlyEndsAt: null,
        closesAt: closes,
        attendanceVerified: true,
        earlyCheckInEarned: false,
        myEntries: [
          {
            registrationId: REG_A,
            categoryId: CAT_A,
            categoryName: '2v2 Open Style',
            entryType: 'team',
            checkedIn: true,
            checkedInAt: '2026-09-22T05:15:00.000Z',
          },
        ],
      },
      progression: { attendanceXp: 40, earlyCheckInXp: 0, totalEventDayXp: 40 },
      announcements: [],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const entry = parsed.data.checkIn.myEntries[0]!;
      expect(entry.entryType).toBe('team');
      expect(entry.checkedIn).toBe(true);
      expect(entry).not.toHaveProperty('participantCheckedIn');
      expect(entry).not.toHaveProperty('teammateScanStatus');
    }
  });

  // J
  it('accepts progression summary with attendance only', () => {
    const parsed = eventDayProgressionDtoSchema.safeParse({
      attendanceXp: 40,
      earlyCheckInXp: 0,
      totalEventDayXp: 40,
    });
    expect(parsed.success).toBe(true);
  });

  // K
  it('accepts progression summary with attendance + early reward', () => {
    const parsed = eventDayProgressionDtoSchema.safeParse({
      attendanceXp: 40,
      earlyCheckInXp: 20,
      totalEventDayXp: 60,
    });
    expect(parsed.success).toBe(true);
  });

  // L
  it('models idempotent authoritative progression on CheckInDto without award-again flags', () => {
    const base = {
      id: CHECK_IN_ID,
      eventId: EVENT_ID,
      registrationId: REG_A,
      checkedInAt: '2026-09-22T05:00:00.000Z',
      checkedInByUserId: USER_ID,
      channel: 'SCAN' as const,
      progression: {
        attendanceXp: 40,
        earlyCheckInXp: 20,
        totalEventDayXp: 60,
      },
    };
    const first = checkInDtoSchema.safeParse(base);
    const repeat = checkInDtoSchema.safeParse(base);
    expect(first.success).toBe(true);
    expect(repeat.success).toBe(true);
    if (first.success && repeat.success) {
      expect(repeat.data.progression).toEqual(first.data.progression);
      expect(repeat.data).not.toHaveProperty('xpAwarded');
      expect(repeat.data).not.toHaveProperty('newlyAwarded');
    }
  });

  // M
  it('rejects malformed timestamps', () => {
    expect(isoDateTimeStringSchema.safeParse('2026-09-22 10:00').success).toBe(false);
    expect(
      patchEventDayConfigBodySchema.safeParse({ checkInOpensAt: '2026-09-22 10:00' }).success,
    ).toBe(false);
    expect(
      eventDayConfigDtoSchema.safeParse({
        eventId: EVENT_ID,
        timezone: 'Asia/Kolkata',
        checkInOpensAt: 'not-a-date',
        earlyCheckInEndsAt: null,
        checkInClosesAt: null,
        opsStatus: 'scheduled',
      }).success,
    ).toBe(false);
  });

  // N
  it('rejects invalid timezone basic shape and non-IANA values', () => {
    expect(ianaTimezoneSchema.safeParse('Asia/Kolkata').success).toBe(true);
    expect(ianaTimezoneSchema.safeParse('UTC').success).toBe(true);
    expect(ianaTimezoneSchema.safeParse('').success).toBe(false);
    expect(ianaTimezoneSchema.safeParse('Asia Kolkata').success).toBe(false);
    expect(ianaTimezoneSchema.safeParse('!!!').success).toBe(false);
    expect(ianaTimezoneSchema.safeParse('IST').success).toBe(false);
    expect(ianaTimezoneSchema.safeParse('India').success).toBe(false);
    expect(ianaTimezoneSchema.safeParse('Bangalore').success).toBe(false);
    expect(ianaTimezoneSchema.safeParse('foo/bar').success).toBe(false);
  });

  it('rejects earlyEnd without open/close on merged assert', () => {
    expect(() =>
      assertEventDayWindows({
        checkInOpensAt: null,
        earlyCheckInEndsAt: earlyEnds,
        checkInClosesAt: closes,
      }),
    ).toThrow(/requires check-in opening/);

    expect(() =>
      assertEventDayWindows({
        checkInOpensAt: opens,
        earlyCheckInEndsAt: earlyEnds,
        checkInClosesAt: null,
      }),
    ).toThrow(/requires check-in closing/);
  });

  it('accepts earlyEnd equal to close; rejects earlyEnd equal to open', () => {
    expect(() =>
      assertEventDayWindows({
        checkInOpensAt: opens,
        earlyCheckInEndsAt: closes,
        checkInClosesAt: closes,
      }),
    ).not.toThrow();

    expect(() =>
      assertEventDayWindows({
        checkInOpensAt: opens,
        earlyCheckInEndsAt: opens,
        checkInClosesAt: closes,
      }),
    ).toThrow(/after check-in opens/);
  });

  it('rejects PATCH window relationships that conflict in the same payload', () => {
    expect(
      patchEventDayConfigBodySchema.safeParse({
        checkInOpensAt: closes,
        checkInClosesAt: opens,
      }).success,
    ).toBe(false);
  });

  it('assertEventDayWindows enforces early bounds on merged config', () => {
    expect(() =>
      assertEventDayWindows({
        checkInOpensAt: opens,
        earlyCheckInEndsAt: earlyEnds,
        checkInClosesAt: closes,
      }),
    ).not.toThrow();

    expect(() =>
      assertEventDayWindows({
        checkInOpensAt: opens,
        earlyCheckInEndsAt: '2026-09-22T01:00:00.000Z',
        checkInClosesAt: closes,
      }),
    ).toThrow(/after check-in opens/);
  });

  it('accepts Live announcements as EventUpdateDto shape', () => {
    const parsed = eventLiveDtoSchema.safeParse({
      eventId: EVENT_ID,
      ops: { status: 'event_live', timezone: 'Asia/Kolkata' },
      checkIn: {
        opensAt: null,
        earlyEndsAt: null,
        closesAt: null,
        attendanceVerified: false,
        earlyCheckInEarned: false,
        myEntries: [],
      },
      progression: { attendanceXp: 0, earlyCheckInXp: 0, totalEventDayXp: 0 },
      announcements: [
        {
          id: UPDATE_ID,
          eventId: EVENT_ID,
          authorUserId: USER_ID,
          kind: 'SCHEDULE',
          title: 'Doors',
          body: 'Check-in opens at 9',
          posterUrl: null,
          publishedAt: '2026-09-22T02:00:00.000Z',
          createdAt: '2026-09-22T02:00:00.000Z',
          updatedAt: '2026-09-22T02:00:00.000Z',
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });
});
