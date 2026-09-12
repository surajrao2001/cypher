'use client';

import type { EventCategoryPublicDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { assertCategoryPriceTiers } from '@cypher/validation';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastCopy, toastError, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { CategoryNameSuggestions } from '@/features/organize/CategoryNameSuggestions';
import {
  COMPETITION_FORMATS,
  capacityUnitLabel,
  earlyBirdTier,
  formatFromCategory,
  isPayoutRequiredError,
  sizesFromFormat,
  toIsoFromLocal,
  toLocalInputValue,
  type CompetitionFormatId,
} from '@/features/organize/entry-format';
import { FormField } from '@/features/organize/FormField';
import { PosterField } from '@/features/organize/PosterField';
import { friendlyError, InlineNotice } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { routes } from '@cypher/contracts';

type Props = {
  organizerId: string;
  orgSlug: string;
  eventId: string;
  event: OrganizerEventDetailDto;
  payoutReady: boolean | null;
  category?: EventCategoryPublicDto | null;
  onUpdated: (next: OrganizerEventDetailDto) => void;
  onCancel: () => void;
};

export function CompetitionEntryForm({
  organizerId,
  orgSlug,
  eventId,
  event,
  payoutReady,
  category,
  onUpdated,
  onCancel,
}: Props) {
  const auth = useAuth();
  const feeGroupId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isEdit = Boolean(category);
  const occupied = (category?.reservedCount ?? 0) + (category?.confirmedCount ?? 0);

  const [name, setName] = useState(category?.name ?? '');
  const [formatId, setFormatId] = useState<CompetitionFormatId>(() =>
    category ? formatFromCategory(category) : 'solo',
  );
  const [paid, setPaid] = useState(() => (category?.priceMinor ?? 0) > 0);
  const [priceRupees, setPriceRupees] = useState(() =>
    String(Math.round((category?.priceMinor ?? 0) / 100) || ''),
  );
  const [capacity, setCapacity] = useState(String(category?.capacity ?? 64));
  const [showEarlyBird, setShowEarlyBird] = useState(() =>
    Boolean(category && earlyBirdTier(category).early),
  );
  const [earlyPrice, setEarlyPrice] = useState(() => {
    const early = category ? earlyBirdTier(category).early : undefined;
    return early ? String(Math.round(early.priceMinor / 100)) : '';
  });
  const [earlyEnds, setEarlyEnds] = useState(() => {
    const early = category ? earlyBirdTier(category).early : undefined;
    return early?.endsAt ? toLocalInputValue(early.endsAt) : '';
  });
  const [posterUrl, setPosterUrl] = useState(category?.posterUrl ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPayout, setNeedsPayout] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (paid && payoutReady === false) {
      setNeedsPayout(true);
    } else if (!paid) {
      setNeedsPayout(false);
    }
  }, [paid, payoutReady]);

  const unit =
    formatId === 'solo' || (formatId === 'custom' && (category?.maxTeamSize ?? 1) <= 1)
      ? 'spots'
      : 'teams';

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      toastError(toastCopy.categoryNameNeeded);
      return;
    }
    const priceMinor = paid ? Math.round(Number(priceRupees || 0) * 100) : 0;
    if (paid && (!priceRupees.trim() || priceMinor <= 0)) {
      setError('Enter a price greater than zero, or choose Free.');
      return;
    }
    if (paid && payoutReady === false) {
      setNeedsPayout(true);
      setError('Set up payouts before you can charge for registrations.');
      return;
    }
    if (paid && showEarlyBird) {
      if (!earlyPrice.trim() || Math.round(Number(earlyPrice || 0) * 100) < 0) {
        setError('Enter an early-bird price, or remove Early bird.');
        return;
      }
      if (!earlyEnds) {
        setError('Set when early bird ends, or remove Early bird.');
        return;
      }
      try {
        toIsoFromLocal(earlyEnds);
      } catch {
        setError('Early bird end time is invalid.');
        return;
      }
    }

    const sizes =
      formatId === 'custom' && category
        ? {
            entryType: (category.entryType === 'team' ? 'team' : 'solo') as 'solo' | 'team',
            minTeamSize: category.minTeamSize,
            maxTeamSize: category.maxTeamSize,
          }
        : sizesFromFormat(formatId);

    setPending(true);
    setError(null);
    const tid = toastPending(toastCopy.saving);
    try {
      let next: OrganizerEventDetailDto;
      if (isEdit && category) {
        next = await auth.api.updateOrganizerEventCategory(organizerId, eventId, category.id, {
          name: trimmed,
          capacity: Number(capacity),
          priceMinor,
          entryType: sizes.entryType,
          minTeamSize: sizes.minTeamSize,
          maxTeamSize: sizes.maxTeamSize,
          posterUrl: posterUrl.trim() || null,
        });
      } else {
        next = await auth.api.addOrganizerEventCategory(organizerId, eventId, {
          name: trimmed,
          capacity: Number(capacity),
          priceMinor,
          entryType: sizes.entryType,
          minTeamSize: sizes.minTeamSize,
          maxTeamSize: sizes.maxTeamSize,
          posterUrl: posterUrl.trim() || null,
        });
      }

      const saved =
        next.competeCategories.find((c) => c.name === trimmed) ??
        next.competeCategories.find((c) => c.id === category?.id) ??
        next.competeCategories[next.competeCategories.length - 1];

      if (paid && showEarlyBird && saved && earlyPrice.trim() && earlyEnds) {
        const cutoff = toIsoFromLocal(earlyEnds);
        const earlyMinor = Math.round(Number(earlyPrice || 0) * 100);
        assertCategoryPriceTiers(
          [
            { name: 'Early bird', priceMinor: earlyMinor, endsAt: cutoff },
            { name: 'Regular', priceMinor, startsAt: cutoff },
          ],
          { startTime: event.startTime, createdAt: event.createdAt },
        );
        next = await auth.api.replaceOrganizerCategoryPriceTiers(
          organizerId,
          eventId,
          saved.id,
          {
            tiers: [
              {
                name: 'Early bird',
                priceMinor: earlyMinor,
                endsAt: cutoff,
                sortOrder: 0,
              },
              {
                name: 'Regular',
                priceMinor,
                startsAt: cutoff,
                sortOrder: 1,
              },
            ],
          },
        );
      } else if (isEdit && category && paid && !showEarlyBird && earlyBirdTier(category).early) {
        // Clear tiers → fall back to list price only
        next = await auth.api.replaceOrganizerCategoryPriceTiers(
          organizerId,
          eventId,
          category.id,
          { tiers: [] },
        );
      }

      onUpdated(next);
      toastResolve(tid, isEdit ? toastCopy.categoryUpdated(trimmed) : toastCopy.categoryAdded);
    } catch (err) {
      if (isPayoutRequiredError(err)) {
        setNeedsPayout(true);
        setError('Set up payouts before you can charge for registrations.');
        toastReject(tid, toastCopy.saveFailed);
      } else {
        const msg = friendlyError(err, 'Couldn’t save competition');
        setError(msg);
        toastReject(tid, toastCopy.saveFailed, msg);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="kicker text-accent">{isEdit ? 'Edit' : 'Add'}</p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-bold text-text-primary outline-none"
        >
          {isEdit ? 'Competition' : 'Add competition'}
        </h2>
      </div>

      <FormField label="Name">
        <CategoryNameSuggestions value={name} onPick={setName} disabled={pending} />
        <Input
          className="mt-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hip Hop 1v1"
          disabled={pending}
        />
      </FormField>

      <PosterField
        value={posterUrl}
        onChange={setPosterUrl}
        disabled={pending}
        label="Poster"
        hint="Optional · shows on Entry cards. Falls back to the event poster if empty."
        createPanel
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-text-primary">Format</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Format">
          {COMPETITION_FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={formatId === f.id}
              disabled={pending}
              onClick={() => setFormatId(f.id)}
              className={cn(
                'min-h-11 rounded-md border px-3 py-2 text-sm font-semibold transition-colors',
                formatId === f.id
                  ? 'border-accent bg-accent/15 text-text-primary'
                  : 'border-border bg-surface text-text-secondary hover:border-accent/40',
              )}
            >
              {f.label}
            </button>
          ))}
          {formatId === 'custom' ? (
            <span className="self-center text-xs text-text-muted">
              Custom size ({category?.minTeamSize}–{category?.maxTeamSize})
            </span>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-text-primary">Entry fee</legend>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-labelledby={feeGroupId}>
          <span id={feeGroupId} className="sr-only">
            Entry fee
          </span>
          {(
            [
              { id: 'free', label: 'Free', value: false },
              { id: 'paid', label: 'Paid', value: true },
            ] as const
          ).map((opt) => (
            <label
              key={opt.id}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm',
                paid === opt.value
                  ? 'border-accent bg-accent/10 text-text-primary'
                  : 'border-border bg-surface text-text-secondary',
              )}
            >
              <input
                type="radio"
                name={`fee-${feeGroupId}`}
                checked={paid === opt.value}
                disabled={pending}
                onChange={() => setPaid(opt.value)}
                className="h-4 w-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {paid ? (
          <FormField label="Price (₹)">
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)}
              disabled={pending}
              placeholder="500"
            />
          </FormField>
        ) : null}
      </fieldset>

      {needsPayout && paid ? (
        <div
          role="alert"
          className="space-y-3 rounded-md border border-accent/50 bg-accent/10 px-4 py-3"
        >
          <p className="text-sm font-semibold text-text-primary">Paid entry</p>
          <p className="text-sm text-text-secondary">
            Set up payouts before you can charge for registrations.
          </p>
          <Button asChild size="sm">
            <Link href={routes.organizePayouts(orgSlug)}>Set up payouts</Link>
          </Button>
        </div>
      ) : null}

      <FormField
        label="Capacity"
        hint={`${capacity || '—'} ${unit}${occupied > 0 ? ` · ${String(occupied)} already taken` : ''}`}
      >
        <Input
          type="number"
          min={Math.max(1, occupied)}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          disabled={pending}
        />
      </FormField>

      {paid ? (
        <div className="space-y-3 border-t border-border pt-4">
          {!showEarlyBird ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setShowEarlyBird(true)}
            >
              + Add early-bird price
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-primary">Early bird</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    setShowEarlyBird(false);
                    setEarlyPrice('');
                    setEarlyEnds('');
                  }}
                >
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Price (₹)">
                  <Input
                    type="number"
                    min={0}
                    value={earlyPrice}
                    onChange={(e) => setEarlyPrice(e.target.value)}
                    disabled={pending}
                    placeholder="350"
                  />
                </FormField>
                <FormField label="Ends">
                  <Input
                    type="datetime-local"
                    value={earlyEnds}
                    max={toLocalInputValue(event.startTime)}
                    onChange={(e) => setEarlyEnds(e.target.value)}
                    disabled={pending}
                  />
                </FormField>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {error ? <InlineNotice tone="warn">{error}</InlineNotice> : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" disabled={pending || (paid && needsPayout && payoutReady === false)} onClick={() => void save()}>
          {pending ? 'Saving…' : isEdit ? 'Save competition' : 'Add competition'}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {isEdit && category ? (
        <p className="text-xs text-text-muted">
          Capacity unit: {capacityUnitLabel(category)} · {category.confirmedCount} confirmed
        </p>
      ) : null}
    </div>
  );
}
