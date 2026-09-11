import { spotsLeft } from '@cypher/utils';
import type { EventType } from '@cypher/contracts';

import { EVENT_TYPE_GROUPS, normalizeStyleLabel } from '@/features/organize/event-taxonomy';

export const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'] as const;

export type City = (typeof CITIES)[number];

export const DANCE_STYLES = [
  'Breaking',
  'Hip Hop',
  'Popping',
  'Locking',
  'House',
  'Waacking',
  'Krump',
] as const;

export type DanceStyle = (typeof DANCE_STYLES)[number];

export const EVENT_TYPES = EVENT_TYPE_GROUPS.flatMap((g) => g.types.map((t) => t.value));

export type { EventType };

export const EVENT_TYPE_FILTER_GROUPS = EVENT_TYPE_GROUPS.filter((g) => g.id !== 'other');

export const FOR_YOU_TAGS = [
  'Breaking',
  'Hip Hop',
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

export function normalizeDiscoverStyle(tag: string): string {
  return normalizeStyleLabel(tag);
}

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
