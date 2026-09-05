import { createApiClient } from '@cypher/api-client';
import type { EventCardDto, EventDetailDto } from '@cypher/contracts';

import type { MockEvent } from '@/lib/mock-events';

export function apiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export function toMobileEvent(event: EventCardDto, description = ''): MockEvent {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    city: event.city,
    venue: event.venue ?? event.city,
    startTime: event.startTime,
    styles: event.styles,
    spotsConfirmed: event.spotsConfirmed,
    spotsCapacity: event.spotsCapacity,
    priceMinor: event.priceMinor,
    featured: event.featured,
    organizerName: event.organizerName,
    description,
    posterTone: event.featured ? 'orange' : 'lime',
    posterUrl: event.posterUrl,
  };
}

export function toMobileDetail(event: EventDetailDto): MockEvent {
  return {
    ...toMobileEvent(event, event.description ?? ''),
    categories: event.categories.map((category) => ({
      id: category.id,
      name: category.name,
      priceMinor: category.priceMinor,
      capacity: category.capacity,
      reservedCount: category.reservedCount,
      confirmedCount: category.confirmedCount,
      minTeamSize: category.minTeamSize,
      maxTeamSize: category.maxTeamSize,
    })),
  };
}

export function mobileApi() {
  return createApiClient({ baseUrl: apiBaseUrl() });
}
