'use client';

import type { OrganizerDto, OrganizerEventDetailDto, OrganizerMemberRole } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import {
  canTransitionOps,
  checkInStatusSummary,
  opsActionsForStatus,
  opsStatusLabel,
  preferCheckInLink,
} from '@/features/organize/event-day-ops';
import { ManageDayDrawer } from '@/features/organize/ManageDayDrawer';
import {
  useEventDayConfigQuery,
  useSetEventOpsStatusMutation,
} from '@/features/organize/queries';
import { friendlyError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

export function EventDayControl({
  org,
  event,
}: {
  org: OrganizerDto;
  event: OrganizerEventDetailDto;
}) {
  const role = org.role as OrganizerMemberRole;
  const configQuery = useEventDayConfigQuery(org.id, event.id);
  const opsMutation = useSetEventOpsStatusMutation(org.id, event.id);
  const [manageOpen, setManageOpen] = useState(false);

  const config = configQuery.data;
  const checkInHref = routes.organizeEventCheckIn(org.slug, event.id);

  if (configQuery.isPending && !config) {
    return (
      <div
        className="h-[4.5rem] animate-pulse rounded-xl border border-[#252525] bg-[#141414]/80 sm:h-[5.25rem]"
        aria-hidden
      />
    );
  }

  if (configQuery.isError && !config) {
    return (
      <div className="rounded-xl border border-dashed border-[#2a2a2a] bg-[#141414]/60 px-3 py-3 sm:px-4">
        <p className="text-sm text-text-secondary">Couldn’t load event-day state.</p>
        <button
          type="button"
          className="mt-1 text-sm font-semibold text-accent hover:underline"
          onClick={() => void configQuery.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!config) return null;

  const canOps = canTransitionOps(role);
  const { primary, secondary } = opsActionsForStatus(config.opsStatus);
  const showCheckInLead = preferCheckInLink(config.opsStatus);
  const summary = checkInStatusSummary(config);
  const statusTone =
    config.opsStatus === 'event_live' || config.opsStatus === 'check_in_open'
      ? 'live'
      : config.opsStatus === 'completed'
        ? 'done'
        : 'neutral';

  async function transitionTo(to: NonNullable<typeof primary>['to'], label: string) {
    if (!canOps || opsMutation.isPending) return;
    const tid = toastPending(`${label}…`);
    try {
      await opsMutation.mutateAsync(to);
      toastResolve(tid, opsStatusLabel(to));
    } catch (err) {
      toastReject(tid, 'Couldn’t update status', friendlyError(err));
      void configQuery.refetch();
    }
  }

  return (
    <>
      <section
        className="rounded-xl border border-[#252525] bg-gradient-to-b from-[#171717]/95 to-[#121212] px-3 py-3 sm:rounded-2xl sm:px-4 sm:py-3.5"
        aria-label="Event day controls"
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] sm:px-2.5 sm:text-[10px] sm:tracking-[0.14em]',
              statusTone === 'live'
                ? 'bg-accent-2 text-bg'
                : statusTone === 'done'
                  ? 'border border-white/15 text-text-secondary'
                  : 'bg-[#1e1e1e] text-text-secondary',
            )}
          >
            {opsStatusLabel(config.opsStatus)}
          </span>
          <p className="min-w-0 flex-1 text-[12px] text-text-secondary sm:text-[13px]">
            <span className="font-semibold text-text-primary">Check-in</span>
            <span className="text-text-muted"> · </span>
            <span>{summary}</span>
          </p>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2 sm:mt-3">
          {showCheckInLead ? (
            <Button asChild size="sm" className="min-h-10 rounded-xl px-4 text-[12px] uppercase tracking-[0.08em]">
              <Link href={checkInHref}>Check in</Link>
            </Button>
          ) : null}

          {canOps && primary ? (
            <Button
              type="button"
              size="sm"
              variant={showCheckInLead ? 'outline' : 'default'}
              disabled={opsMutation.isPending}
              onClick={() => void transitionTo(primary.to, primary.label)}
              className={cn(
                'min-h-10 rounded-xl px-4 text-[12px] uppercase tracking-[0.08em]',
                showCheckInLead && 'border-[#2a2a2a] bg-[#141414]',
              )}
            >
              {opsMutation.isPending ? 'Updating…' : primary.label}
            </Button>
          ) : null}

          {config.opsStatus === 'check_in_closed' ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="min-h-10 rounded-xl border-[#2a2a2a] bg-[#141414] px-4 text-[12px] uppercase tracking-[0.08em]"
            >
              <Link href={checkInHref}>Check in</Link>
            </Button>
          ) : null}

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setManageOpen(true)}
            className="min-h-10 rounded-xl border-[#2a2a2a] bg-[#141414] px-4 text-[12px] uppercase tracking-[0.08em]"
          >
            Manage day
          </Button>

          {canOps && secondary ? (
            <button
              type="button"
              disabled={opsMutation.isPending}
              onClick={() => void transitionTo(secondary.to, secondary.label)}
              className="min-h-10 px-1 text-[12px] font-semibold text-text-muted underline-offset-2 hover:text-accent hover:underline disabled:opacity-50"
            >
              {secondary.label}
            </button>
          ) : null}
        </div>
      </section>

      <ManageDayDrawer
        open={manageOpen}
        onOpenChange={setManageOpen}
        organizerId={org.id}
        eventId={event.id}
        role={role}
        config={config}
      />
    </>
  );
}
