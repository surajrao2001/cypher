import { EventStatus, OrganizerMemberRole, OrganizerVerificationStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_USER_ID = '00000000-0000-4000-8000-000000000001';

function poster(id: string): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;
}

type SeedEvent = {
  slug: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  startTime: string;
  posterUrl: string;
  organizerSlug: string;
  styles: string[];
  tags: string[];
  eventType: string;
  spotsConfirmed: number;
  spotsCapacity: number;
  featured?: boolean;
  priceMinor: number;
  categoryName: string;
};

const organizers = [
  { slug: 'mumbai-city-breakers', orgName: 'Mumbai City Breakers', city: 'Mumbai' },
  { slug: 'old-school-delhi', orgName: 'Old School Delhi', city: 'Delhi' },
  { slug: 'namma-cypher', orgName: 'Namma Cypher', city: 'Bengaluru' },
  { slug: 'deccan-rockers', orgName: 'Deccan Rockers', city: 'Pune' },
  { slug: 'soul-smashers', orgName: 'Soul Smashers', city: 'Mumbai' },
  { slug: 'flynamic', orgName: 'Flynamic', city: 'Bengaluru' },
  { slug: 'body-carnival', orgName: 'Body Carnival', city: 'Delhi' },
  { slug: 'the-groovers', orgName: 'The Groovers', city: 'Bengaluru' },
];

