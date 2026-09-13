import type { EventType, OrganizerEventDetailDto } from '@cypher/contracts';

/** Guidance group — maps schema EventType → organizer UX emphasis. */
export type EventTypeGroup = 'battle' | 'jam' | 'workshop' | 'session' | 'other';

export function eventTypeGroup(eventType: string): EventTypeGroup {
  switch (eventType) {
    case 'battle':
    case 'competition':
    case 'audition':
      return 'battle';
    case 'cypher':
    case 'jam':
    case 'showcase':
      return 'jam';
    case 'workshop':
      return 'workshop';
    case 'session':
    case 'camp':
      return 'session';
    default:
      return 'other';
  }
}

export function eventTypeDisplayLabel(eventType: string): string {
  switch (eventTypeGroup(eventType)) {
    case 'battle':
      return 'Battle';
    case 'jam':
      return 'Jam / Cypher';
    case 'workshop':
      return 'Workshop';
    case 'session':
      return 'Session';
    default:
      return eventType === 'other' ? 'Other' : eventType.charAt(0).toUpperCase() + eventType.slice(1);
  }
}

export function hasAnyEntry(event: Pick<OrganizerEventDetailDto, 'categories'>): boolean {
  return (event.categories ?? []).length > 0;
}

export type EntryCopy = {
  competeTitle: string;
  audienceTitle: string;
  addCompete: string;
  addAudience: string;
  emptyCompeteTitle: string;
  emptyCompeteBody: string;
  /** Home Entry dest card when empty */
  emptyEntryHome: string;
  /** Home Entry dest when configured */
  entryHomeSummary: (compete: number, audience: number) => string;
  /** Suggested next action on home when empty */
  suggestEntryTitle: string | null;
  suggestEntryBody: string | null;
  noEntrySummary: string | null;
};

export function entryCopyForType(eventType: string): EntryCopy {
  switch (eventTypeGroup(eventType)) {
    case 'battle':
      return {
        competeTitle: 'Competition',
        audienceTitle: 'Audience',
        addCompete: '+ Add competition',
        addAudience: '+ Add audience pass',
        emptyCompeteTitle: 'No competition yet',
        emptyCompeteBody: 'Add formats so people can compete.',
        emptyEntryHome: 'Get competition ready',
        entryHomeSummary: (c, a) => `${String(c)} competition · ${String(a)} audience`,
        suggestEntryTitle: 'Entry',
        suggestEntryBody: 'Get your competition ready.',
        noEntrySummary: null,
      };
    case 'workshop':
      return {
        competeTitle: 'Workshop pass',
        audienceTitle: 'Audience',
        addCompete: '+ Add pass',
        addAudience: '+ Add audience pass',
        emptyCompeteTitle: 'No pass yet',
        emptyCompeteBody: 'Add a workshop pass so people can register.',
        emptyEntryHome: 'Add workshop pass',
        entryHomeSummary: (c, a) =>
          a > 0 ? `${String(c)} pass · ${String(a)} audience` : `${String(c)} pass`,
        suggestEntryTitle: 'Entry',
        suggestEntryBody: 'Add a pass for the class.',
        noEntrySummary: null,
      };
    case 'jam':
      return {
        competeTitle: 'General entry',
        audienceTitle: 'Audience',
        addCompete: '+ Add entry',
        addAudience: '+ Add audience pass',
        emptyCompeteTitle: 'No entry yet',
        emptyCompeteBody: 'Optional — limit spots or charge if you need to.',
        emptyEntryHome: 'Optional entry',
        entryHomeSummary: (c, a) =>
          a > 0 ? `${String(c)} entry · ${String(a)} audience` : `${String(c)} entry`,
        suggestEntryTitle: null,
        suggestEntryBody: null,
        noEntrySummary: 'No registration needed.',
      };
    case 'session':
      return {
        competeTitle: 'General entry',
        audienceTitle: 'Audience',
        addCompete: '+ Add entry',
        addAudience: '+ Add audience pass',
        emptyCompeteTitle: 'No entry yet',
        emptyCompeteBody: 'Optional — add entry if you need capacity or payment.',
        emptyEntryHome: 'Optional entry',
        entryHomeSummary: (c, a) =>
          a > 0 ? `${String(c)} entry · ${String(a)} audience` : `${String(c)} entry`,
        suggestEntryTitle: null,
        suggestEntryBody: null,
        noEntrySummary: 'No registration needed.',
      };
    default:
      return {
        competeTitle: 'Entry',
        audienceTitle: 'Audience',
        addCompete: '+ Add entry',
        addAudience: '+ Add audience pass',
        emptyCompeteTitle: 'No entry yet',
        emptyCompeteBody: 'Optional — add entry when people need to register.',
        emptyEntryHome: 'Optional entry',
        entryHomeSummary: (c, a) =>
          a > 0 ? `${String(c)} entry · ${String(a)} audience` : `${String(c)} entry`,
        suggestEntryTitle: null,
        suggestEntryBody: null,
        noEntrySummary: 'No registration needed.',
      };
  }
}

export type CardMetric = {
  primary: string;
  secondary: string;
};

/** Your Events card metric — only from existing category counts. */
export function yourEventsCardMetric(event: {
  eventType: EventType | string;
  categories?: Array<{ capacity: number; confirmedCount: number; reservedCount?: number }>;
}): CardMetric {
  const cats = event.categories ?? [];
  const confirmed = cats.reduce((n, c) => n + c.confirmedCount, 0);
  const capacity = cats.reduce((n, c) => n + c.capacity, 0);
  const group = eventTypeGroup(event.eventType);

  if (cats.length === 0) {
    if (group === 'jam' || group === 'session' || group === 'other') {
      return { primary: 'Open', secondary: 'No registration needed' };
    }
    return { primary: '0', secondary: 'registered' };
  }

  if (group === 'workshop' && capacity > 0) {
    return { primary: `${String(confirmed)} / ${String(capacity)}`, secondary: 'spots' };
  }

  return { primary: String(confirmed), secondary: 'registered' };
}
