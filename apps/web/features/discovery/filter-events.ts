import type { EventCardDto } from '@cypher/contracts';

export type DiscoverFilters = {
  q?: string | null;
  city?: string | null;
  tag?: string | null;
  type?: string | null;
};

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
    if (tag && !event.tags.includes(tag) && !event.styles.includes(tag)) {
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
