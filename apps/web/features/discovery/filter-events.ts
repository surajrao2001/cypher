import type { EventCardDto } from '@cypher/contracts';

import { normalizeStyleLabel } from '@/features/organize/event-taxonomy';

export type DiscoverFilters = {
  q?: string | null;
  city?: string | null;
  tag?: string | null;
  type?: string | null;
};

function styleMatches(tag: string, styles: string[], tags: string[]): boolean {
  if (tags.includes(tag) || styles.includes(tag)) return true;
  const normalized = normalizeStyleLabel(tag).toLowerCase();
  return (
    styles.some((s) => normalizeStyleLabel(s).toLowerCase() === normalized) ||
    tags.some((t) => normalizeStyleLabel(t).toLowerCase() === normalized)
  );
}

export function applyDiscoverFilters(events: EventCardDto[], filters: DiscoverFilters): EventCardDto[] {
  const q = filters.q?.trim().toLowerCase();
  const city = filters.city?.trim();
  const tag = filters.tag?.trim();
  const type = filters.type?.trim();

  return events.filter((event) => {
    if (city && city !== 'all' && event.city !== city) {
      return false;
    }
    if (type && type !== 'all' && event.eventType !== type) {
      return false;
    }
    if (tag && !styleMatches(tag, event.styles, event.tags)) {
      return false;
    }
    if (q) {
      const haystack = [
        event.title,
        event.city,
        event.venue ?? '',
        event.organizerName,
        event.crew,
        event.kicker,
        ...event.styles,
        ...event.tags,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }
    return true;
  });
}

export function featuredForFilters(events: EventCardDto[], filters: DiscoverFilters): EventCardDto[] {
  const byCityAndQuery = applyDiscoverFilters(events, { q: filters.q, city: filters.city });
  const featured = byCityAndQuery.filter((event) => event.featured);
  return featured.length > 0 ? featured : byCityAndQuery.slice(0, 3);
}

export function nextUpForFilters(events: EventCardDto[], limit = 5): EventCardDto[] {
  return [...events]
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, limit);
}
