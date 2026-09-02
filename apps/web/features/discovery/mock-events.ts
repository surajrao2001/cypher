export const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune'] as const;

export type City = (typeof CITIES)[number];

export const DANCE_STYLES = [
  'Breaking',
  'Hip-Hop',
  'Popping',
  'Locking',
  'House',
  'Waacking',
  'Krump',
] as const;

export type DanceStyle = (typeof DANCE_STYLES)[number];

export const EVENT_TYPES = ['battle', 'jam', 'workshop', 'showcase'] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const FOR_YOU_TAGS = [
  'Breaking',
  'Hip-Hop',
  'Popping',
  'Locking',
  'House',
  'Waacking',
  'Krump',
  '1v1',
  '2v2',
  'Open Cypher',
  'Workshop',
] as const;

export type ForYouTag = (typeof FOR_YOU_TAGS)[number];

export interface MockNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  href: string;
}

export const mockNotifications: MockNotification[] = [
  {
    id: 'ntf_1',
    title: 'Delhi Break League is almost full',
    body: '5 spots left in Breaking 1v1 — finals week at Hangar 9.',
    time: '12m ago',
    unread: true,
    href: '/events/delhi-break-league-monsoon-finals',
  },
  {
    id: 'ntf_2',
    title: 'Payment confirmed · Andheri Cypher',
    body: 'Your ticket for Vol. 18 is in Tickets. Floor opens 6:30pm.',
    time: '2h ago',
    unread: true,
    href: '/tickets',
  },
  {
    id: 'ntf_3',
    title: 'Session BLR: judges posted',
    body: 'Namma Cypher locked the popping panel. Check the event page.',
    time: 'Yesterday',
    unread: false,
    href: '/events/session-blr-popping-1v1',
  },
];

import { spotsLeft } from '@cypher/utils';

export function spotsTone(
  confirmed: number,
  capacity: number,
): { label: string; className: string } {
  const left = spotsLeft(capacity, confirmed);
  if (left === 0) {
    return { label: `Waitlist · 0 / ${String(capacity)} spots left`, className: 'text-error' };
  }
  if (left <= 8) {
    return {
      label: `${String(left)} / ${String(capacity)} spots left`,
      className: 'text-warning',
    };
  }
  return {
    label: `${String(left)} / ${String(capacity)} spots left`,
    className: 'text-accent-2',
  };
}
