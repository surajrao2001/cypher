import type {
  CheckInDto,
  EventDayConfigDto,
  EventOpsStatus,
  OrganizerMemberRole,
  PatchEventDayConfigBody,
} from '@cypher/contracts';
import { assertEventDayWindows } from '@cypher/validation';

/** Mirrors backend EVENT_OPS_TRANSITIONS (string form for web). */
export const EVENT_OPS_TRANSITIONS: Record<EventOpsStatus, readonly EventOpsStatus[]> = {
  scheduled: ['check_in_open'],
  check_in_open: ['check_in_closed', 'scheduled'],
  check_in_closed: ['event_live', 'check_in_open'],
  event_live: ['completed', 'check_in_closed'],
  completed: [],
};

export function opsStatusLabel(status: EventOpsStatus): string {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'check_in_open':
      return 'Check-in open';
    case 'check_in_closed':
      return 'Check-in closed';
    case 'event_live':
      return 'Event live';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
}

export function canEditDayConfig(role: OrganizerMemberRole): boolean {
  return role === 'owner' || role === 'manager' || role === 'editor';
}

export function canTransitionOps(role: OrganizerMemberRole): boolean {
  return role === 'owner' || role === 'manager';
}

export type OpsPrimaryAction = {
  kind: 'transition';
  to: EventOpsStatus;
  label: string;
};

export type OpsSecondaryAction = OpsPrimaryAction;

/** Primary + optional secondary actions allowed by backend map (role-gated separately). */
export function opsActionsForStatus(status: EventOpsStatus): {
  primary: OpsPrimaryAction | null;
  secondary: OpsSecondaryAction | null;
} {
  switch (status) {
    case 'scheduled':
      return {
        primary: { kind: 'transition', to: 'check_in_open', label: 'Open check-in' },
        secondary: null,
      };
    case 'check_in_open':
      return {
        primary: { kind: 'transition', to: 'check_in_closed', label: 'Close check-in' },
        secondary: null,
      };
    case 'check_in_closed':
      return {
        primary: { kind: 'transition', to: 'event_live', label: 'Start event' },
        secondary: { kind: 'transition', to: 'check_in_open', label: 'Reopen check-in' },
      };
    case 'event_live':
      return {
        primary: { kind: 'transition', to: 'completed', label: 'Complete event' },
        secondary: { kind: 'transition', to: 'check_in_closed', label: 'Back to check-in closed' },
      };
    case 'completed':
      return { primary: null, secondary: null };
    default:
      return { primary: null, secondary: null };
  }
}

/** Prefer Check In link as the lead CTA while doors/ops still need scanning. */
export function preferCheckInLink(status: EventOpsStatus): boolean {
  return status === 'check_in_open' || status === 'event_live';
}

export function formatInstantInZone(
  iso: string | null | undefined,
  timeZone: string,
): { date: string; time: string; display: string; timeDisplay: string } {
  if (!iso) return { date: '', time: '', display: '', timeDisplay: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '', time: '', display: '', timeDisplay: '' };

  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (type: string) => dateParts.find((p) => p.type === type)?.value ?? '';
  const date = `${get('year')}-${get('month')}-${get('day')}`;

  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const hour = timeParts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = timeParts.find((p) => p.type === 'minute')?.value ?? '00';
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  const display = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);

  const timeDisplay = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);

  return { date, time, display, timeDisplay };
}

/** Convert event-local wall clock to UTC ISO. Does not invent values for empty date. */
export function wallClockInZoneToIso(date: string, time: string, timeZone: string): string {
  if (!date.trim()) throw new Error('Date is required');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '00:00').split(':').map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) {
    throw new Error('Invalid date/time');
  }

  const utcGuess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(utcGuess)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const offset = asUtc - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offset).toISOString();
}

export type WindowFormState = {
  opensDate: string;
  opensTime: string;
  closesDate: string;
  closesTime: string;
  earlyDate: string;
  earlyTime: string;
  earlyEnabled: boolean;
  timezone: string;
};

export function configToWindowForm(config: EventDayConfigDto): WindowFormState {
  const opens = formatInstantInZone(config.checkInOpensAt, config.timezone);
  const closes = formatInstantInZone(config.checkInClosesAt, config.timezone);
  const early = formatInstantInZone(config.earlyCheckInEndsAt, config.timezone);
  return {
    timezone: config.timezone,
    opensDate: opens.date,
    opensTime: opens.time || '16:00',
    closesDate: closes.date,
    closesTime: closes.time || '18:00',
    earlyDate: early.date,
    earlyTime: early.time || '16:30',
    earlyEnabled: Boolean(config.earlyCheckInEndsAt),
  };
}

/** Re-project authoritative instants into a newly selected timezone (display only). */
export function reprojectFormTimezone(
  form: WindowFormState,
  baseline: EventDayConfigDto,
  nextTimezone: string,
): WindowFormState {
  const opens = formatInstantInZone(baseline.checkInOpensAt, nextTimezone);
  const closes = formatInstantInZone(baseline.checkInClosesAt, nextTimezone);
  const early = formatInstantInZone(baseline.earlyCheckInEndsAt, nextTimezone);
  return {
    ...form,
    timezone: nextTimezone,
    opensDate: opens.date || form.opensDate,
    opensTime: opens.time || form.opensTime,
    closesDate: closes.date || form.closesDate,
    closesTime: closes.time || form.closesTime,
    earlyDate: early.date || form.earlyDate,
    earlyTime: early.time || form.earlyTime,
    earlyEnabled: Boolean(baseline.earlyCheckInEndsAt),
  };
}

