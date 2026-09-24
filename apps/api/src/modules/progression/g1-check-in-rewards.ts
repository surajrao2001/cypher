/**
 * G1 check-in progression rules (centralized — not a generic rules engine).
 * Values from BYND8_PHASE_G_BATTLE_DAY_PRD: +40 attendance, +25 early.
 */
export const G1_CHECK_IN_RULES = {
  COMPETITOR_CHECK_IN: {
    ruleKey: 'COMPETITOR_CHECK_IN',
    amount: 40,
    ruleVersion: 1,
  },
  EARLY_CHECK_IN: {
    ruleKey: 'EARLY_CHECK_IN',
    amount: 25,
    ruleVersion: 1,
  },
} as const;

export type G1CheckInRuleKey = keyof typeof G1_CHECK_IN_RULES;

export function competitorCheckInIdempotencyKey(eventId: string, userId: string): string {
  return `COMPETITOR_CHECK_IN:event:${eventId}:user:${userId}:v1`;
}

export function earlyCheckInIdempotencyKey(eventId: string, userId: string): string {
  return `EARLY_CHECK_IN:event:${eventId}:user:${userId}:v1`;
}
