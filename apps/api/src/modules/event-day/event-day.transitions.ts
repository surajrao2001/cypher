import type { EventOpsStatus } from '@prisma/client';

/**
 * Explicit G1 ops-status transition map (not enum ordinal comparison).
 * Same-status requests are treated as idempotent no-ops in the service.
 */
export const EVENT_OPS_TRANSITIONS: Record<EventOpsStatus, readonly EventOpsStatus[]> = {
  scheduled: ['check_in_open'],
  check_in_open: ['check_in_closed', 'scheduled'],
  check_in_closed: ['event_live', 'check_in_open'],
  event_live: ['completed', 'check_in_closed'],
  completed: [],
};

export function canTransitionOpsStatus(from: EventOpsStatus, to: EventOpsStatus): boolean {
  if (from === to) return true;
  return EVENT_OPS_TRANSITIONS[from].includes(to);
}
