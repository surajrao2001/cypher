'use client';

import type { EventDayConfigDto, OrganizerMemberRole } from '@cypher/contracts';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import {
  buildDayConfigPatch,
  canEditDayConfig,
  COMMON_EVENT_TIMEZONES,
  configToWindowForm,
  opsStatusLabel,
  reprojectFormTimezone,
  type WindowFormState,
} from '@/features/organize/event-day-ops';
import { usePatchEventDayConfigMutation } from '@/features/organize/queries';
import { friendlyError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

export function ManageDayDrawer({
  open,
  onOpenChange,
  organizerId,
  eventId,
  role,
  config,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizerId: string;
  eventId: string;
  role: OrganizerMemberRole;
  config: EventDayConfigDto;
}) {
  const canEdit = canEditDayConfig(role);
  const patchMutation = usePatchEventDayConfigMutation(organizerId, eventId);
  const [form, setForm] = useState<WindowFormState>(() => configToWindowForm(config));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(configToWindowForm(config));
    setLocalError(null);
  }, [config, open]);

  const timezoneOptions = useMemo(() => {
    const set = new Set<string>([...COMMON_EVENT_TIMEZONES, form.timezone, config.timezone]);
    return [...set].filter(Boolean);
  }, [config.timezone, form.timezone]);

  async function onSave() {
    if (!canEdit || patchMutation.isPending) return;
    setLocalError(null);
    const built = buildDayConfigPatch(form, config);
    if (!built.ok) {
      setLocalError(built.error);
      return;
    }
    if (Object.keys(built.body).length === 0) {
      onOpenChange(false);
      return;
    }
    const tid = toastPending('Saving day…');
    try {
      await patchMutation.mutateAsync(built.body);
      toastResolve(tid, 'Day saved');
      onOpenChange(false);
    } catch (err) {
      const msg = friendlyError(err, 'Couldn’t save day config');
      setLocalError(msg);
      toastReject(tid, toastCopy.saveFailed, msg);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full max-w-none flex-col border-l border-[#2a2a2a] bg-[#121212] p-0 sm:max-w-[min(100%,28rem)]"
      >
        <SheetHeader className="border-b border-[#2a2a2a] px-4 py-4 sm:px-5">
          <SheetTitle className="font-display text-2xl tracking-[0.04em] text-text-primary">
            Manage day
          </SheetTitle>
          <SheetDescription className="text-sm text-text-secondary">
            Check-in windows and timezone for this event.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
          <section className="space-y-2">
            <Label>Event timezone</Label>
            <select
              value={form.timezone}
              disabled={!canEdit || patchMutation.isPending}
              onChange={(e) => {
                const next = e.target.value;
                setForm((prev) => reprojectFormTimezone(prev, config, next));
                setLocalError(null);
              }}
              className="h-11 w-full rounded-xl border border-[#2a2a2a] bg-[#0e0e0e] px-3 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-60"
            >
              {timezoneOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-[12px] text-text-muted">
              Times below are shown in this timezone. Changing timezone alone does not move the
              underlying check-in instants.
            </p>
          </section>

          <section className="space-y-3">
            <Label>Check-in window</Label>
            <DateTimeRow
              label="Opens"
              date={form.opensDate}
              time={form.opensTime}
              disabled={!canEdit || patchMutation.isPending}
              onDateChange={(opensDate) => setForm((f) => ({ ...f, opensDate }))}
              onTimeChange={(opensTime) => setForm((f) => ({ ...f, opensTime }))}
            />
            <DateTimeRow
              label="Closes"
              date={form.closesDate}
              time={form.closesTime}
              disabled={!canEdit || patchMutation.isPending}
              onDateChange={(closesDate) => setForm((f) => ({ ...f, closesDate }))}
              onTimeChange={(closesTime) => setForm((f) => ({ ...f, closesTime }))}
            />
            <p className="text-[12px] text-text-muted">
              Set both open and close for a complete door window. Partial windows are allowed when
              early rewards are off.
            </p>
          </section>

          <section className="space-y-3 rounded-xl border border-[#252525] bg-[#0e0e0e] p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label>Early check-in</Label>
                <p className="mt-1 text-[13px] leading-snug text-text-secondary">
                  Dancers who check in during this window earn +25 XP.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.earlyEnabled}
                disabled={!canEdit || patchMutation.isPending}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    earlyEnabled: !f.earlyEnabled,
                    earlyDate: !f.earlyEnabled
                      ? f.earlyDate || f.opensDate || f.closesDate
                      : f.earlyDate,
                  }))
                }
                className={cn(
                  'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors',
                  form.earlyEnabled
                    ? 'border-accent/50 bg-accent/30'
                    : 'border-[#2a2a2a] bg-[#1a1a1a]',
                  (!canEdit || patchMutation.isPending) && 'opacity-60',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 size-5 rounded-full bg-text-primary transition-transform',
                    form.earlyEnabled ? 'left-5' : 'left-0.5',
                  )}
                />
              </button>
            </div>
            {form.earlyEnabled ? (
              <DateTimeRow
                label="Early reward until"
                date={form.earlyDate}
                time={form.earlyTime}
                disabled={!canEdit || patchMutation.isPending}
                onDateChange={(earlyDate) => setForm((f) => ({ ...f, earlyDate }))}
                onTimeChange={(earlyTime) => setForm((f) => ({ ...f, earlyTime }))}
              />
            ) : (
              <p className="text-[12px] text-text-muted">Early rewards are off for this event.</p>
            )}
          </section>

          <section className="space-y-1.5">
            <Label>Current status</Label>
            <p className="text-sm text-text-primary">{opsStatusLabel(config.opsStatus)}</p>
            <p className="text-[12px] text-text-muted">
              Status changes happen from Event Home — not from this sheet.
            </p>
          </section>

          {localError ? (
            <p role="alert" className="text-sm text-accent">
              {localError}
            </p>
          ) : null}
        </div>

        <div className="flex gap-2 border-t border-[#2a2a2a] px-4 py-4 sm:px-5">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={patchMutation.isPending}
          >
            Cancel
          </Button>
          {canEdit ? (
            <Button
              type="button"
              className="flex-1"
              onClick={() => void onSave()}
              disabled={patchMutation.isPending}
            >
              {patchMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary">
      {children}
    </p>
  );
}

function DateTimeRow({
  label,
  date,
  time,
  disabled,
  onDateChange,
  onTimeChange,
}: {
  label: string;
  date: string;
  time: string;
  disabled?: boolean;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[12px] text-text-muted">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={date}
          disabled={disabled}
          onChange={(e) => onDateChange(e.target.value)}
          className="h-11 rounded-xl border-[#2a2a2a] bg-[#0e0e0e]"
        />
        <Input
          type="time"
          value={time}
          disabled={disabled}
          onChange={(e) => onTimeChange(e.target.value)}
          className="h-11 rounded-xl border-[#2a2a2a] bg-[#0e0e0e]"
        />
      </div>
    </div>
  );
}