const events: SeedEvent[] = [
  {
    slug: 'andheri-cypher-vol-18',
    title: 'Andheri Cypher Vol. 18',
    description: 'Mumbai City Breakers hosts this battle on a dark floor. Category capacity is live confirmed vs total.',
    city: 'Mumbai',
    venue: 'The Hive, Bandra East',
    startTime: '2026-09-12T18:30:00+05:30',
    posterUrl: poster('photo-1547153760-18fc8632442f'),
    organizerSlug: 'mumbai-city-breakers',
    styles: ['Breaking'],
    tags: ['Breaking', '1v1', 'Open Cypher'],
    eventType: 'battle',
    spotsConfirmed: 48,
    spotsCapacity: 64,
    featured: true,
    priceMinor: 49900,
    categoryName: 'Breaking 1v1',
  },
  {
    slug: 'delhi-break-league-monsoon-finals',
    title: 'Delhi Break League — Monsoon Finals',
    description: 'Championship 1v1 week at Hangar 9. Confirmed counts come from event_categories, not a vanity counter.',
    city: 'Delhi',
    venue: 'Hangar 9, Connaught Place',
    startTime: '2026-09-20T17:00:00+05:30',
    posterUrl: poster('photo-1535525153412-5a11fad6bba5'),
    organizerSlug: 'old-school-delhi',
    styles: ['Breaking'],
    tags: ['Breaking', '1v1'],
    eventType: 'battle',
    spotsConfirmed: 91,
    spotsCapacity: 96,
    featured: true,
    priceMinor: 79900,
    categoryName: 'Breaking 1v1',
  },
  {
    slug: 'session-blr-popping-1v1',
    title: 'Session BLR: Popping 1v1',
    description: 'Namma Cypher popping lab. Holds sit in a reserved bucket so a payment timeout cannot double-count the room.',
    city: 'Bengaluru',
    venue: 'Fandom, Koramangala',
    startTime: '2026-09-06T19:00:00+05:30',
    posterUrl: poster('photo-1508700929628-666bc8bd84ea'),
    organizerSlug: 'namma-cypher',
    styles: ['Popping'],
    tags: ['Popping', '1v1'],
    eventType: 'battle',
    spotsConfirmed: 22,
    spotsCapacity: 32,
    featured: true,
    priceMinor: 39900,
    categoryName: 'Popping 1v1',
  },
  {
    slug: 'pune-street-wars-26',
    title: 'Pune Street Wars',
    description: 'All-styles 2v2 from Deccan Rockers on the Koregaon Park floor.',
    city: 'Pune',
    venue: 'High Spirits, Koregaon Park',
    startTime: '2026-09-27T18:00:00+05:30',
    posterUrl: poster('photo-1516450360452-9312f5e86fc7'),
    organizerSlug: 'deccan-rockers',
    styles: ['Hip-Hop', 'Breaking'],
    tags: ['Hip-Hop', '2v2'],
    eventType: 'battle',
    spotsConfirmed: 54,
    spotsCapacity: 80,
    priceMinor: 59900,
    categoryName: 'All-styles 2v2',
  },
  {
    slug: 'lock-and-key-mumbai',
    title: 'Lock & Key Mumbai',
    description: 'Locking showcase at NCPA Experimental Theatre.',
    city: 'Mumbai',
    venue: 'NCPA Experimental Theatre',
    startTime: '2026-10-04T16:30:00+05:30',
    posterUrl: poster('photo-1524368535928-5b5e00ddc76b'),
    organizerSlug: 'soul-smashers',
    styles: ['Locking'],
    tags: ['Locking'],
    eventType: 'showcase',
    spotsConfirmed: 110,
    spotsCapacity: 180,
    priceMinor: 69900,
    categoryName: 'Locking showcase',
  },
  {
    slug: 'house-of-koramangala',
    title: 'House of Koramangala',
    description: 'Jackin’ night. Free entry, live spots from confirmed vs capacity.',
    city: 'Bengaluru',
    venue: 'Gilly’s Redefined, Koramangala',
    startTime: '2026-10-11T20:00:00+05:30',
    posterUrl: poster('photo-1470225620780-dba8ba36b745'),
    organizerSlug: 'flynamic',
    styles: ['House'],
    tags: ['House', 'Open Cypher'],
    eventType: 'jam',
    spotsConfirmed: 36,
    spotsCapacity: 70,
    priceMinor: 0,
    categoryName: 'Open floor',
  },
  {
    slug: 'waack-attack-delhi',
    title: 'Waack Attack Delhi',
    description: 'Waacking 1v1 at OddBird Theatre.',
    city: 'Delhi',
    venue: 'OddBird Theatre, Chhatarpur',
    startTime: '2026-10-18T17:30:00+05:30',
    posterUrl: poster('photo-1514525253161-7a46d19cd819'),
    organizerSlug: 'body-carnival',
    styles: ['Waacking'],
    tags: ['Waacking', '1v1'],
    eventType: 'battle',
    spotsConfirmed: 18,
    spotsCapacity: 40,
    priceMinor: 44900,
    categoryName: 'Waacking 1v1',
  },
  {
    slug: 'deccan-krump-night',
    title: 'Deccan Krump Night',
    description: 'Krump session on the High Spirits backlot.',
    city: 'Pune',
    venue: 'High Spirits Backlot',
    startTime: '2026-09-14T19:30:00+05:30',
    posterUrl: poster('photo-1429962714451-bb93442d0a21'),
    organizerSlug: 'deccan-rockers',
    styles: ['Krump'],
    tags: ['Krump', 'Open Cypher'],
    eventType: 'jam',
    spotsConfirmed: 28,
    spotsCapacity: 40,
    priceMinor: 29900,
    categoryName: 'Krump session',
  },
  {
    slug: 'bboy-gully-dharavi-open',
    title: 'B-Boy Gully — Dharavi Open',
    description: 'Open cypher. Room is at confirmed capacity — waitlist from here.',
    city: 'Mumbai',
    venue: 'Dharavi Art Room',
    startTime: '2026-09-07T16:00:00+05:30',
    posterUrl: poster('photo-1504609813442-a8924e83f76e'),
    organizerSlug: 'mumbai-city-breakers',
    styles: ['Breaking'],
    tags: ['Breaking', 'Open Cypher'],
    eventType: 'jam',
    spotsConfirmed: 40,
    spotsCapacity: 40,
    priceMinor: 0,
    categoryName: 'Open cypher',
  },
  {
    slug: 'hustle-jam-bengaluru',
    title: 'Hustle Jam Bengaluru',
    description: 'Hip-Hop 2v2 at Toit Brewery.',
    city: 'Bengaluru',
    venue: 'Toit Brewery, Indiranagar',
    startTime: '2026-09-21T18:00:00+05:30',
    posterUrl: poster('photo-1493225457124-a3eb161ffa5f'),
    organizerSlug: 'the-groovers',
    styles: ['Hip-Hop'],
    tags: ['Hip-Hop', '2v2'],
    eventType: 'battle',
    spotsConfirmed: 44,
    spotsCapacity: 60,
    priceMinor: 54900,
    categoryName: 'Hip-Hop 2v2',
  },
  {
    slug: 'westside-popping-lab',
    title: 'Westside Popping Lab',
    description: 'Technique workshop. Small room, live capacity.',
    city: 'Mumbai',
    venue: 'Danceworx Andheri',
    startTime: '2026-09-13T11:00:00+05:30',
    posterUrl: poster('photo-1518834107812-67b0b7c58434'),
    organizerSlug: 'soul-smashers',
    styles: ['Popping'],
    tags: ['Popping', 'Workshop'],
    eventType: 'workshop',
    spotsConfirmed: 14,
    spotsCapacity: 24,
    priceMinor: 149900,
    categoryName: 'Popping lab',
  },
  {
    slug: 'ncr-all-styles-throwdown',
    title: 'NCR All-Styles Throwdown',
    description: 'Crew 2v2 under the Sunder Nursery pavilion.',
    city: 'Delhi',
    venue: 'Sunder Nursery Pavilion',
    startTime: '2026-11-01T16:00:00+05:30',
    posterUrl: poster('photo-1459749411177-04aa7c0d2e66'),
    organizerSlug: 'old-school-delhi',
    styles: ['Hip-Hop', 'Popping', 'Breaking'],
    tags: ['Hip-Hop', '2v2', 'Open Cypher'],
    eventType: 'battle',
    spotsConfirmed: 62,
    spotsCapacity: 120,
    priceMinor: 64900,
    categoryName: 'Crew 2v2',
  },
];

