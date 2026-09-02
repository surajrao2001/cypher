import { Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { normalizeDiscoveryQuery, type EventDiscoveryQueryDto } from './events.dto';
import type { EventCardDto, EventDetailDto, EventListResponse } from './events.types';

const LIST_STATUSES: EventStatus[] = [EventStatus.published, EventStatus.registration_closed];
const DETAIL_STATUSES: EventStatus[] = [
  EventStatus.published,
  EventStatus.registration_closed,
  EventStatus.completed,
];

const eventInclude = {
  organizer: true,
  categories: { orderBy: { name: 'asc' as const } },
} satisfies Prisma.EventInclude;

type EventRecord = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: EventDiscoveryQueryDto): Promise<EventListResponse> {
    const filters = normalizeDiscoveryQuery(query);
    const where = this.buildWhere(filters);
    const featuredWhere = this.buildWhere({ city: filters.city, q: filters.q });

    const [total, rows, featuredRows, nextUpRows] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        include: eventInclude,
        orderBy: { startTime: 'asc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.event.findMany({
        where: { ...featuredWhere, featured: true },
        include: eventInclude,
        orderBy: { startTime: 'asc' },
        take: 8,
      }),
      this.prisma.event.findMany({
        where,
        include: eventInclude,
        orderBy: { startTime: 'asc' },
        take: 5,
      }),
    ]);

    return {
      items: rows.map(toCard),
      featured: featuredRows.map(toCard),
      nextUp: nextUpRows.map(toCard),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  async getBySlugOrId(slugOrId: string): Promise<EventDetailDto> {
    const event = await this.prisma.event.findFirst({
      where: {
        status: { in: DETAIL_STATUSES },
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: eventInclude,
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return toDetail(event);
  }

  private buildWhere(filters: { q?: string; city?: string; tag?: string; type?: string }): Prisma.EventWhereInput {
    const and: Prisma.EventWhereInput[] = [{ status: { in: LIST_STATUSES } }];
    if (filters.city) {
      and.push({ city: filters.city });
    }
    if (filters.type) {
      and.push({ eventType: filters.type });
    }
    if (filters.tag) {
      and.push({ OR: [{ tags: { has: filters.tag } }, { styles: { has: filters.tag } }] });
    }
    if (filters.q) {
      const search = { contains: filters.q, mode: 'insensitive' as const };
      and.push({
        OR: [
          { title: search },
          { city: search },
          { venue: search },
          { organizer: { is: { orgName: search } } },
        ],
      });
    }
    return { AND: and };
  }
}

function toCard(event: EventRecord): EventCardDto {
  const spotsCapacity = event.categories.reduce((sum, category) => sum + category.capacity, 0);
  const spotsConfirmed = event.categories.reduce((sum, category) => sum + category.confirmedCount, 0);
  const priceMinor = event.categories.reduce(
    (min, category) => Math.min(min, category.priceMinor),
    event.categories[0]?.priceMinor ?? 0,
  );
  const styleLabel = event.styles[0];
  const kicker = styleLabel ? `${event.city} · ${styleLabel}` : `${event.city} · ${event.eventType}`;

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    kicker,
    city: event.city,
    venue: event.venue,
    startTime: event.startTime.toISOString(),
    posterUrl: event.posterUrl,
    status: event.status,
    eventType: event.eventType,
    organizerName: event.organizer.orgName,
    organizerSlug: event.organizer.slug,
    crew: event.organizer.orgName,
    styles: event.styles,
    tags: event.tags,
    featured: event.featured,
    priceMinor,
    spotsConfirmed,
    spotsCapacity,
  };
}

function toDetail(event: EventRecord): EventDetailDto {
  return {
    ...toCard(event),
    description: event.description,
    endTime: event.endTime?.toISOString() ?? null,
    registrationOpensAt: event.registrationOpensAt?.toISOString() ?? null,
    registrationClosesAt: event.registrationClosesAt?.toISOString() ?? null,
    categories: event.categories.map((category) => ({
      id: category.id,
      name: category.name,
      priceMinor: category.priceMinor,
      capacity: category.capacity,
      reservedCount: category.reservedCount,
      confirmedCount: category.confirmedCount,
      teamSize: category.teamSize,
    })),
  };
}
