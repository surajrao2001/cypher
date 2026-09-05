export const DANCE_STYLES = [
  'All',
  'Breaking',
  'Hip Hop',
  'House',
  'Popping',
  'Locking',
  'Waacking',
  'Krump',
  'Open',
] as const;

export type DanceStyle = Exclude<(typeof DANCE_STYLES)[number], 'All'>;
export type StyleFilter = (typeof DANCE_STYLES)[number];

/** Client-side event shape mapped from Nest DTOs (not seed/mock catalog). */
export interface MobileEvent {
  id: string;
  slug: string;
  title: string;
  city: string;
  venue: string;
  startTime: string;
  styles: string[];
  spotsConfirmed: number;
  spotsCapacity: number;
  priceMinor: number;
  featured: boolean;
  organizerName: string;
  description: string;
  posterTone: 'orange' | 'lime';
  posterUrl?: string | null;
  categories?: Array<{
    id: string;
    name: string;
    priceMinor: number;
    capacity: number;
    reservedCount: number;
    confirmedCount: number;
    minTeamSize: number;
    maxTeamSize: number;
  }>;
  mediaLinks?: Array<{
    id: string;
    title: string;
    url: string;
    kind: string;
  }>;
}

export function filterEvents(style: StyleFilter, events: MobileEvent[]): MobileEvent[] {
  if (style === 'All') {
    return events;
  }
  const needle = style.toLowerCase().replaceAll('-', ' ');
  return events.filter((event) =>
    event.styles.some((item) => {
      const hay = item.toLowerCase().replaceAll('-', ' ');
      return hay.includes(needle) || needle.includes(hay);
    }),
  );
}

export function upcomingEvents(events: MobileEvent[]): MobileEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}
