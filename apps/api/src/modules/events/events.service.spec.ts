import { EventStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';

function eventRow(
  overrides?: Partial<{
    slug: string;
    title: string;
    city: string;
    featured: boolean;
    tags: string[];
    styles: string[];
    eventType: string;
  }>,
) {
  const styles = overrides?.styles ?? ['Breaking'];
  return {
    id: '11111111-1111-4111-8111-111111111111',
    slug: overrides?.slug ?? 'andheri-cypher-vol-18',
    title: overrides?.title ?? 'Andheri Cypher Vol. 18',
    description: 'Floor night',
    eventType: overrides?.eventType ?? 'battle',
    city: overrides?.city ?? 'Mumbai',
    venue: 'The Hive',
    startTime: new Date('2026-09-12T13:00:00.000Z'),
    endTime: null,
    registrationOpensAt: null,
    registrationClosesAt: null,
    posterUrl: 'https://images.unsplash.com/photo-1547153760-18fc8632442f',
    tags: overrides?.tags ?? ['Breaking', '1v1'],
    featured: overrides?.featured ?? true,
    status: EventStatus.published,
    organizer: { orgName: 'Mumbai City Breakers', slug: 'mumbai-city-breakers' },
    danceStyles: styles.map((name, index) => ({
      style: { id: `style-${String(index)}`, slug: name.toLowerCase(), name },
    })),
    categories: [
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Breaking 1v1',
        priceMinor: 49900,
        capacity: 64,
        reservedCount: 0,
        confirmedCount: 48,
        teamSize: 1,
        entryType: 'solo',
        minTeamSize: 1,
        maxTeamSize: 1,
      },
    ],
  };
}

describe('EventsService', () => {
  const prisma = {
    event: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  const service = new EventsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists published events with summed category capacity', async () => {
    prisma.event.count.mockResolvedValue(1);
    prisma.event.findMany.mockResolvedValue([eventRow()]);

    const result = await service.list({ page: 1, pageSize: 20 });

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      slug: 'andheri-cypher-vol-18',
      spotsConfirmed: 48,
      spotsCapacity: 64,
      priceMinor: 49900,
      organizerName: 'Mumbai City Breakers',
      styles: ['Breaking'],
    });
    expect(prisma.event.findMany).toHaveBeenCalled();
  });

  it('filters by city, tag, and type', async () => {
    prisma.event.count.mockResolvedValue(0);
    prisma.event.findMany.mockResolvedValue([]);

    await service.list({ city: 'Mumbai', tag: 'Breaking', type: 'battle', page: 1, pageSize: 20 });

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ city: 'Mumbai' }),
            expect.objectContaining({ eventType: 'battle' }),
          ]),
        }),
      }),
    );
  });

  it('loads detail by slug', async () => {
    prisma.event.findFirst.mockResolvedValue(eventRow());
    const detail = await service.getBySlugOrId('andheri-cypher-vol-18');
    expect(detail.categories[0]?.capacity).toBe(64);
  });

  it('404s unknown events', async () => {
    prisma.event.findFirst.mockResolvedValue(null);
    await expect(service.getBySlugOrId('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
