import type {
  CategoryEntryType,
  EventLiveDto,
  EventLiveEntryDto,
  EventOpsStatus,
  EventUpdateDto,
} from '@cypher/contracts';

/** Dancer-facing ops status — not organizer door-control copy. */
export function dancerOpsStatusLabel(status: EventOpsStatus): string {
  switch (status) {
    case 'scheduled':
      return 'Event day';
    case 'check_in_open':
      return 'Check-in is open';
    case 'check_in_closed':
      return 'Check-in closed';
    case 'event_live':
      return "We're live";
    case 'completed':
      return 'Event complete';
    default:
      return status;
  }
}

export function entryTypeLabel(entryType: CategoryEntryType): string {
  switch (entryType) {
    case 'solo':
      return 'Solo';
    case 'team':
      return 'Team';
    case 'viewer':
      return 'Audience Pass';
    default:
      return entryType;
  }
}

export function formatLiveInstant(
  iso: string | null | undefined,
  timeZone: string,
): { time: string; dateTime: string } {
  if (!iso) return { time: '', dateTime: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { time: '', dateTime: '' };
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  const dateTime = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return { time, dateTime };
}

/** Presentational window copy — not authorization. */
export function liveCheckInWindowHint(
  live: EventLiveDto,
  now = new Date(),
): string | null {
  const { opensAt, earlyEndsAt, closesAt } = live.checkIn;
  const tz = live.ops.timezone;
  const t = now.getTime();
  const opens = opensAt ? new Date(opensAt).getTime() : null;
  const early = earlyEndsAt ? new Date(earlyEndsAt).getTime() : null;
  const closes = closesAt ? new Date(closesAt).getTime() : null;

  if (opens != null && t < opens) {
    const { time } = formatLiveInstant(opensAt, tz);
    return time ? `Check-in opens at ${time}` : 'Check-in not open yet';
  }
  if (opens != null && early != null && t >= opens && t < early && !live.checkIn.earlyCheckInEarned) {
    const { time } = formatLiveInstant(earlyEndsAt, tz);
    return time ? `Early check-in · +25 XP until ${time}` : 'Early check-in active · +25 XP';
  }
  if (closes != null && t >= closes) {
    return 'Check-in window ended';
  }
  if (closes != null && (opens == null || t >= opens)) {
    const { time } = formatLiveInstant(closesAt, tz);
    return time ? `Check-in open until ${time}` : 'Check-in open';
  }
  if (opens != null || closes != null) {
    return 'Check-in open';
  }
  return null;
}

/**
 * G1 presentation heuristic for surfacing Live entry points (Passes / Events / Event Details).
 *
 * WHY: G1 has no authoritative “event lifecycle phase” on list payloads, and we must not
 * call GET /me/events/:id/live per card (N+1). This helper uses startTime only:
 *   same Asia/Kolkata calendar day as now
 *   OR within 6 hours before start → 7 days after start
 *
 * This is NOT domain event lifecycle truth (not opsStatus / EventDayConfig).
 * Future phases may replace it with real lifecycle / ops fields on list DTOs.
 */
export function isLiveCompanionRelevant(startIso: string, now = new Date()): boolean {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return false;
  const ymd = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  if (ymd(start) === ymd(now)) return true;
  const t = now.getTime();
  return t >= start.getTime() - 6 * 60 * 60 * 1000 && t <= start.getTime() + 7 * 24 * 60 * 60 * 1000;
}

export type LivePrimaryKind =
  | 'no_entries'
  | 'before_open'
  | 'open_not_checked_in'
  | 'checked_in'
  | 'live_not_checked_in'
  | 'live_checked_in'
  | 'completed';

export type LivePrimaryModel = {
  kind: LivePrimaryKind;
  title: string;
  body: string;
  /** Presentational timing / early line */
  detail?: string;
  showViewPass: boolean;
  showViewEvent: boolean;
  /** Decorative check-in art for pre-check-in states */
  showCheckInArt: boolean;
};

export function deriveLivePrimary(live: EventLiveDto, now = new Date()): LivePrimaryModel {
  const entries = live.checkIn.myEntries;
  const anyCheckedIn = entries.some((e) => e.checkedIn);
  const firstChecked = entries.find((e) => e.checkedIn && e.checkedInAt);
  const checkedTime = firstChecked
    ? formatLiveInstant(firstChecked.checkedInAt, live.ops.timezone).time
    : '';
  const windowHint = liveCheckInWindowHint(live, now);
  const status = live.ops.status;

  if (entries.length === 0) {
    return {
      kind: 'no_entries',
      title: "You're here",
      body: "You're not registered for an entry at this event.",
      showViewPass: false,
      showViewEvent: true,
      showCheckInArt: false,
    };
  }

  if (status === 'completed') {
    return {
      kind: 'completed',
      title: 'Event complete',
      body: checkedTime
        ? `You checked in at ${checkedTime}`
        : anyCheckedIn
          ? 'You checked in.'
          : 'This event day is done.',
      showViewPass: false,
      showViewEvent: true,
      showCheckInArt: false,
    };
  }

  if (anyCheckedIn || live.checkIn.attendanceVerified) {
    if (status === 'event_live') {
      return {
        kind: 'live_checked_in',
        title: "You're checked in",
        body: 'The floor is live.',
        detail: checkedTime ? `Checked in ${checkedTime}` : undefined,
        showViewPass: true,
        showViewEvent: false,
        showCheckInArt: false,
      };
    }
    return {
      kind: 'checked_in',
      title: "You're in",
      body: checkedTime ? `Checked in ${checkedTime}` : 'Checked in.',
      showViewPass: true,
      showViewEvent: false,
      showCheckInArt: false,
    };
  }

  if (status === 'event_live') {
    return {
      kind: 'live_not_checked_in',
      title: "We're live",
      body: "You're not checked in yet. Show your pass at check-in.",
      showViewPass: true,
      showViewEvent: false,
      showCheckInArt: true,
    };
  }

  const opens = live.checkIn.opensAt ? new Date(live.checkIn.opensAt).getTime() : null;
  if (opens != null && now.getTime() < opens) {
    const { time } = formatLiveInstant(live.checkIn.opensAt, live.ops.timezone);
    return {
      kind: 'before_open',
      title: 'Check-in opens',
      body: 'Get your pass ready.',
      detail: time || undefined,
      showViewPass: true,
      showViewEvent: false,
      showCheckInArt: true,
    };
  }

  if (status === 'check_in_open' || windowHint?.includes('open') || windowHint?.includes('Early')) {
    return {
      kind: 'open_not_checked_in',
      title: "You're not checked in yet",
      body: 'Show your pass at the door.',
      detail: windowHint ?? undefined,
      showViewPass: true,
      showViewEvent: false,
      showCheckInArt: true,
    };
  }

  return {
    kind: 'before_open',
    title: dancerOpsStatusLabel(status),
    body: 'Get your pass ready for check-in.',
    detail: windowHint ?? undefined,
    showViewPass: true,
    showViewEvent: false,
    showCheckInArt: true,
  };
}

export type ProgressionPresentation = {
  total: number;
  lines: Array<{ label: string; xp: number; earned: boolean }>;
} | null;

/** Omit entirely when zero — no empty XP dashboard. */
export function progressionPresentation(live: EventLiveDto): ProgressionPresentation {
  const { attendanceXp, earlyCheckInXp, totalEventDayXp } = live.progression;
  if (totalEventDayXp <= 0) return null;
  const lines: Array<{ label: string; xp: number; earned: boolean }> = [];
  if (attendanceXp > 0) {
    lines.push({ label: 'Checked in', xp: attendanceXp, earned: true });
  }
  if (earlyCheckInXp > 0) {
    lines.push({ label: 'Early arrival', xp: earlyCheckInXp, earned: true });
  }
  return { total: totalEventDayXp, lines };
}

/** Early opportunity / earned — earned uses Live.earlyCheckInEarned, not client clock. */
export function earlyRewardPresentation(
  live: EventLiveDto,
  now = new Date(),
): { kind: 'earned' | 'active' | 'none'; label: string; detail?: string } {
  if (live.checkIn.earlyCheckInEarned || live.progression.earlyCheckInXp > 0) {
    const xp = live.progression.earlyCheckInXp;
    return {
      kind: 'earned',
      label: 'Early check-in',
      detail: xp > 0 ? `+${xp} XP` : undefined,
    };
  }
  const opens = live.checkIn.opensAt ? new Date(live.checkIn.opensAt).getTime() : null;
  const early = live.checkIn.earlyEndsAt ? new Date(live.checkIn.earlyEndsAt).getTime() : null;
  const t = now.getTime();
  if (opens != null && early != null && t >= opens && t < early) {
    const { time } = formatLiveInstant(live.checkIn.earlyEndsAt, live.ops.timezone);
    return {
      kind: 'active',
      label: 'Early check-in',
      detail: time ? `+25 XP until ${time}` : '+25 XP',
    };
  }
  return { kind: 'none', label: '' };
}

export function announcementTimeLabel(update: EventUpdateDto, timeZone: string): string {
  return formatLiveInstant(update.publishedAt, timeZone).time;
}

export function entryCheckInLabel(entry: EventLiveEntryDto, timeZone: string): string {
  if (!entry.checkedIn) return 'Waiting for check-in';
  const { time } = formatLiveInstant(entry.checkedInAt, timeZone);
  return time ? `Checked in · ${time}` : 'Checked in';
}

/** Guard: Live UI must never expose a dancer self-check-in CTA. */
export function livePrimaryActions(model: LivePrimaryModel): Array<'view_pass' | 'view_event'> {
  const actions: Array<'view_pass' | 'view_event'> = [];
  if (model.showViewPass) actions.push('view_pass');
  if (model.showViewEvent) actions.push('view_event');
  return actions;
}
