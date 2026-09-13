import type { EventType } from '@cypher/contracts';

/** Primary “What’s happening?” choices for Organizer V2 create. */
export const CREATE_TYPE_OPTIONS: Array<{
  id: string;
  label: string;
  hint: string;
  eventType: EventType;
  path: 'free' | 'battle' | 'workshop' | 'other';
  image: string;
}> = [
  {
    id: 'battle',
    label: 'Battle',
    hint: 'Competition formats, spots, and audience later.',
    eventType: 'battle',
    path: 'battle',
    image: '/organize/create/battle.png',
  },
  {
    id: 'jam-cypher',
    label: 'Jam / Cypher',
    hint: 'Open floor. Put it up fast — entry optional later.',
    eventType: 'cypher',
    path: 'free',
    image: '/organize/create/jam.png',
  },
  {
    id: 'workshop',
    label: 'Workshop',
    hint: 'Learning night. Free or paid entry later.',
    eventType: 'workshop',
    path: 'workshop',
    image: '/organize/create/workshop.png',
  },
  {
    id: 'session',
    label: 'Session',
    hint: 'Practice block with the crew.',
    eventType: 'session',
    path: 'free',
    image: '/organize/create/session.png',
  },
  {
    id: 'other',
    label: 'Other',
    hint: 'Doesn’t fit the list — still a night.',
    eventType: 'other',
    path: 'other',
    image: '/organize/create/other.png',
  },
];
