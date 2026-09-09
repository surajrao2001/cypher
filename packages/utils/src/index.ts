export function formatMinorUnits(amountMinor: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

export function formatEventDateRange(
  startIso: string,
  endIso: string | null | undefined,
  timeZone = 'Asia/Kolkata',
): string {
  const start = formatEventDate(startIso, timeZone);
  if (!endIso) return start;
  const end = formatEventDate(endIso, timeZone);
  if (start === end) return start;
  return `${start} – ${end}`;
}

/** Prefer endTime when judging whether an event is in the past. */
export function eventEffectiveEndIso(startIso: string, endIso: string | null | undefined): string {
  return endIso || startIso;
}

export function formatEventDate(iso: string, timeZone = 'Asia/Kolkata'): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso));
}

export function spotsLeft(capacity: number, confirmedCount: number): number {
  return Math.max(0, capacity - confirmedCount);
}

/** Minimal registration shape for wallet partitioning (Needs action / Upcoming / Past). */
export type TicketPartitionInput = {
  registrationStatus: string;
  reservationExpiresAt: string | null;
  event: { startTime: string };
};

export type TicketPartitions<T extends TicketPartitionInput> = {
  needsAction: T[];
  upcoming: T[];
  past: T[];
};

/**
 * Split registrations for the Tickets wallet.
 * Hides cancelled / expired / other statuses from the main list.
 */
export function partitionRegistrationsForTickets<T extends TicketPartitionInput>(
  items: T[],
  now: Date = new Date(),
): TicketPartitions<T> {
  const nowMs = now.getTime();

  const needsAction = items
    .filter((row) => row.registrationStatus === 'pending_payment')
    .sort((a, b) => {
      const ae = a.reservationExpiresAt ? new Date(a.reservationExpiresAt).getTime() : Number.POSITIVE_INFINITY;
      const be = b.reservationExpiresAt ? new Date(b.reservationExpiresAt).getTime() : Number.POSITIVE_INFINITY;
      return ae - be;
    });

  const confirmed = items.filter((row) => row.registrationStatus === 'confirmed');
  const upcoming = confirmed
    .filter((row) => new Date(row.event.startTime).getTime() >= nowMs)
    .sort((a, b) => new Date(a.event.startTime).getTime() - new Date(b.event.startTime).getTime());
  const past = confirmed
    .filter((row) => new Date(row.event.startTime).getTime() < nowMs)
    .sort((a, b) => new Date(b.event.startTime).getTime() - new Date(a.event.startTime).getTime());

  return { needsAction, upcoming, past };
}

export * from './scene-lexicon';
