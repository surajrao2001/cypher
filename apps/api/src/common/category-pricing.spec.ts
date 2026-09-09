import { resolveCategoryPrice } from './category-pricing';

describe('resolveCategoryPrice', () => {
  const base = {
    id: 't1',
    categoryId: 'c1',
    maxQuantity: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('falls back to category price when no tiers', () => {
    const resolved = resolveCategoryPrice(50000, []);
    expect(resolved.priceMinor).toBe(50000);
    expect(resolved.tier).toBeNull();
  });

  it('treats missing tiers as empty (legacy mocks / partial includes)', () => {
    const resolved = resolveCategoryPrice(50000, undefined);
    expect(resolved.priceMinor).toBe(50000);
    expect(resolved.tier).toBeNull();
  });

  it('picks active early bird before endsAt', () => {
    const now = new Date('2026-09-10T12:00:00.000Z');
    const tiers = [
      {
        ...base,
        id: 'early',
        name: 'Early bird',
        priceMinor: 20000,
        startsAt: null,
        endsAt: new Date('2026-09-15T00:00:00.000Z'),
        sortOrder: 0,
      },
      {
        ...base,
        id: 'regular',
        name: 'Regular',
        priceMinor: 30000,
        startsAt: new Date('2026-09-15T00:00:00.000Z'),
        endsAt: null,
        sortOrder: 1,
      },
    ];
    const resolved = resolveCategoryPrice(30000, tiers, now);
    expect(resolved.priceMinor).toBe(20000);
    expect(resolved.tier?.name).toBe('Early bird');
    expect(resolved.nextTier?.name).toBe('Regular');
  });

  it('switches to regular after early bird ends', () => {
    const now = new Date('2026-09-16T12:00:00.000Z');
    const tiers = [
      {
        ...base,
        id: 'early',
        name: 'Early bird',
        priceMinor: 20000,
        startsAt: null,
        endsAt: new Date('2026-09-15T00:00:00.000Z'),
        sortOrder: 0,
      },
      {
        ...base,
        id: 'regular',
        name: 'Regular',
        priceMinor: 30000,
        startsAt: new Date('2026-09-15T00:00:00.000Z'),
        endsAt: null,
        sortOrder: 1,
      },
    ];
    const resolved = resolveCategoryPrice(30000, tiers, now);
    expect(resolved.priceMinor).toBe(30000);
    expect(resolved.tier?.name).toBe('Regular');
  });
});
