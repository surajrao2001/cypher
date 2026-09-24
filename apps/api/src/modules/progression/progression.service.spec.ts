import { XpRewardScope, XpSourceType } from '@prisma/client';
import {
  competitorCheckInIdempotencyKey,
  earlyCheckInIdempotencyKey,
  G1_CHECK_IN_RULES,
} from './g1-check-in-rewards';
import { isIdempotencyKeyConflict, ProgressionService } from './progression.service';

describe('ProgressionService', () => {
  const EVENT_ID = '11111111-1111-4111-8111-111111111111';
  const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const CHECK_IN_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

  const tx = {
    xpTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const service = new ProgressionService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates attendance + early for each eligible user', async () => {
    tx.xpTransaction.create.mockResolvedValue({});
    await service.ensureG1CheckInRewards(tx as never, {
      eventId: EVENT_ID,
      checkInId: CHECK_IN_ID,
      eligibleUserIds: [USER_A, USER_B],
      earlyEligible: true,
    });
    expect(tx.xpTransaction.create).toHaveBeenCalledTimes(4);
    expect(tx.xpTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: USER_A,
        amount: 40,
        ruleKey: 'COMPETITOR_CHECK_IN',
        scope: XpRewardScope.EVENT,
        sourceType: XpSourceType.check_in,
        sourceId: CHECK_IN_ID,
        idempotencyKey: competitorCheckInIdempotencyKey(EVENT_ID, USER_A),
      }),
    });
    expect(tx.xpTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: USER_A,
        amount: 25,
        ruleKey: 'EARLY_CHECK_IN',
        idempotencyKey: earlyCheckInIdempotencyKey(EVENT_ID, USER_A),
      }),
    });
  });

  it('treats idempotency P2002 as success; rethrows unrelated P2002', async () => {
    tx.xpTransaction.create.mockReset();
    tx.xpTransaction.create.mockRejectedValueOnce({
      code: 'P2002',
      meta: { target: ['idempotency_key'] },
    });

    await expect(
      service.ensureG1CheckInRewards(tx as never, {
        eventId: EVENT_ID,
        checkInId: CHECK_IN_ID,
        eligibleUserIds: [USER_A],
        earlyEligible: false,
      }),
    ).resolves.toBeUndefined();

    tx.xpTransaction.create.mockReset();
    tx.xpTransaction.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['some_other_unique'] },
    });
    await expect(
      service.ensureG1CheckInRewards(tx as never, {
        eventId: EVENT_ID,
        checkInId: CHECK_IN_ID,
        eligibleUserIds: [USER_A],
        earlyEligible: false,
      }),
    ).rejects.toEqual({ code: 'P2002', meta: { target: ['some_other_unique'] } });
  });

  // W X Y
  it('summarizes attendance only / both / zero', async () => {
    tx.xpTransaction.findMany.mockResolvedValueOnce([
      {
        ruleKey: G1_CHECK_IN_RULES.COMPETITOR_CHECK_IN.ruleKey,
        amount: 40,
        reversedBy: null,
      },
    ]);
    expect(await service.getEventDayProgression(tx as never, EVENT_ID, USER_A)).toEqual({
      attendanceXp: 40,
      earlyCheckInXp: 0,
      totalEventDayXp: 40,
    });

    tx.xpTransaction.findMany.mockResolvedValueOnce([
      { ruleKey: 'COMPETITOR_CHECK_IN', amount: 40, reversedBy: null },
      { ruleKey: 'EARLY_CHECK_IN', amount: 25, reversedBy: null },
    ]);
    expect(await service.getEventDayProgression(tx as never, EVENT_ID, USER_A)).toEqual({
      attendanceXp: 40,
      earlyCheckInXp: 25,
      totalEventDayXp: 65,
    });

    tx.xpTransaction.findMany.mockResolvedValueOnce([]);
    expect(await service.getEventDayProgression(tx as never, EVENT_ID, USER_A)).toEqual({
      attendanceXp: 0,
      earlyCheckInXp: 0,
      totalEventDayXp: 0,
    });
  });

  it('ignores fully reversed earns', async () => {
    tx.xpTransaction.findMany.mockResolvedValue([
      {
        ruleKey: 'COMPETITOR_CHECK_IN',
        amount: 40,
        reversalOfId: null,
        reversedBy: { id: 'rev', amount: -40 },
      },
      {
        ruleKey: 'COMPETITOR_CHECK_IN',
        amount: -40,
        reversalOfId: 'earn',
        reversedBy: null,
      },
    ]);
    expect(await service.getEventDayProgression(tx as never, EVENT_ID, USER_A)).toEqual({
      attendanceXp: 0,
      earlyCheckInXp: 0,
      totalEventDayXp: 0,
    });
  });

  it('isIdempotencyKeyConflict helper', () => {
    expect(isIdempotencyKeyConflict({ code: 'P2002', meta: { target: ['idempotency_key'] } })).toBe(
      true,
    );
    expect(isIdempotencyKeyConflict({ code: 'P2002', meta: { target: ['registration_id'] } })).toBe(
      false,
    );
  });
});
