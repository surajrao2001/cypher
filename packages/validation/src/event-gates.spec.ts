import {
  assertCategoryPriceTiers,
  assertEndAfterStart,
  assertEventDaysInSpan,
  assertPublishCategories,
  assertRegistrationWindow,
} from './index';

describe('event-gates', () => {
  const start = '2026-10-10T18:00:00.000Z';

  it('rejects end before start', () => {
    expect(() => assertEndAfterStart(start, '2026-10-10T17:00:00.000Z')).toThrow(/End time/);
  });

  it('rejects registration closing after start', () => {
    expect(() =>
      assertRegistrationWindow({
        closesAt: '2026-10-10T19:00:00.000Z',
        startTime: start,
      }),
    ).toThrow(/close before/);
  });

  it('rejects days outside event span', () => {
    expect(() =>
      assertEventDaysInSpan(
        [{ label: 'Day 1', startsAt: '2026-10-09T10:00:00.000Z' }],
        start,
        '2026-10-11T22:00:00.000Z',
      ),
    ).toThrow(/before the event/);
  });

  it('rejects early bird ending after event start', () => {
    expect(() =>
      assertCategoryPriceTiers(
        [
          { name: 'Early bird', priceMinor: 20000, endsAt: '2026-10-11T00:00:00.000Z' },
          { name: 'Regular', priceMinor: 30000, startsAt: '2026-10-11T00:00:00.000Z' },
        ],
        { startTime: start, createdAt: '2026-09-01T00:00:00.000Z' },
      ),
    ).toThrow(/before the event starts/);
  });

  it('allows publishing with no compete categories', () => {
    expect(() => assertPublishCategories([{ entryType: 'viewer' }])).not.toThrow();
    expect(() => assertPublishCategories([])).not.toThrow();
  });
});
