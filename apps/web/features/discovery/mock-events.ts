export const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune'] as const;

export type City = (typeof CITIES)[number];

export const DANCE_STYLES = [
  'Breaking',
  'Hip-Hop',
  'Popping',
  'Locking',
  'House',
  'Waacking',
  'Krump',
] as const;

export type DanceStyle = (typeof DANCE_STYLES)[number];

export const EVENT_TYPES = ['battle', 'jam', 'workshop', 'showcase'] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const FOR_YOU_TAGS = [
  'Breaking',
  'Hip-Hop',
  'Popping',
  'Locking',
  'House',
  'Waacking',
  'Krump',
  '1v1',
  '2v2',
  'Open Cypher',
  'Workshop',
] as const;

export type ForYouTag = (typeof FOR_YOU_TAGS)[number];

export interface MockEvent {
  id: string;
  slug: string;
  title: string;
  kicker: string;
  city: City;
  venue: string;
  startTime: string;
  posterUrl: string;
  organizer: string;
  crew: string;
  styles: DanceStyle[];
  tags: ForYouTag[];
  eventType: EventType;
  spotsConfirmed: number;
  spotsCapacity: number;
  featured?: boolean;
  priceMinor: number;
}

function poster(id: string, w = 1400): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${String(w)}&q=80`;
}

export const mockEvents: MockEvent[] = [
  {
    id: 'evt_andheri_cypher_18',
    slug: 'andheri-cypher-vol-18',
    title: 'Andheri Cypher Vol. 18',
    kicker: 'Mumbai · Breaking 1v1',
    city: 'Mumbai',
    venue: 'The Hive, Bandra East',
    startTime: '2026-09-12T18:30:00+05:30',
    posterUrl: poster('photo-1547153760-18fc8632442f'),
    organizer: 'Mumbai City Breakers',
    crew: 'Mumbai City Breakers',
    styles: ['Breaking'],
    tags: ['Breaking', '1v1', 'Open Cypher'],
    eventType: 'battle',
    spotsConfirmed: 48,
    spotsCapacity: 64,
    featured: true,
    priceMinor: 49900,
  },
  {
    id: 'evt_delhi_break_league',
    slug: 'delhi-break-league-monsoon-finals',
    title: 'Delhi Break League — Monsoon Finals',
    kicker: 'Delhi · Championship 1v1',
    city: 'Delhi',
    venue: 'Hangar 9, Connaught Place',
    startTime: '2026-09-20T17:00:00+05:30',
    posterUrl: poster('photo-1535525153412-5a11fad6bba5'),
    organizer: 'Old School Delhi',
    crew: 'Old School Delhi',
    styles: ['Breaking'],
    tags: ['Breaking', '1v1'],
    eventType: 'battle',
    spotsConfirmed: 91,
    spotsCapacity: 96,
    featured: true,
    priceMinor: 79900,
  },
  {
    id: 'evt_session_blr_popping',
    slug: 'session-blr-popping-1v1',
    title: 'Session BLR: Popping 1v1',
    kicker: 'Bengaluru · Popping lab',
    city: 'Bengaluru',
    venue: 'Fandom, Koramangala',
    startTime: '2026-09-06T19:00:00+05:30',
    posterUrl: poster('photo-1508700929628-666bc8bd84ea'),
    organizer: 'Namma Cypher',
    crew: 'Namma Cypher',
    styles: ['Popping'],
    tags: ['Popping', '1v1'],
    eventType: 'battle',
    spotsConfirmed: 22,
    spotsCapacity: 32,
    featured: true,
    priceMinor: 39900,
  },
  {
    id: 'evt_pune_street_wars',
    slug: 'pune-street-wars-26',
    title: 'Pune Street Wars',
    kicker: 'Pune · All-styles 2v2',
    city: 'Pune',
    venue: 'High Spirits, Koregaon Park',
    startTime: '2026-09-27T18:00:00+05:30',
    posterUrl: poster('photo-1516450360452-9312f5e86fc7'),
    organizer: 'Deccan Rockers',
    crew: 'Pune Funk Force',
    styles: ['Hip-Hop', 'Breaking'],
    tags: ['Hip-Hop', '2v2'],
    eventType: 'battle',
    spotsConfirmed: 54,
    spotsCapacity: 80,
    priceMinor: 59900,
  },
  {
    id: 'evt_lock_key_mumbai',
    slug: 'lock-and-key-mumbai',
    title: 'Lock & Key Mumbai',
    kicker: 'Mumbai · Locking showcase',
    city: 'Mumbai',
    venue: 'NCPA Experimental Theatre',
    startTime: '2026-10-04T16:30:00+05:30',
    posterUrl: poster('photo-1524368535928-5b5e00ddc76b'),
    organizer: 'Soul Smashers',
    crew: 'Soul Smashers',
    styles: ['Locking'],
    tags: ['Locking'],
    eventType: 'showcase',
    spotsConfirmed: 110,
    spotsCapacity: 180,
    priceMinor: 69900,
  },
  {
    id: 'evt_house_koramangala',
    slug: 'house-of-koramangala',
    title: 'House of Koramangala',
    kicker: 'Bengaluru · Jackin’ night',
    city: 'Bengaluru',
    venue: 'Gilly’s Redefined, Koramangala',
    startTime: '2026-10-11T20:00:00+05:30',
    posterUrl: poster('photo-1470225620780-dba8ba36b745'),
    organizer: 'Flynamic',
    crew: 'Flynamic',
    styles: ['House'],
    tags: ['House', 'Open Cypher'],
    eventType: 'jam',
    spotsConfirmed: 36,
    spotsCapacity: 70,
    priceMinor: 0,
  },
  {
    id: 'evt_waack_attack_delhi',
    slug: 'waack-attack-delhi',
    title: 'Waack Attack Delhi',
    kicker: 'Delhi · Waacking 1v1',
    city: 'Delhi',
    venue: 'OddBird Theatre, Chhatarpur',
    startTime: '2026-10-18T17:30:00+05:30',
    posterUrl: poster('photo-1514525253161-7a46d19cd819'),
    organizer: 'Body Carnival',
    crew: 'Body Carnival',
    styles: ['Waacking'],
    tags: ['Waacking', '1v1'],
    eventType: 'battle',
    spotsConfirmed: 18,
    spotsCapacity: 40,
    priceMinor: 44900,
  },
  {
    id: 'evt_deccan_krump_night',
    slug: 'deccan-krump-night',
    title: 'Deccan Krump Night',
    kicker: 'Pune · Krump session',
    city: 'Pune',
    venue: 'High Spirits Backlot',
    startTime: '2026-09-14T19:30:00+05:30',
    posterUrl: poster('photo-1429962714451-bb93442d0a21'),
    organizer: 'Deccan Rockers',
    crew: 'Deccan Rockers',
    styles: ['Krump'],
    tags: ['Krump', 'Open Cypher'],
    eventType: 'jam',
    spotsConfirmed: 28,
    spotsCapacity: 40,
    priceMinor: 29900,
  },
  {
    id: 'evt_bboy_gully_dharavi',
    slug: 'bboy-gully-dharavi-open',
    title: 'B-Boy Gully — Dharavi Open',
    kicker: 'Mumbai · Open cypher',
    city: 'Mumbai',
    venue: 'Dharavi Art Room',
    startTime: '2026-09-07T16:00:00+05:30',
    posterUrl: poster('photo-1504609813442-a8924e83f76e'),
    organizer: 'Mumbai City Breakers',
    crew: 'Footwork Fam',
    styles: ['Breaking'],
    tags: ['Breaking', 'Open Cypher'],
    eventType: 'jam',
    spotsConfirmed: 40,
    spotsCapacity: 40,
    priceMinor: 0,
  },
  {
    id: 'evt_hustle_jam_blr',
    slug: 'hustle-jam-bengaluru',
    title: 'Hustle Jam Bengaluru',
    kicker: 'Bengaluru · Hip-Hop 2v2',
    city: 'Bengaluru',
    venue: 'Toit Brewery, Indiranagar',
    startTime: '2026-09-21T18:00:00+05:30',
    posterUrl: poster('photo-1493225457124-a3eb161ffa5f'),
    organizer: 'The Groovers',
    crew: 'The Groovers',
    styles: ['Hip-Hop'],
    tags: ['Hip-Hop', '2v2'],
    eventType: 'battle',
    spotsConfirmed: 44,
    spotsCapacity: 60,
    priceMinor: 54900,
  },
  {
    id: 'evt_westside_popping_lab',
    slug: 'westside-popping-lab',
    title: 'Westside Popping Lab',
    kicker: 'Mumbai · Technique workshop',
    city: 'Mumbai',
    venue: 'Danceworx Andheri',
    startTime: '2026-09-13T11:00:00+05:30',
    posterUrl: poster('photo-1518834107812-67b0b7c58434'),
    organizer: 'Soul Smashers',
    crew: 'Soul Smashers',
    styles: ['Popping'],
    tags: ['Popping', 'Workshop'],
    eventType: 'workshop',
    spotsConfirmed: 14,
    spotsCapacity: 24,
    priceMinor: 149900,
  },
  {
    id: 'evt_ncr_all_styles',
    slug: 'ncr-all-styles-throwdown',
    title: 'NCR All-Styles Throwdown',
    kicker: 'Delhi · Crew 2v2',
    city: 'Delhi',
    venue: 'Sunder Nursery Pavilion',
    startTime: '2026-11-01T16:00:00+05:30',
    posterUrl: poster('photo-1459749411177-04aa7c0d2e66'),
    organizer: 'Old School Delhi',
    crew: 'Old School Delhi',
    styles: ['Hip-Hop', 'Popping', 'Breaking'],
    tags: ['Hip-Hop', '2v2', 'Open Cypher'],
    eventType: 'battle',
    spotsConfirmed: 62,
    spotsCapacity: 120,
    priceMinor: 64900,
  },
];

export interface MockNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  href: string;
}

export const mockNotifications: MockNotification[] = [
  {
    id: 'ntf_1',
    title: 'Delhi Break League is almost full',
    body: '5 spots left in Breaking 1v1 — finals week at Hangar 9.',
    time: '12m ago',
    unread: true,
    href: '/events/delhi-break-league-monsoon-finals',
  },
  {
    id: 'ntf_2',
    title: 'Payment confirmed · Andheri Cypher',
    body: 'Your ticket for Vol. 18 is in Tickets. Floor opens 6:30pm.',
    time: '2h ago',
    unread: true,
    href: '/tickets',
  },
  {
    id: 'ntf_3',
    title: 'Session BLR: judges posted',
    body: 'Namma Cypher locked the popping panel. Check the event page.',
    time: 'Yesterday',
    unread: false,
    href: '/events/session-blr-popping-1v1',
  },
];

export interface DiscoverFilters {
  q?: string;
  city?: string;
  tag?: string;
  type?: string;
}

export function filterMockEvents(events: MockEvent[], filters: DiscoverFilters): MockEvent[] {
  const q = filters.q?.trim().toLowerCase();
  const city = filters.city?.trim();
  const tag = filters.tag?.trim();
  const type = filters.type?.trim();

  return events.filter((event) => {
    if (city && city !== 'all' && event.city !== city) return false;
    if (type && type !== 'all' && event.eventType !== type) return false;
    if (tag && !event.tags.includes(tag as ForYouTag) && !event.styles.includes(tag as DanceStyle)) {
      return false;
    }
    if (q) {
      const haystack = [
        event.title,
        event.city,
        event.venue,
        event.organizer,
        event.crew,
        event.kicker,
        ...event.styles,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function featuredEvents(events: MockEvent[]): MockEvent[] {
  return events.filter((event) => event.featured);
}

export function nextUpEvents(events: MockEvent[], limit = 5): MockEvent[] {
  return [...events]
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, limit);
}

import { spotsLeft } from '@cypher/utils';

export function spotsTone(
  confirmed: number,
  capacity: number,
): { label: string; className: string } {
  const left = spotsLeft(capacity, confirmed);
  if (left === 0) {
    return { label: `Waitlist · 0 / ${String(capacity)} spots left`, className: 'text-error' };
  }
  if (left <= 8) {
    return {
      label: `${String(left)} / ${String(capacity)} spots left`,
      className: 'text-warning',
    };
  }
  return {
    label: `${String(left)} / ${String(capacity)} spots left`,
    className: 'text-accent-2',
  };
}
