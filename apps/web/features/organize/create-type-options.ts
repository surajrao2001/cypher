import type { EventType } from '@cypher/contracts';

/** Primary “What’s happening?” choices for Organizer V2 create. */
export const CREATE_TYPE_OPTIONS: Array<{
  id: string;
  label: string;
  hint: string;
  eventType: EventType;
  path: 'free' | 'battle' | 'workshop' | 'other';
}> = [
  {
    id: 'battle',
    label: 'Battle',
    hint: 'Competition formats, spots, and audience later.',
    eventType: 'battle',
    path: 'battle',
  },
  {
    id: 'jam-cypher',
    label: 'Jam / Cypher',
    hint: 'Open floor. Put it up fast — entry optional later.',
    eventType: 'cypher',
    path: 'free',
  },
  {
    id: 'workshop',
    label: 'Workshop',
    hint: 'Learning night. Free or paid entry later.',
    eventType: 'workshop',
    path: 'workshop',
  },
  {
    id: 'session',
    label: 'Session',
    hint: 'Practice block with the crew.',
    eventType: 'session',
    path: 'free',
  },
  {
    id: 'other',
    label: 'Other',
    hint: 'Doesn’t fit the list — still a night.',
    eventType: 'other',
    path: 'other',
  },
];
