import { Injectable } from '@nestjs/common';
import { Prisma, XpRewardScope, XpSourceType, type PrismaClient } from '@prisma/client';
import {
  competitorCheckInIdempotencyKey,
  earlyCheckInIdempotencyKey,
  G1_CHECK_IN_RULES,
} from './g1-check-in-rewards';

type Tx = Prisma.TransactionClient | PrismaClient;

export type EventDayProgressionSummary = {
  attendanceXp: number;
  earlyCheckInXp: number;
  totalEventDayXp: number;
};

@Injectable()
export class ProgressionService {
  /**
   * Ensure EVENT-scoped G1 check-in rewards for eligible users.
   * IdempotencyKey uniqueness is authoritative; expected P2002 is treated as already-awarded.
   */
  async ensureG1CheckInRewards(
    tx: Tx,
    input: {
      eventId: string;
      checkInId: string;
      eligibleUserIds: string[];
      earlyEligible: boolean;
    },
  ): Promise<void> {
    for (const userId of input.eligibleUserIds) {
      await this.ensureRule(tx, {
        userId,
        eventId: input.eventId,
        checkInId: input.checkInId,
        rule: G1_CHECK_IN_RULES.COMPETITOR_CHECK_IN,
        idempotencyKey: competitorCheckInIdempotencyKey(input.eventId, userId),
      });
      if (input.earlyEligible) {
        await this.ensureRule(tx, {
          userId,
          eventId: input.eventId,
          checkInId: input.checkInId,
          rule: G1_CHECK_IN_RULES.EARLY_CHECK_IN,
          idempotencyKey: earlyCheckInIdempotencyKey(input.eventId, userId),
        });
      }
    }
  }

  /** Authoritative event-day XP state for one dancer (ignores fully reversed earns). */
  async getEventDayProgression(
    tx: Tx,
    eventId: string,
    userId: string,
  ): Promise<EventDayProgressionSummary> {
    const rows = await tx.xpTransaction.findMany({
      where: {
        userId,
        eventId,
        ruleKey: {
          in: [
            G1_CHECK_IN_RULES.COMPETITOR_CHECK_IN.ruleKey,
            G1_CHECK_IN_RULES.EARLY_CHECK_IN.ruleKey,
          ],
        },
      },
      include: { reversedBy: { select: { id: true, amount: true } } },
    });

    let attendanceXp = 0;
    let earlyCheckInXp = 0;
    for (const row of rows) {
      // Reversal rows are applied via earn.reversedBy — do not sum them again.
      if (row.reversalOfId) continue;
      const net = row.reversedBy ? row.amount + row.reversedBy.amount : row.amount;
      if (net === 0) continue;
      if (row.ruleKey === G1_CHECK_IN_RULES.COMPETITOR_CHECK_IN.ruleKey) {
        attendanceXp += net;
      } else if (row.ruleKey === G1_CHECK_IN_RULES.EARLY_CHECK_IN.ruleKey) {
        earlyCheckInXp += net;
      }
    }

    return {
      attendanceXp,
      earlyCheckInXp,
      totalEventDayXp: attendanceXp + earlyCheckInXp,
    };
  }

  private async ensureRule(
    tx: Tx,
    input: {
      userId: string;
      eventId: string;
      checkInId: string;
      rule: (typeof G1_CHECK_IN_RULES)[G1CheckInRuleKey];
      idempotencyKey: string;
    },
  ): Promise<void> {
    // Interactive tx clients lack `$transaction`; PrismaClient has it.
    // Unit mocks may omit `$executeRawUnsafe` — fall back to plain create+catch.
    const inInteractiveTx =
      typeof (tx as { $transaction?: unknown }).$transaction !== 'function' &&
      typeof tx.$executeRawUnsafe === 'function';
    const sp = `g1_xp_${Buffer.from(input.idempotencyKey).toString('hex').slice(0, 40)}`;

    const create = () =>
      tx.xpTransaction.create({
        data: {
          userId: input.userId,
          amount: input.rule.amount,
          ruleKey: input.rule.ruleKey,
          ruleVersion: input.rule.ruleVersion,
          scope: XpRewardScope.EVENT,
          eventId: input.eventId,
          categoryId: null,
          sourceType: XpSourceType.check_in,
          sourceId: input.checkInId,
          idempotencyKey: input.idempotencyKey,
        },
      });

    try {
      if (inInteractiveTx) {
        // Isolate P2002 so Postgres does not abort the outer interactive transaction.
        await tx.$executeRawUnsafe(`SAVEPOINT ${sp}`);
        await create();
        await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${sp}`);
      } else {
        await create();
      }
    } catch (error) {
      if (inInteractiveTx) {
        try {
          await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${sp}`);
        } catch {
          // savepoint may already be gone if the error was pre-insert
        }
      }
      if (isIdempotencyKeyConflict(error)) {
        return;
      }
      throw error;
    }
  }
}

type G1CheckInRuleKey = keyof typeof G1_CHECK_IN_RULES;

/** Only idempotency_key unique conflicts are idempotent success. */
export function isIdempotencyKeyConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }
  if ((error as { code?: string }).code !== 'P2002') {
    return false;
  }
  const target = (error as { meta?: { target?: string | string[] } }).meta?.target;
  const fields = Array.isArray(target) ? target : target ? [target] : [];
  return fields.some(
    (f) => f === 'idempotency_key' || f === 'idempotencyKey' || f.includes('idempotency'),
  );
}