async function main() {
  await prisma.profile.upsert({
    where: { id: SEED_USER_ID },
    create: { id: SEED_USER_ID, name: 'Seed Organizer', dancerName: 'Cypher', city: 'Mumbai' },
    update: { name: 'Seed Organizer' },
  });

  const organizerIds = new Map<string, string>();
  for (const org of organizers) {
    const row = await prisma.organizer.upsert({
      where: { slug: org.slug },
      create: {
        orgName: org.orgName,
        slug: org.slug,
        city: org.city,
        verificationStatus: OrganizerVerificationStatus.verified,
        createdById: SEED_USER_ID,
      },
      update: {
        orgName: org.orgName,
        city: org.city,
        verificationStatus: OrganizerVerificationStatus.verified,
      },
    });
    organizerIds.set(org.slug, row.id);
    await prisma.organizerMember.upsert({
      where: { organizerId_userId: { organizerId: row.id, userId: SEED_USER_ID } },
      create: { organizerId: row.id, userId: SEED_USER_ID, role: OrganizerMemberRole.owner },
      update: { role: OrganizerMemberRole.owner },
    });
  }

  for (const item of events) {
    const organizerId = organizerIds.get(item.organizerSlug);
    if (!organizerId) {
      throw new Error(`Missing organizer ${item.organizerSlug}`);
    }
    const event = await prisma.event.upsert({
      where: { slug: item.slug },
      create: {
        organizerId,
        slug: item.slug,
        title: item.title,
        description: item.description,
        eventType: item.eventType,
        city: item.city,
        venue: item.venue,
        startTime: new Date(item.startTime),
        posterUrl: item.posterUrl,
        tags: item.tags,
        styles: item.styles,
        featured: item.featured ?? false,
        status: EventStatus.published,
      },
      update: {
        organizerId,
        title: item.title,
        description: item.description,
        eventType: item.eventType,
        city: item.city,
        venue: item.venue,
        startTime: new Date(item.startTime),
        posterUrl: item.posterUrl,
        tags: item.tags,
        styles: item.styles,
        featured: item.featured ?? false,
        status: EventStatus.published,
      },
    });

    await prisma.eventCategory.deleteMany({ where: { eventId: event.id } });
    await prisma.eventCategory.create({
      data: {
        eventId: event.id,
        name: item.categoryName,
        priceMinor: item.priceMinor,
        capacity: item.spotsCapacity,
        reservedCount: 0,
        confirmedCount: item.spotsConfirmed,
        teamSize: item.categoryName.includes('2v2') ? 2 : 1,
      },
    });
  }

  console.log(`Seeded ${String(events.length)} published events.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
