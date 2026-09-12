'use client';

import type { OrganizerEventDetailDto } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';
import { assertEventDaysInSpan } from '@cypher/validation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { FormField } from '@/features/organize/FormField';

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoFromLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date/time');
  }
  return date.toISOString();
}

/** True when start and end land on different calendar days (local). */
export function spansMultipleCalendarDays(
  startIso: string,
  endIso: string | null | undefined,
): boolean {
  if (!endIso) return false;
  const a = new Date(startIso);
  const b = new Date(endIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  return a.toDateString() !== b.toDateString();
}

function weekdayLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

type DayDraft = {
  key: string;
  id?: string;
  label: string;
  startsAt: string;
  endsAt: string;
};

type Props = {
  organizerId: string;
  eventId: string;
  event: OrganizerEventDetailDto;
  onUpdated: (next: OrganizerEventDetailDto) => void;
};

/**
 * Multi-day only: name each day, then sell per-day + full-run audience passes.
 * Early bird is configured per Entry on the Entry surface — not here.
 */
export function EventDaysPricingPanel({ organizerId, eventId, event, onUpdated }: Props) {
  const { api } = useAuth();
  const isMultiDay = useMemo(
    () => spansMultipleCalendarDays(event.startTime, event.endTime) || event.days.length >= 2,
    [event.startTime, event.endTime, event.days.length],
  );

  const [days, setDays] = useState<DayDraft[]>(() => {
    const existing = daysFromEvent(event);
    if (existing.length > 0) return existing;
    if (spansMultipleCalendarDays(event.startTime, event.endTime)) {
      return seedDaysFromSpan(event.startTime, event.endTime!);
    }
    return [];
  });
  const [dayPrice, setDayPrice] = useState('300');
  const [fullPrice, setFullPrice] = useState('500');
  const [capacity, setCapacity] = useState('100');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const existing = daysFromEvent(event);
    if (existing.length > 0) {
      setDays(existing);
    } else if (spansMultipleCalendarDays(event.startTime, event.endTime)) {
      setDays((prev) => (prev.length >= 2 ? prev : seedDaysFromSpan(event.startTime, event.endTime!)));
    }
  }, [event]);

  if (!isMultiDay) {
    return null;
  }

  const savedDayCount = event.days.length;
  const canBuildPasses = savedDayCount >= 2;

  async function saveDays() {
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      if (days.some((d) => !d.startsAt)) {
        throw new Error('Each day needs a start time');
      }
      if (days.length < 2) {
        throw new Error('Multi-day needs at least two days');
      }
      const payload = days.map((day, index) => ({
        id: day.id,
        label: day.label.trim() || `Day ${String(index + 1)}`,
        startsAt: toIsoFromLocal(day.startsAt),
        endsAt: day.endsAt ? toIsoFromLocal(day.endsAt) : null,
        sortOrder: index,
      }));
      assertEventDaysInSpan(payload, event.startTime, event.endTime);
      const updated = await api.replaceOrganizerEventDays(organizerId, eventId, {
        days: payload,
      });
      onUpdated(updated);
      toastResolve(tid, toastCopy.daysSaved);
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setPending(false);
    }
  }

  async function createMultiDayViewersPasses() {
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      const updated = await api.generateAudienceDayPasses(organizerId, eventId, {
        dayPriceMinor: Math.round(Number(dayPrice || 0) * 100),
        fullPriceMinor: Math.round(Number(fullPrice || 0) * 100),
        capacityPerDay: Math.max(1, Number(capacity || 100)),
      });
      onUpdated(updated);
      toastResolve(tid, toastCopy.dayPassesReady);
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-bold text-text-primary">Multi-day schedule</h2>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          Your start and end span more than one calendar day. Name each day (e.g. Saturday /
          Sunday), then set audience passes: one for a single day, and one for all days.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-text-primary">1 · Name the days</h3>
        <div className="space-y-4 rounded-md border border-border bg-elevated/40 p-3">
          {days.map((day, index) => (
            <div
              key={day.key}
              className="grid items-end gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <FormField label="Day name" hint="Shown on tickets" hintReserve>
                <Input
                  value={day.label}
                  onChange={(e) =>
                    setDays((rows) =>
                      rows.map((row) =>
                        row.key === day.key ? { ...row, label: e.target.value } : row,
                      ),
                    )
                  }
                  placeholder={`Day ${String(index + 1)}`}
                />
              </FormField>
              <FormField label="Starts" hint="When that day begins" hintReserve>
                <Input
                  type="datetime-local"
                  value={day.startsAt}
                  onChange={(e) =>
                    setDays((rows) =>
                      rows.map((row) =>
                        row.key === day.key ? { ...row, startsAt: e.target.value } : row,
                      ),
                    )
                  }
                />
              </FormField>
              <FormField label="Ends" hint="Optional" optional hintReserve>
                <Input
                  type="datetime-local"
                  value={day.endsAt}
                  onChange={(e) =>
                    setDays((rows) =>
                      rows.map((row) =>
                        row.key === day.key ? { ...row, endsAt: e.target.value } : row,
                      ),
                    )
                  }
                />
              </FormField>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-0.5 h-10"
                disabled={days.length <= 1}
                onClick={() => setDays((rows) => rows.filter((row) => row.key !== day.key))}
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDays((rows) => [...rows, emptyDay(rows.length + 1)])}
            >
              Add another day
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={pending || days.length < 2}
              onClick={() => void saveDays()}
            >
              Save days
            </Button>
          </div>
          {savedDayCount >= 2 ? (
            <p className="text-xs text-success">
              Saved: {event.days.map((d) => d.label).join(' · ')}
            </p>
          ) : (
            <p className="text-xs text-text-muted">Save at least two days before audience passes.</p>
          )}
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-bold text-text-primary">2 · Audience passes</h3>
        <p className="text-sm text-text-secondary">
          People can buy a pass for <em>one day only</em>, or one pass that covers{' '}
          <em>every day</em>. Set the prices below, then save.
        </p>
        {!canBuildPasses ? (
          <p className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-text-muted">
            Save the days above first.
          </p>
        ) : (
          <div className="space-y-3 rounded-md border border-border bg-elevated/40 p-3">
            <div className="grid items-end gap-3 sm:grid-cols-3">
              <FormField label="One day only (₹)" hint="e.g. Saturday pass" hintReserve>
                <Input
                  value={dayPrice}
                  onChange={(e) => setDayPrice(e.target.value)}
                  type="number"
                  min={0}
                />
              </FormField>
              <FormField label="All days (₹)" hint="One pass for the whole event" hintReserve>
                <Input
                  value={fullPrice}
                  onChange={(e) => setFullPrice(e.target.value)}
                  type="number"
                  min={0}
                />
              </FormField>
              <FormField label="Spots per day" hint="Max audience each day" hintReserve>
                <Input
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  type="number"
                  min={1}
                />
              </FormField>
            </div>
            <Button type="button" disabled={pending} onClick={() => void createMultiDayViewersPasses()}>
              {event.viewerCategories.length > 1
                ? 'Update day & all-days passes'
                : 'Create day & all-days passes'}
            </Button>
            <p className="text-[11px] text-text-muted">
              This makes a pass for each saved day, plus one for the whole event. Sold
              passes stay; empty ones get replaced.
            </p>
          </div>
        )}

        {event.viewerCategories.length > 0 ? (
          <ul className="space-y-2">
            {event.viewerCategories.map((cat) => (
              <li
                key={cat.id}
                className="rounded-md border border-border px-3 py-2 text-sm text-text-secondary"
              >
                <span className="font-semibold text-text-primary">{cat.name}</span>
                {' — '}
                {formatMinorUnits(cat.currentPriceMinor)}
                {cat.activeTierName ? ` · ${cat.activeTierName}` : null}
                {cat.validDayIds.length > 0
                  ? ` · ${String(cat.validDayIds.length)} day${cat.validDayIds.length === 1 ? '' : 's'}`
                  : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function daysFromEvent(event: OrganizerEventDetailDto): DayDraft[] {
  return event.days.map((d) => ({
    key: d.id,
    id: d.id,
    label: d.label,
    startsAt: toLocalInputValue(d.startsAt),
    endsAt: toLocalInputValue(d.endsAt),
  }));
}

function seedDaysFromSpan(startIso: string, endIso: string): DayDraft[] {
  return [
    {
      key: 'seed-1',
      label: weekdayLabel(startIso),
      startsAt: toLocalInputValue(startIso),
      endsAt: '',
    },
    {
      key: 'seed-2',
      label: weekdayLabel(endIso),
      startsAt: toLocalInputValue(endIso),
      endsAt: '',
    },
  ];
}

function emptyDay(n: number, isoHint?: string | null): DayDraft {
  return {
    key: `${Date.now()}-${n}`,
    label: `Day ${String(n)}`,
    startsAt: toLocalInputValue(isoHint ?? undefined),
    endsAt: '',
  };
}
