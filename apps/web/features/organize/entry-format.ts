import type { EventCategoryPublicDto } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';

/** Human format presets mapped onto existing solo/team + min/max team-size. */
export type CompetitionFormatId = 'solo' | '2v2' | '3v3' | 'crew' | 'custom';

export const COMPETITION_FORMATS: Array<{
  id: Exclude<CompetitionFormatId, 'custom'>;
  label: string;
  entryType: 'solo' | 'team';
  minTeamSize: number;
  maxTeamSize: number;
}> = [
  { id: 'solo', label: 'Solo', entryType: 'solo', minTeamSize: 1, maxTeamSize: 1 },
  { id: '2v2', label: '2v2', entryType: 'team', minTeamSize: 2, maxTeamSize: 2 },
  { id: '3v3', label: '3v3', entryType: 'team', minTeamSize: 3, maxTeamSize: 3 },
  /** Flexible crew range — matches prior single teamSize UX without new API fields. */
  { id: 'crew', label: 'Crew', entryType: 'team', minTeamSize: 3, maxTeamSize: 10 },
];

export function formatFromCategory(cat: EventCategoryPublicDto): CompetitionFormatId {
  const match = COMPETITION_FORMATS.find(
    (f) =>
      f.entryType === (cat.entryType === 'team' ? 'team' : 'solo') &&
      f.minTeamSize === cat.minTeamSize &&
      f.maxTeamSize === cat.maxTeamSize,
  );
  return match?.id ?? 'custom';
}

export function sizesFromFormat(id: CompetitionFormatId): {
  entryType: 'solo' | 'team';
  minTeamSize: number;
  maxTeamSize: number;
} {
  if (id === 'custom') {
    return { entryType: 'team', minTeamSize: 2, maxTeamSize: 10 };
  }
  const row = COMPETITION_FORMATS.find((f) => f.id === id)!;
  return {
    entryType: row.entryType,
    minTeamSize: row.minTeamSize,
    maxTeamSize: row.maxTeamSize,
  };
}

export function capacityUnitLabel(cat: Pick<EventCategoryPublicDto, 'entryType' | 'maxTeamSize'>): string {
  if (cat.entryType === 'team' && cat.maxTeamSize > 1) return 'teams';
  return 'spots';
}

export function priceLabel(priceMinor: number): string {
  return priceMinor === 0 ? 'Free' : formatMinorUnits(priceMinor);
}

export function fillLabel(confirmed: number, capacity: number): string {
  return `${String(confirmed)} / ${String(capacity)} filled`;
}

export function earlyBirdTier(cat: EventCategoryPublicDto) {
  const early = cat.priceTiers?.find((t) => /early/i.test(t.name));
  const regular =
    cat.priceTiers?.find((t) => /regular/i.test(t.name)) ??
    cat.priceTiers?.find((t) => t.id !== early?.id);
  return { early, regular };
}

export function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toIsoFromLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date/time');
  }
  return date.toISOString();
}

export function isPayoutRequiredError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /cashfree|payouts before|paid categor|charge for registration/i.test(msg);
}