/**
 * Build PATCH body from form vs baseline config.
 * Timezone-only change does not include window fields.
 * Clearing early sends earlyCheckInEndsAt: null.
 */
export function buildDayConfigPatch(
  form: WindowFormState,
  baseline: EventDayConfigDto,
): { ok: true; body: PatchEventDayConfigBody } | { ok: false; error: string } {
  const body: PatchEventDayConfigBody = {};

  if (form.timezone.trim() !== baseline.timezone) {
    body.timezone = form.timezone.trim();
  }

  const tz = form.timezone.trim() || baseline.timezone;

  try {
    const nextOpens =
      form.opensDate.trim() === ''
        ? null
        : wallClockInZoneToIso(form.opensDate, form.opensTime || '00:00', tz);
    const nextCloses =
      form.closesDate.trim() === ''
        ? null
        : wallClockInZoneToIso(form.closesDate, form.closesTime || '00:00', tz);
    const nextEarly =
      !form.earlyEnabled || form.earlyDate.trim() === ''
        ? null
        : wallClockInZoneToIso(form.earlyDate, form.earlyTime || '00:00', tz);

    if (form.earlyEnabled && nextEarly == null) {
      return { ok: false, error: 'Set an early check-in cutoff, or turn early rewards off' };
    }

    try {
      assertEventDayWindows({
        checkInOpensAt: nextOpens,
        earlyCheckInEndsAt: nextEarly,
        checkInClosesAt: nextCloses,
      });
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Invalid check-in windows' };
    }

    if (!sameInstant(nextOpens, baseline.checkInOpensAt)) {
      body.checkInOpensAt = nextOpens;
    }
    if (!sameInstant(nextCloses, baseline.checkInClosesAt)) {
      body.checkInClosesAt = nextCloses;
    }
    if (!sameInstant(nextEarly, baseline.earlyCheckInEndsAt)) {
      body.earlyCheckInEndsAt = nextEarly;
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid date/time' };
  }

  return { ok: true, body };
}

function sameInstant(a: string | null, b: string | null | undefined): boolean {
  if (a == null && (b == null || b === undefined)) return true;
  if (a == null || b == null) return false;
  return new Date(a).getTime() === new Date(b).getTime();
}

/** Presentational check-in window guidance in event timezone — not authorization. */
export function checkInWindowGuidance(
  config: EventDayConfigDto,
  now = new Date(),
): string | null {
  const opens = config.checkInOpensAt ? new Date(config.checkInOpensAt) : null;
  const early = config.earlyCheckInEndsAt ? new Date(config.earlyCheckInEndsAt) : null;
  const closes = config.checkInClosesAt ? new Date(config.checkInClosesAt) : null;
  const t = now.getTime();

  if (opens && t < opens.getTime()) {
    const { timeDisplay, display } = formatInstantInZone(config.checkInOpensAt, config.timezone);
    return timeDisplay
      ? `Check-in opens at ${timeDisplay}`
      : display
        ? `Check-in opens at ${display}`
        : 'Check-in not open yet';
  }
  if (opens && early && t >= opens.getTime() && t < early.getTime()) {
    return 'Early check-in active · +25 XP';
  }
  if (closes && t >= closes.getTime()) {
    return 'Check-in window ended';
  }
  if (opens || closes) {
    return 'Check-in open';
  }
  return null;
}

export function checkInStatusSummary(config: EventDayConfigDto, now = new Date()): string {
  const guidance = checkInWindowGuidance(config, now);
  if (config.opsStatus === 'scheduled' && config.checkInOpensAt) {
    const { timeDisplay, display } = formatInstantInZone(config.checkInOpensAt, config.timezone);
    const when = timeDisplay || display;
    return when ? `Scheduled · Opens ${when}` : 'Scheduled';
  }
  if (config.opsStatus === 'check_in_open') {
    if (guidance?.startsWith('Early')) return 'Open · Early window';
    if (config.checkInClosesAt) {
      const { timeDisplay, display } = formatInstantInZone(config.checkInClosesAt, config.timezone);
      const when = timeDisplay || display;
      return when ? `Open · until ${when}` : 'Check-in open';
    }
    return 'Check-in open';
  }
  return opsStatusLabel(config.opsStatus);
}

export type CheckInSuccessFeedback = {
  kind: 'already' | 'success';
  title: string;
  detail?: string;
};

/**
 * Build organizer-facing check-in confirmation.
 * XP lines only when progression is truthfully present (solo / single-linked).
 * Rescans never imply a new XP grant.
 */
export function checkInSuccessFeedback(args: {
  dto: CheckInDto;
  wasAlreadyCheckedIn: boolean;
  timeZone?: string;
}): CheckInSuccessFeedback {
  const { dto, wasAlreadyCheckedIn, timeZone = 'Asia/Kolkata' } = args;
  const { timeDisplay } = formatInstantInZone(dto.checkedInAt, timeZone);

  if (wasAlreadyCheckedIn) {
    return {
      kind: 'already',
      title: 'Already checked in',
      detail: timeDisplay || undefined,
    };
  }

  const progression = dto.progression;
  if (progression && progression.totalEventDayXp > 0) {
    const parts = [`+${progression.attendanceXp} XP`];
    if (progression.earlyCheckInXp > 0) {
      parts.push(`Early +${progression.earlyCheckInXp} XP`);
    }
    return {
      kind: 'success',
      title: 'Checked in',
      detail: parts.join(' · '),
    };
  }

  return {
    kind: 'success',
    title: 'Checked in',
  };
}

/** Practical India-first list; other IANA values still display if already set. */
export const COMMON_EVENT_TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'America/New_York',
  'UTC',
] as const;
