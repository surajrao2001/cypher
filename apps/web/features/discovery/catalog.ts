import { spotsLeft } from '@cypher/utils';

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
