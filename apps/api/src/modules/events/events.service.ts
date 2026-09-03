import { Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus, EventType, type Prisma } from '@prisma/client';
import { slugifyStyleName } from '../../common/dance-styles';
import { PrismaService } from '../../common/prisma.service';
import { normalizeDiscoveryQuery, type EventDiscoveryQueryDto } from './events.dto';
import { eventInclude, toEventCard, toEventDetail } from './events.mapper';
import type { EventListResponse, EventDetailDto } from './events.types';

const LIST_STATUSES: EventStatus[] = [EventStatus.published, EventStatus.registration_closed];
const DETAIL_STATUSES: EventStatus[] = [
  EventStatus.published,
  EventStatus.registration_closed,
  EventStatus.completed,
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EVENT_TYPES = new Set<string>(Object.values(EventType));

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
      items: rows.map(toEventCard),
      featured: featuredRows.map(toEventCard),
      nextUp: nextUpRows.map(toEventCard),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  async getBySlugOrId(slugOrId: string): Promise<EventDetailDto> {
    const event = await this.prisma.event.findFirst({
      where: {
        status: { in: DETAIL_STATUSES },
        ...(isUuid(slugOrId) ? { OR: [{ slug: slugOrId }, { id: slugOrId }] } : { slug: slugOrId }),
      },
      include: eventInclude,
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return toEventDetail(event);
  }

  private buildWhere(filters: {
    q?: string;
    city?: string;
    tag?: string;
    type?: string;
  }): Prisma.EventWhereInput {
    const and: Prisma.EventWhereInput[] = [{ status: { in: LIST_STATUSES } }];
    if (filters.city) {
      and.push({ city: filters.city });
    }
    if (filters.type && EVENT_TYPES.has(filters.type)) {
      and.push({ eventType: filters.type as EventType });
    }
    if (filters.tag) {
      const slug = slugifyStyleName(filters.tag);
      and.push({
        OR: [
          { tags: { has: filters.tag } },
          {
            danceStyles: {
              some: {
                style: {
                  OR: [{ name: { equals: filters.tag, mode: 'insensitive' } }, { slug }],
                },
              },
            },
          },
        ],
      });
    }
    if (filters.q) {
      const search = { contains: filters.q, mode: 'insensitive' as const };
      and.push({
        OR: [
          { title: search },
          { city: search },
          { venue: search },
          { organizer: { is: { orgName: search } } },
          {
            danceStyles: {
              some: { style: { name: search } },
            },
          },
        ],
      });
    }
    return { AND: and };
  }
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
