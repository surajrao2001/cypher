/**
 * Shared event / category / early-bird gates used by Nest and clients.
 * Throw messages are user-facing; keep them short.
 */

export type GateTier = {
  name: string;
  priceMinor: number;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
};

export type GateDay = {
  label: string;
  startsAt: Date | string;
  endsAt?: Date | string | null;
};

function asDate(value: Date | string | null | undefined, label: string): Date | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
  return d;
}

export function assertEndAfterStart(
  startTime: Date | string,
  endTime: Date | string | null | undefined,
): void {
  if (endTime == null || endTime === '') return;
  const start = asDate(startTime, 'startTime')!;
  const end = asDate(endTime, 'endTime')!;
  if (end.getTime() < start.getTime()) {
    throw new Error('End time must be on or after start time');
  }
}

export function assertRegistrationWindow(input: {
  opensAt?: Date | string | null;
  closesAt?: Date | string | null;
  startTime: Date | string;
}): void {
  const start = asDate(input.startTime, 'startTime')!;
  const opens = asDate(input.opensAt ?? null, 'registrationOpensAt');
  const closes = asDate(input.closesAt ?? null, 'registrationClosesAt');
  if (opens && closes && opens.getTime() > closes.getTime()) {
    throw new Error('Registration open must be before close');
  }
  if (closes && closes.getTime() > start.getTime()) {
    throw new Error('Registration must close before the event starts');
  }
  if (opens && opens.getTime() > start.getTime()) {
    throw new Error('Registration cannot open after the event starts');
  }
}

export function assertEventDaysInSpan(
  days: GateDay[],
  eventStart: Date | string,
  eventEnd: Date | string | null | undefined,
): void {
  const start = asDate(eventStart, 'startTime')!;
  const end = eventEnd != null && eventEnd !== '' ? asDate(eventEnd, 'endTime') : null;
  for (const day of days) {
    const dayStart = asDate(day.startsAt, `day “${day.label}” start`)!;
    const dayEnd = asDate(day.endsAt ?? null, `day “${day.label}” end`);
    if (dayEnd && dayEnd.getTime() < dayStart.getTime()) {
      throw new Error(`Day “${day.label}” end must be on or after its start`);
    }
    if (dayStart.getTime() < start.getTime()) {
      throw new Error(`Day “${day.label}” starts before the event`);
    }
    if (end && dayStart.getTime() > end.getTime()) {
      throw new Error(`Day “${day.label}” starts after the event ends`);
    }
    if (end && dayEnd && dayEnd.getTime() > end.getTime()) {
      throw new Error(`Day “${day.label}” ends after the event`);
    }
  }
}

/** Early bird + regular style tiers (name heuristics + window / price rules). */
export function assertCategoryPriceTiers(
  tiers: GateTier[],
  event: { startTime: Date | string; createdAt?: Date | string | null; publishedAt?: Date | string | null },
): void {
  if (tiers.length === 0) return;
  for (const tier of tiers) {
    if (tier.priceMinor < 0) {
      throw new Error('Tier prices cannot be negative');
    }
    const starts = asDate(tier.startsAt ?? null, `${tier.name} startsAt`);
    const ends = asDate(tier.endsAt ?? null, `${tier.name} endsAt`);
    if (starts && ends && ends.getTime() < starts.getTime()) {
      throw new Error(`“${tier.name}” ends before it starts`);
    }
  }

  const eventStart = asDate(event.startTime, 'startTime')!;
  const floor =
    asDate(event.publishedAt ?? null, 'publishedAt') ??
    asDate(event.createdAt ?? null, 'createdAt');

  const early = tiers.find((t) => /early/i.test(t.name));
  const regular =
    tiers.find((t) => /regular/i.test(t.name)) ??
    tiers.find((t) => early && t.name !== early.name);

  if (early) {
    const earlyEnds = asDate(early.endsAt ?? null, 'early bird endsAt');
    if (!earlyEnds) {
      throw new Error('Early bird needs an end time');
    }
    if (earlyEnds.getTime() >= eventStart.getTime()) {
      throw new Error('Early bird must end before the event starts');
    }
    if (floor && earlyEnds.getTime() < floor.getTime()) {
      throw new Error('Early bird end must be after the event was created/published');
    }
    if (regular) {
      const regStarts = asDate(regular.startsAt ?? null, 'regular startsAt');
      if (regStarts && regStarts.getTime() !== earlyEnds.getTime()) {
        throw new Error('Regular pricing should start when early bird ends');
      }
      if (early.priceMinor > regular.priceMinor) {
        throw new Error('Early bird price should be at or below regular');
      }
    }
  }

  for (const tier of tiers) {
    const ends = asDate(tier.endsAt ?? null, `${tier.name} endsAt`);
    if (ends && ends.getTime() > eventStart.getTime()) {
      throw new Error(`“${tier.name}” cannot end after the event starts`);
    }
    const starts = asDate(tier.startsAt ?? null, `${tier.name} startsAt`);
    if (starts && starts.getTime() > eventStart.getTime()) {
      throw new Error(`“${tier.name}” cannot start after the event starts`);
    }
  }
}

export function assertTeamSizes(minTeamSize: number, maxTeamSize: number, entryType?: string): void {
  if (entryType === 'viewer') {
    if (minTeamSize !== 1 || maxTeamSize !== 1) {
      throw new Error('Viewer tickets are always 1 person');
    }
    return;
  }
  if (minTeamSize < 1 || maxTeamSize < 1) {
    throw new Error('Team size must be at least 1');
  }
  if (minTeamSize > maxTeamSize) {
    throw new Error('Min team size cannot exceed max');
  }
  if (entryType === 'solo' && (minTeamSize !== 1 || maxTeamSize !== 1)) {
    throw new Error('Solo categories are always 1 person');
  }
}

export function assertCapacityFloor(capacity: number, occupied: number): void {
  if (capacity < occupied) {
    throw new Error(`Capacity cannot be below ${String(occupied)} occupied spots`);
  }
}

export function assertPublishCategories(
  _categories: Array<{ entryType: string }>,
): void {
  // Categories are optional at publish — free sessions / announcement nights
  // can go live without compete or viewer lanes. Registration stays gated by
  // whatever categories exist later.
  void _categories;
}
