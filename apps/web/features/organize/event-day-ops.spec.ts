import type { CheckInDto, EventDayConfigDto } from '@cypher/contracts';

import {
  buildDayConfigPatch,
  canEditDayConfig,
  canTransitionOps,
  checkInSuccessFeedback,
  checkInWindowGuidance,
  configToWindowForm,
  formatInstantInZone,
  opsActionsForStatus,
  opsStatusLabel,
  reprojectFormTimezone,
  wallClockInZoneToIso,
} from './event-day-ops';

const defaultConfig = (over: Partial<EventDayConfigDto> = {}): EventDayConfigDto => ({
  eventId: 'evt_1',
  timezone: 'Asia/Kolkata',
  checkInOpensAt: null,
  earlyCheckInEndsAt: null,
  checkInClosesAt: null,
  opsStatus: 'scheduled',
  ...over,
});

describe('event-day-ops', () => {
  it('A: effective defaults render as scheduled with null windows', () => {
    const config = defaultConfig();
    expect(opsStatusLabel(config.opsStatus)).toBe('Scheduled');
    expect(config.timezone).toBe('Asia/Kolkata');
    expect(config.checkInOpensAt).toBeNull();
    const form = configToWindowForm(config);
    expect(form.earlyEnabled).toBe(false);
    expect(form.opensDate).toBe('');
  });

  it('C: valid config save includes window ISO fields', () => {
    const baseline = defaultConfig();
    const form = {
      ...configToWindowForm(baseline),
      opensDate: '2026-09-19',
      opensTime: '16:00',
      closesDate: '2026-09-19',
      closesTime: '18:00',
      earlyEnabled: true,
      earlyDate: '2026-09-19',
      earlyTime: '16:30',
    };
    const built = buildDayConfigPatch(form, baseline);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.body.checkInOpensAt).toMatch(/2026-09-19T10:30:00\.000Z/);
    expect(built.body.checkInClosesAt).toMatch(/2026-09-19T12:30:00\.000Z/);
    expect(built.body.earlyCheckInEndsAt).toMatch(/2026-09-19T11:00:00\.000Z/);
  });

  it('D: clearing early cutoff sends null', () => {
    const baseline = defaultConfig({
      checkInOpensAt: '2026-09-19T10:30:00.000Z',
      earlyCheckInEndsAt: '2026-09-19T11:00:00.000Z',
      checkInClosesAt: '2026-09-19T12:30:00.000Z',
    });
    const form = {
      ...configToWindowForm(baseline),
      earlyEnabled: false,
    };
    const built = buildDayConfigPatch(form, baseline);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.body.earlyCheckInEndsAt).toBeNull();
    expect(built.body.checkInOpensAt).toBeUndefined();
    expect(built.body.checkInClosesAt).toBeUndefined();
  });

  it('E: invalid window gets client validation', () => {
    const baseline = defaultConfig();
    const form = {
      ...configToWindowForm(baseline),
      opensDate: '2026-09-19',
      opensTime: '18:00',
      closesDate: '2026-09-19',
      closesTime: '16:00',
    };
    const built = buildDayConfigPatch(form, baseline);
    expect(built.ok).toBe(false);
    if (built.ok) return;
    expect(built.error).toMatch(/open must be before close/i);
  });

  it('G: timezone renders wall clock correctly', () => {
    const { date, time } = formatInstantInZone('2026-09-19T10:30:00.000Z', 'Asia/Kolkata');
    expect(date).toBe('2026-09-19');
    expect(time).toBe('16:00');
  });

  it('H: timezone-only change does not mutate window instants in request', () => {
    const baseline = defaultConfig({
      checkInOpensAt: '2026-09-19T10:30:00.000Z',
      checkInClosesAt: '2026-09-19T12:30:00.000Z',
      earlyCheckInEndsAt: null,
    });
    const form = reprojectFormTimezone(configToWindowForm(baseline), baseline, 'Asia/Singapore');
    expect(form.timezone).toBe('Asia/Singapore');
    const built = buildDayConfigPatch(form, baseline);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.body).toEqual({ timezone: 'Asia/Singapore' });
    expect(built.body.checkInOpensAt).toBeUndefined();
    expect(built.body.checkInClosesAt).toBeUndefined();
  });

  it('I/K/L/M/N: status → action mapping', () => {
    expect(opsActionsForStatus('scheduled').primary?.label).toBe('Open check-in');
    expect(opsActionsForStatus('check_in_open').primary?.label).toBe('Close check-in');
    expect(opsActionsForStatus('check_in_closed').primary?.label).toBe('Start event');
    expect(opsActionsForStatus('check_in_closed').secondary?.label).toBe('Reopen check-in');
    expect(opsActionsForStatus('event_live').primary?.label).toBe('Complete event');
    expect(opsActionsForStatus('completed').primary).toBeNull();
  });

  it('J: editor cannot transition ops; can edit config', () => {
    expect(canTransitionOps('editor')).toBe(false);
    expect(canEditDayConfig('editor')).toBe(true);
    expect(canTransitionOps('owner')).toBe(true);
    expect(canTransitionOps('manager')).toBe(true);
  });

  it('Q: duplicate scan shown as already checked in', () => {
    const dto: CheckInDto = {
      id: 'ci_1',
      eventId: 'evt_1',
      registrationId: 'reg_1',
      checkedInAt: '2026-09-19T11:32:00.000Z',
      checkedInByUserId: 'u_1',
      channel: 'SCAN',
      progression: { attendanceXp: 40, earlyCheckInXp: 25, totalEventDayXp: 65 },
    };
    const fb = checkInSuccessFeedback({
      dto,
      wasAlreadyCheckedIn: true,
      timeZone: 'Asia/Kolkata',
    });
    expect(fb.kind).toBe('already');
    expect(fb.title).toMatch(/already/i);
    expect(fb.detail).toBeTruthy();
  });

  it('R: solo progression shown only when truthfully returned', () => {
    const dto: CheckInDto = {
      id: 'ci_1',
      eventId: 'evt_1',
      registrationId: 'reg_1',
      checkedInAt: '2026-09-19T11:32:00.000Z',
      checkedInByUserId: 'u_1',
      channel: 'SCAN',
      progression: { attendanceXp: 40, earlyCheckInXp: 25, totalEventDayXp: 65 },
    };
    const fb = checkInSuccessFeedback({ dto, wasAlreadyCheckedIn: false });
    expect(fb.title).toMatch(/checked in/i);
    expect(fb.detail).toContain('+40 XP');
    expect(fb.detail).toContain('Early +25 XP');
  });

  it('S/T: team/viewer response without progression does not invent XP', () => {
    const dto: CheckInDto = {
      id: 'ci_1',
      eventId: 'evt_1',
      registrationId: 'reg_1',
      checkedInAt: '2026-09-19T11:32:00.000Z',
      checkedInByUserId: 'u_1',
      channel: 'SCAN',
    };
    const fb = checkInSuccessFeedback({ dto, wasAlreadyCheckedIn: false });
    expect(fb.detail).toBeUndefined();
    expect(fb.title).toMatch(/checked in/i);
  });

  it('presentational early window guidance uses event timezone', () => {
    const config = defaultConfig({
      checkInOpensAt: '2026-09-19T10:30:00.000Z',
      earlyCheckInEndsAt: '2026-09-19T11:00:00.000Z',
      checkInClosesAt: '2026-09-19T12:30:00.000Z',
      opsStatus: 'check_in_open',
    });
    const before = checkInWindowGuidance(config, new Date('2026-09-19T10:00:00.000Z'));
    expect(before).toMatch(/opens at/i);
    const early = checkInWindowGuidance(config, new Date('2026-09-19T10:45:00.000Z'));
    expect(early).toMatch(/Early check-in active/i);
    const open = checkInWindowGuidance(config, new Date('2026-09-19T11:15:00.000Z'));
    expect(open).toBe('Check-in open');
    const ended = checkInWindowGuidance(config, new Date('2026-09-19T13:00:00.000Z'));
    expect(ended).toMatch(/ended/i);
  });

  it('wallClockInZoneToIso round-trips Kolkata afternoon', () => {
    const iso = wallClockInZoneToIso('2026-09-19', '16:00', 'Asia/Kolkata');
    expect(iso).toBe('2026-09-19T10:30:00.000Z');
  });

  it('B: opening Manage Day does not imply a patch body was built', () => {
    // Opening the drawer only calls configToWindowForm — no mutation.
    const config = defaultConfig();
    const form = configToWindowForm(config);
    const built = buildDayConfigPatch(form, config);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(Object.keys(built.body)).toHaveLength(0);
  });
});
