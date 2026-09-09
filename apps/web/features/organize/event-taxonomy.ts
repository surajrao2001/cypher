import type { EventType, OrganizerType } from '@cypher/contracts';

export const ORGANIZER_TYPE_OPTIONS: Array<{ value: OrganizerType; label: string; hint: string }> = [
  { value: 'independent', label: 'Independent', hint: 'Solo organizer or freestyle crew lead' },
  { value: 'collective', label: 'Collective / crew', hint: 'Named crew or collective' },
  { value: 'college', label: 'College', hint: 'Campus club or fest' },
  { value: 'studio', label: 'Studio', hint: 'Dance studio or academy' },
  { value: 'community', label: 'Community', hint: 'City scene / non-profit style' },
  { value: 'other', label: 'Other', hint: 'Doesn’t fit the list' },
];

export type EventTypeGroupId = 'competition' | 'practice' | 'learning' | 'performance' | 'other';

export const EVENT_TYPE_GROUPS: Array<{
  id: EventTypeGroupId;
  label: string;
  types: Array<{ value: EventType; label: string; hint: string }>;
}> = [
  {
    id: 'competition',
    label: 'Competition',
    types: [
      {
        value: 'battle',
        label: 'Battle',
        hint: '1v1 / crew formats, prelims, points — for the win',
      },
      {
        value: 'competition',
        label: 'Competition',
        hint: 'Broader contested night (not only battle rounds)',
      },
      {
        value: 'audition',
        label: 'Audition',
        hint: 'Tryouts / cuts — foundation check energy',
      },
    ],
  },
  {
    id: 'practice',
    label: 'Practice / open floor',
    types: [
      {
        value: 'jam',
        label: 'Jam',
        hint: 'Open floor energy — freestyle, props, no trophy pressure',
      },
      {
        value: 'cypher',
        label: 'Cypher',
        hint: 'Open circle. Take turns freestyling. No judges. Just respect.',
      },
      {
        value: 'session',
        label: 'Session',
        hint: 'Practice / training block with the crew',
      },
    ],
  },
  {
    id: 'learning',
    label: 'Learning',
    types: [
      {
        value: 'workshop',
        label: 'Workshop',
        hint: 'Build vocabulary — sets, freestyle, get-downs',
      },
      {
        value: 'camp',
        label: 'Camp',
        hint: 'Multi-day learning — pacing, presence, composure',
      },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    types: [
      {
        value: 'showcase',
        label: 'Showcase / exhibition',
        hint: 'For the culture, not the trophy — exhibition energy',
      },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    types: [{ value: 'other', label: 'Other', hint: 'Doesn’t fit the list — still a night' }],
  },
];

export const ALL_EVENT_TYPES: EventType[] = EVENT_TYPE_GROUPS.flatMap((g) =>
  g.types.map((t) => t.value),
);

export function eventTypeGroupId(type: EventType): EventTypeGroupId {
  for (const group of EVENT_TYPE_GROUPS) {
    if (group.types.some((t) => t.value === type)) return group.id;
  }
  return 'other';
}

export function eventTypeHint(type: EventType): string | undefined {
  for (const group of EVENT_TYPE_GROUPS) {
    const hit = group.types.find((t) => t.value === type);
    if (hit) return hit.hint;
  }
  return undefined;
}

/** Normalize Discover filter chips to DanceStyle seed names. */
export function normalizeStyleLabel(raw: string): string {
  const trimmed = raw.trim();
  if (/^hip[-\s]?hop$/i.test(trimmed)) return 'Hip Hop';
  return trimmed;
}
