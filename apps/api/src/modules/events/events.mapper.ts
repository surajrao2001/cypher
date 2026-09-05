import type { EventCategory, Event, Organizer, Prisma } from '@prisma/client';
import type { EventCardDto, EventDetailDto, OrganizerEventDetailDto } from './events.types';

export const eventInclude = {
  organizer: true,
  categories: { orderBy: { name: 'asc' as const } },
  danceStyles: {
    include: { style: true },
    orderBy: { style: { name: 'asc' as const } },
  },
} satisfies Prisma.EventInclude;

export type EventRecord = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

function styleNames(event: EventRecord): string[] {
  return event.danceStyles.map((row) => row.style.name);
}

export function toEventCard(event: EventRecord): EventCardDto {
  const spotsCapacity = event.categories.reduce((sum, category) => sum + category.capacity, 0);
  const spotsConfirmed = event.categories.reduce((sum, category) => sum + category.confirmedCount, 0);
  const priceMinor = event.categories.reduce(
    (min, category) => Math.min(min, category.priceMinor),
    event.categories[0]?.priceMinor ?? 0,
  );
  const styles = styleNames(event);
  const styleLabel = styles[0];
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
    styles,
    tags: event.tags,
    featured: event.featured,
    priceMinor,
    spotsConfirmed,
    spotsCapacity,
  };
}

export function toEventDetail(event: EventRecord): EventDetailDto {
  return {
    ...toEventCard(event),
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
      entryType: category.entryType,
      minTeamSize: category.minTeamSize,
      maxTeamSize: category.maxTeamSize,
      teamSize: category.maxTeamSize,
    })),
  };
}

export function toOrganizerEventDetail(event: EventRecord): OrganizerEventDetailDto {
  return {
    ...toEventDetail(event),
    organizerId: event.organizerId,
  };
}

export type { Event, EventCategory, Organizer };
