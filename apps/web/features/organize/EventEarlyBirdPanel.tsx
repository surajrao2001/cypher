'use client';

import type { OrganizerEventDetailDto } from '@cypher/contracts';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { FormField } from '@/features/organize/FormField';

function toIsoFromLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date/time');
  }
  return date.toISOString();
}

type RowDraft = {
  id: string;
  enabled: boolean;
  earlyPrice: string;
  regularPrice: string;
  endsAt: string;
};

function rupeesFromMinor(minor: number): string {
  return String(Math.round(minor / 100));
}

function buildRows(event: OrganizerEventDetailDto): RowDraft[] {
  const tickets = [...event.competeCategories, ...event.viewerCategories];
  return tickets.map((cat) => {
    const earlyTier = cat.priceTiers?.find((t) => /early/i.test(t.name));
    const regularTier =
      cat.priceTiers?.find((t) => /regular/i.test(t.name)) ??
      cat.priceTiers?.find((t) => t.id !== earlyTier?.id);
    return {
      id: cat.id,
      enabled: true,
      // Leave early blank unless they already saved an early bird tier
      earlyPrice: earlyTier ? rupeesFromMinor(earlyTier.priceMinor) : '',
      regularPrice: rupeesFromMinor(regularTier?.priceMinor ?? cat.priceMinor),
      endsAt: earlyTier?.endsAt
        ? toLocalInputValue(earlyTier.endsAt)
        : '',
    };
  });
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = {
  organizerId: string;
  eventId: string;
  event: OrganizerEventDetailDto;
  onUpdated: (next: OrganizerEventDetailDto) => void;
};

/** Per-ticket early bird — regular prefilled from category/viewers price; early blank. */
export function EventEarlyBirdPanel({ organizerId, eventId, event, onUpdated }: Props) {
  const { api } = useAuth();
  const tickets = useMemo(
    () => [...event.competeCategories, ...event.viewerCategories],
    [event.competeCategories, event.viewerCategories],
  );
  const ticketKey = tickets
    .map((t) => `${t.id}:${t.priceMinor}:${t.priceTiers?.map((x) => x.priceMinor).join('-') ?? ''}`)
    .join('|');

  const [rows, setRows] = useState<RowDraft[]>(() => buildRows(event));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setRows((prev) => {
      const next = buildRows(event);
      // Preserve in-progress edits for ids that still exist
      return next.map((row) => {
        const old = prev.find((p) => p.id === row.id);
        if (!old) return row;
        return {
          ...row,
          enabled: old.enabled,
          // Keep user's early / cutoff if they typed something; refresh regular from source price
          earlyPrice: old.earlyPrice,
          endsAt: old.endsAt,
          regularPrice: row.regularPrice,
        };
      });
    });
  }, [ticketKey, event]);

  function patchRow(id: string, patch: Partial<RowDraft>) {
    setRows((list) => list.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function apply() {
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      const targets = rows.filter((row) => row.enabled);
      if (targets.length === 0) throw new Error('Turn on at least one ticket');
      for (const row of targets) {
        if (!row.earlyPrice.trim()) {
          throw new Error(`Fill early bird price for “${labelFor(row.id)}”`);
        }
        if (!row.endsAt) {
          throw new Error(`Say when early bird ends for “${labelFor(row.id)}”`);
        }
      }
      let last = event;
      for (const row of targets) {
        const cutoff = toIsoFromLocal(row.endsAt);
        last = await api.replaceOrganizerCategoryPriceTiers(organizerId, eventId, row.id, {
          tiers: [
            {
              name: 'Early bird',
              priceMinor: Math.round(Number(row.earlyPrice || 0) * 100),
              endsAt: cutoff,
              sortOrder: 0,
            },
            {
              name: 'Regular',
              priceMinor: Math.round(Number(row.regularPrice || 0) * 100),
              startsAt: cutoff,
              sortOrder: 1,
            },
          ],
        });
      }
      onUpdated(last);
      toastResolve(tid, toastCopy.earlyBirdSaved(targets.length));
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setPending(false);
    }
  }

  function labelFor(id: string): string {
    return tickets.find((t) => t.id === id)?.name ?? 'ticket';
  }

  if (tickets.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Add categories and/or a viewers pass first — then set early bird per ticket here.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-bold text-text-primary">Early bird</h2>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          Each category and viewers pass gets its own early bird. Regular is filled from the price
          you already set — type the early bird amount and when it ends.
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((row) => {
          const cat = tickets.find((t) => t.id === row.id);
          if (!cat) return null;
          return (
            <div
              key={row.id}
              className="space-y-3 rounded-md border border-border bg-elevated/40 p-3 sm:p-4"
            >
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={row.enabled}
                  onChange={(e) => patchRow(row.id, { enabled: e.target.checked })}
                />
                <span>
                  <span className="font-semibold text-text-primary">{cat.name}</span>
                  <span className="mt-0.5 block text-xs text-text-muted">
                    {cat.entryType === 'viewer' ? 'Viewers' : 'Compete'}
                  </span>
                </span>
              </label>
              {row.enabled ? (
                <div className="grid items-end gap-3 sm:grid-cols-3">
                  <FormField label="Early bird (₹)" hint="You fill this" hintReserve>
                    <Input
                      type="number"
                      min={0}
                      value={row.earlyPrice}
                      placeholder="e.g. 200"
                      onChange={(e) => patchRow(row.id, { earlyPrice: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Regular (₹)" hint="From your ticket price" hintReserve>
                    <Input
                      type="number"
                      min={0}
                      value={row.regularPrice}
                      onChange={(e) => patchRow(row.id, { regularPrice: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Early bird ends" hint="Cutoff for this ticket" hintReserve>
                    <Input
                      type="datetime-local"
                      value={row.endsAt}
                      onChange={(e) => patchRow(row.id, { endsAt: e.target.value })}
                    />
                  </FormField>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        disabled={pending || !rows.some((r) => r.enabled)}
        onClick={() => void apply()}
      >
        {pending ? 'Saving…' : 'Save early bird'}
      </Button>
    </div>
  );
}
