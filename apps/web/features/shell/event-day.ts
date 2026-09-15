/** Date-aware event moment labels — IST (product timezone). */

function istParts(isoOrDate: string | Date): { ymd: string; hour: number } {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return { ymd: '', hour: -1 };
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    }).format(d),
  );
  return { ymd, hour: Number.isFinite(hour) ? hour : -1 };
}

/** Same calendar day in Asia/Kolkata as `now`. */
export function isSameIstDay(startIso: string, now: Date = new Date()): boolean {
  const a = istParts(startIso);
  const b = istParts(now);
  return Boolean(a.ymd) && a.ymd === b.ymd;
}

/**
 * Event-day signal for published events still upcoming / in progress.
 * Evening (≥17:00 IST) → tonight; earlier → today.
 */
export function eventDayMoment(
  startIso: string,
  now: Date = new Date(),
): 'tonight' | 'today' | null {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return null;
  // More than 3h after start → not “tonight” chrome anymore
  if (start.getTime() < now.getTime() - 3 * 60 * 60 * 1000) return null;
  if (!isSameIstDay(startIso, now)) return null;
  const { hour } = istParts(startIso);
  return hour >= 17 ? 'tonight' : 'today';
}

export function eventDayBadgeLabel(startIso: string, now?: Date): string | null {
  const m = eventDayMoment(startIso, now);
  if (m === 'tonight') return 'Tonight';
  if (m === 'today') return 'Today';
  return null;
}
