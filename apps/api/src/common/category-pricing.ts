import type { CategoryPriceTier } from '@prisma/client';

export type ResolvedPrice = {
  priceMinor: number;
  tier: CategoryPriceTier | null;
  nextTier: CategoryPriceTier | null;
};

/**
 * Resolve the active date-based tier for a category.
 * Active = startsAt <= now < endsAt (null bounds are open).
 * Overlap rule: lowest sortOrder, then earliest endsAt, then lowest price.
 * Fallback: legacy category.priceMinor with no tier.
 */
export function resolveCategoryPrice(
  categoryPriceMinor: number,
  tiers: CategoryPriceTier[],
  now: Date = new Date(),
): ResolvedPrice {
  const active = tiers.filter((tier) => isTierActive(tier, now));
  active.sort(compareTiers);
  const tier = active[0] ?? null;

  const upcoming = tiers
    .filter((t) => t.startsAt && t.startsAt.getTime() > now.getTime())
    .sort((a, b) => (a.startsAt!.getTime() - b.startsAt!.getTime()));

  return {
    priceMinor: tier ? tier.priceMinor : categoryPriceMinor,
    tier,
    nextTier: upcoming[0] ?? null,
  };
}

function isTierActive(tier: CategoryPriceTier, now: Date): boolean {
  if (tier.startsAt && tier.startsAt.getTime() > now.getTime()) return false;
  if (tier.endsAt && tier.endsAt.getTime() <= now.getTime()) return false;
  return true;
}

function compareTiers(a: CategoryPriceTier, b: CategoryPriceTier): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  const aEnd = a.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const bEnd = b.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
  if (aEnd !== bEnd) return aEnd - bEnd;
  return a.priceMinor - b.priceMinor;
}
