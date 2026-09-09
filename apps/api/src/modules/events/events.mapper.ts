import type { EventCategory, Event, Organizer, Prisma } from '@prisma/client';
import { resolveCategoryPrice } from '../../common/category-pricing';
import type {
  EventAudiencePassDto,
  EventCardDto,
  EventCategoryPublicDto,
  EventDetailDto,
  CategoryPriceTierDto,
  EventDayDto,
  OrganizerEventDetailDto,
} from './events.types';

export const eventInclude = {
  organizer: true,
  categories: {
    orderBy: { name: 'asc' as const },
    include: {
      priceTiers: { orderBy: { sortOrder: 'asc' as const } },
      validDays: true,
    },
  },
  days: { orderBy: { sortOrder: 'asc' as const } },
  mediaLinks: { orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }] },
  danceStyles: {
    include: { style: true },
    orderBy: { style: { name: 'asc' as const } },
  },
} satisfies Prisma.EventInclude;

export type EventRecord = Prisma.EventGetPayload<{ include: typeof eventInclude }>;
type CategoryRecord = EventRecord['categories'][number];

function styleNames(event: EventRecord): string[] {
  return (event.danceStyles ?? []).map((row) => row.style.name);
}

function toTierDto(tier: CategoryRecord['priceTiers'][number]): CategoryPriceTierDto {
  return {
    id: tier.id,
    name: tier.name,
    priceMinor: tier.priceMinor,
    startsAt: tier.startsAt?.toISOString() ?? null,
    endsAt: tier.endsAt?.toISOString() ?? null,
    sortOrder: tier.sortOrder,
    maxQuantity: tier.maxQuantity,
  };
}

function toCategoryDto(category: CategoryRecord, now = new Date()): EventCategoryPublicDto {
  const tiers = category.priceTiers ?? [];
  const validDays = category.validDays ?? [];
  const resolved = resolveCategoryPrice(category.priceMinor, tiers, now);
  return {
    id: category.id,
    name: category.name,
    priceMinor: category.priceMinor,
    currentPriceMinor: resolved.priceMinor,
    capacity: category.capacity,
    reservedCount: category.reservedCount,
    confirmedCount: category.confirmedCount,
    entryType: category.entryType,
    minTeamSize: category.minTeamSize,
    maxTeamSize: category.maxTeamSize,
    teamSize: category.maxTeamSize,
    priceTiers: tiers.map(toTierDto),
    validDayIds: validDays.map((row) => row.dayId),
    activeTierName: resolved.tier?.name ?? null,
    nextTier: resolved.nextTier ? toTierDto(resolved.nextTier) : null,
  };
}

export function toAudiencePass(categories: EventCategoryPublicDto[]): EventAudiencePassDto {
  const viewer = categories.find((c) => c.entryType === 'viewer');
  if (!viewer) {
    return {
      enabled: false,
      categoryId: null,
      name: 'Viewers pass',
      priceMinor: 0,
      capacity: 0,
      reservedCount: 0,
      confirmedCount: 0,
      spotsLeft: 0,
    };
  }
  return {
    enabled: true,
    categoryId: viewer.id,
    name: viewer.name,
    priceMinor: viewer.currentPriceMinor,
    capacity: viewer.capacity,
    reservedCount: viewer.reservedCount,
    confirmedCount: viewer.confirmedCount,
    spotsLeft: Math.max(0, viewer.capacity - viewer.confirmedCount - viewer.reservedCount),
  };
}

function toDayDto(day: EventRecord['days'][number]): EventDayDto {
  return {
    id: day.id,
    label: day.label,
    startsAt: day.startsAt.toISOString(),
    endsAt: day.endsAt?.toISOString() ?? null,
    sortOrder: day.sortOrder,
  };
}

export function toEventCard(event: EventRecord): EventCardDto {
  const now = new Date();
  const mapped = event.categories.map((c) => toCategoryDto(c, now));
  const compete = mapped.filter((c) => c.entryType !== 'viewer');
  const pool = compete.length > 0 ? compete : mapped;
  const spotsCapacity = pool.reduce((sum, category) => sum + category.capacity, 0);
  const spotsConfirmed = pool.reduce((sum, category) => sum + category.confirmedCount, 0);
  const priceMinor = pool.reduce(
    (min, category) => Math.min(min, category.currentPriceMinor),
    pool[0]?.currentPriceMinor ?? 0,
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
    venueLatitude: event.venueLatitude ?? null,
    venueLongitude: event.venueLongitude ?? null,
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
  const now = new Date();
  const categories = event.categories.map((c) => toCategoryDto(c, now));
  return {
    ...toEventCard(event),
    description: event.description,
    endTime: event.endTime?.toISOString() ?? null,
    registrationOpensAt: event.registrationOpensAt?.toISOString() ?? null,
    registrationClosesAt: event.registrationClosesAt?.toISOString() ?? null,
    categories,
    competeCategories: categories.filter((c) => c.entryType !== 'viewer'),
    viewerCategories: categories.filter((c) => c.entryType === 'viewer'),
    audience: toAudiencePass(categories),
    days: (event.days ?? []).map(toDayDto),
    mediaLinks: event.mediaLinks.map((link) => ({
      id: link.id,
      eventId: link.eventId,
      categoryId: link.categoryId,
      battleId: link.battleId,
      title: link.title,
      url: link.url,
      kind: link.kind,
      sortOrder: link.sortOrder,
      createdAt: link.createdAt.toISOString(),
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
