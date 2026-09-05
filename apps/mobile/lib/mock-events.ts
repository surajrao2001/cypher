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

export interface MockEvent {
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
}

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: 'evt_midnight_cipher',
    slug: 'midnight-cipher-vol-4',
    title: 'Midnight Cipher Vol. 4',
    city: 'Mumbai',
    venue: 'The Warehouse, Lower Parel',
    startTime: '2026-09-20T19:30:00+05:30',
    styles: ['Breaking', 'Open'],
    spotsConfirmed: 142,
    spotsCapacity: 180,
    priceMinor: 79900,
    featured: true,
    organizerName: 'Night Floor Collective',
    description:
      'The city\'s loudest all-styles cypher returns to Lower Parel. Prelims on the main floor, finals under the rig, and a late-night open cypher that does not clock out until security does.',
    posterTone: 'orange',
  },
  {
    id: 'evt_floor_wars_south',
    slug: 'floor-wars-south',
    title: 'Floor Wars: South',
    city: 'Bengaluru',
    venue: 'Phoenix Arena, Whitefield',
    startTime: '2026-09-27T18:00:00+05:30',
    styles: ['Breaking'],
    spotsConfirmed: 88,
    spotsCapacity: 96,
    priceMinor: 99900,
    featured: false,
    organizerName: 'South Cypher League',
    description:
      'Two-on-two breaking battles with a live DJ and a judging panel that actually danced this decade. Eight spots left — they will not last the week.',
    posterTone: 'lime',
  },
  {
    id: 'evt_house_nation',
    slug: 'house-nation-afterhours',
    title: 'House Nation Afterhours',
    city: 'Delhi',
    venue: 'Basement 11, Hauz Khas',
    startTime: '2026-10-04T21:00:00+05:30',
    styles: ['House'],
    spotsConfirmed: 40,
    spotsCapacity: 120,
    priceMinor: 59900,
    featured: false,
    organizerName: 'Jack & Track',
    description:
      'Four hours of jacking, tracks you will not hear on a wedding set, and a floor that stays open until the last train. No phones on the circle.',
    posterTone: 'orange',
  },
  {
    id: 'evt_lock_key',
    slug: 'lock-and-key-session',
    title: 'Lock & Key Session',
    city: 'Pune',
    venue: 'Deccan Loft',
    startTime: '2026-10-11T17:00:00+05:30',
    styles: ['Locking', 'Popping'],
    spotsConfirmed: 54,
    spotsCapacity: 80,
    priceMinor: 49900,
    featured: false,
    organizerName: 'Groove Mechanics',
    description:
      'A locking and popping lab that ends in a judged showcase. Bring clean isolations. Leave with notes, not just stories.',
    posterTone: 'lime',
  },
  {
    id: 'evt_waack_world',
    slug: 'waack-world-india',
    title: 'Waack World India',
    city: 'Hyderabad',
    venue: 'Studio Kismet',
    startTime: '2026-10-18T16:30:00+05:30',
    styles: ['Waacking'],
    spotsConfirmed: 61,
    spotsCapacity: 70,
    priceMinor: 69900,
    featured: false,
    organizerName: 'Armory India',
    description:
      'National waacking gathering with workshops in the afternoon and a battle that night. Nine spots left in the main room.',
    posterTone: 'orange',
  },
  {
    id: 'evt_popping_lab',
    slug: 'popping-lab-chennai',
    title: 'Popping Lab',
    city: 'Chennai',
    venue: 'Waveform Hall',
    startTime: '2026-10-25T15:00:00+05:30',
    styles: ['Popping'],
    spotsConfirmed: 22,
    spotsCapacity: 60,
    priceMinor: 39900,
    featured: false,
    organizerName: 'Hit & Hold',
    description:
      'Technique-first popping session with a guest from the west-coast circuit. Slow drills, then a cypher that actually uses them.',
    posterTone: 'lime',
  },
  {
    id: 'evt_hiphop_sundays',
    slug: 'open-cypher-sundays',
    title: 'Open Cypher Sundays',
    city: 'Mumbai',
    venue: 'Bandra Bandstand Court',
    startTime: '2026-09-14T11:00:00+05:30',
    styles: ['Hip Hop', 'Open'],
    spotsConfirmed: 200,
    spotsCapacity: 200,
    priceMinor: 0,
    featured: false,
    organizerName: 'Court Keepers',
    description:
      'Free outdoor cypher. First come, first circle. Sold out on paper because the court only holds two hundred bodies — show up early or watch from the wall.',
    posterTone: 'orange',
  },
  {
    id: 'evt_krump_session',
    slug: 'krump-session-delhi',
    title: 'Krump Session Delhi',
    city: 'Delhi',
    venue: 'Okhla Yard',
    startTime: '2026-11-01T19:00:00+05:30',
    styles: ['Krump'],
    spotsConfirmed: 18,
    spotsCapacity: 50,
    priceMinor: 34900,
    featured: false,
    organizerName: 'Yard Family',
    description:
      'A raw session, not a showcase. Live percussion, no flash photography, and a floor that belongs to the people who came to dance.',
    posterTone: 'lime',
  },
];

export function getEventById(id: string): MockEvent | undefined {
  return MOCK_EVENTS.find((event) => event.id === id);
}

export function getFeaturedEvent(): MockEvent {
  return MOCK_EVENTS.find((event) => event.featured) ?? MOCK_EVENTS[0]!;
}

export function filterEvents(style: StyleFilter, events: MockEvent[] = MOCK_EVENTS): MockEvent[] {
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

export function upcomingEvents(events: MockEvent[] = MOCK_EVENTS): MockEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}
