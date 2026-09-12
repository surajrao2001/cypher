'use client';

import type { ReactNode } from 'react';
import type {
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
} from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';

import { ByndIcon, type ByndIconName } from '@/components/icons/bynd8';
import {
  buildAttention,
  hasPaidEntry,
  isFreeOnlyEvent,
  isPastEvent,
  moneyFromRegistrations,
  type AttentionItem,
  type ControlDest,
} from '@/features/organize/event-control';
import { EventReadiness } from '@/features/organize/EventReadiness';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function EventHomePanel({
  org,
  event,
  regs,
  payoutReady,
  checkedInCount: _checkedInCount,
  entryHref,
  peopleHref,
  onNavigate,
  onPublished,
}: {
  org: OrganizerDto;
  event: OrganizerEventDetailDto;
  regs: OrganizerEventRegistrationsResponse | null;
  payoutReady: boolean | null;
  checkedInCount: number | null;
  entryHref: string;
  peopleHref: string;
  onNavigate: (dest: ControlDest) => void;
  onPublished: (next: OrganizerEventDetailDto) => void;
}) {
  void _checkedInCount;
  const isDraft = event.status === 'draft';
  const past = isPastEvent(event);
  const freeOnly = isFreeOnlyEvent(event);
  const paid = hasPaidEntry(event);
  const compete =
    event.competeCategories ?? (event.categories ?? []).filter((c) => c.entryType !== 'viewer');
  const audienceCats =
    event.viewerCategories ?? (event.categories ?? []).filter((c) => c.entryType === 'viewer');
  const competeConfirmed = compete.reduce((n, c) => n + c.confirmedCount, 0);
  const audienceConfirmed = audienceCats.reduce((n, c) => n + c.confirmedCount, 0);
  const confirmed = regs?.totals.confirmed ?? competeConfirmed + audienceConfirmed;
  const money = moneyFromRegistrations(regs);
  const attention = past || isDraft ? [] : buildAttention({ event, payoutReady, orgSlug: org.slug });
  const draftAttention = isDraft
    ? buildAttention({ event, payoutReady, orgSlug: org.slug }).filter((a) => a.id === 'payout')
    : [];
  const showAttention = [...draftAttention, ...attention].map(normalizeAttention);
  const showMoney = !freeOnly || paid;

  const tightest = [...compete]
    .filter((c) => c.capacity > 0)
    .map((c) => ({
      cat: c,
      left: Math.max(0, c.capacity - c.confirmedCount - c.reservedCount),
    }))
    .sort((a, b) => a.left - b.left)[0];

  if (isDraft) {
    return (
      <div className="space-y-6">
        <EventReadiness org={org} event={event} onPublished={onPublished} />
        <div className="grid gap-3 sm:grid-cols-2">
          <DestCard
            title="Entry"
            body={
              compete.length + audienceCats.length === 0
                ? 'Optional — add competition or audience when people need to register'
                : `${String(compete.length)} competition · ${String(audienceCats.length)} audience`
            }
            href={entryHref}
          />
          <DestCard
            title="Event Page"
            body="Poster, details, updates"
            onClick={() => onNavigate('page')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!past ? (
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard
            value={confirmed}
            label="Registered"
            detail={
              <>
                {compete.length > 0 ? (
                  <p>{competeConfirmed} competitors</p>
                ) : null}
                {audienceCats.length > 0 ? <p>{audienceConfirmed} audience</p> : null}
              </>
            }
          />
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = entryHref;
            }}
            className={cn(
              'relative flex min-h-[7.5rem] items-center gap-5 rounded-2xl border border-[#2a2a2a] bg-[#141414] px-5 py-5 text-left transition-colors',
              'hover:border-accent/40',
            )}
          >
            <div>
              <p className="font-display text-5xl leading-none tracking-[0.02em] text-text-primary sm:text-6xl">
                {tightest ? tightest.left : '—'}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                Spots left
              </p>
            </div>
            <div className="min-w-0 space-y-2">
              {tightest ? (
                <>
                  <span className="inline-flex rounded-full bg-[#1e1e1e] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    Low
                  </span>
                  <p className="truncate text-sm text-text-secondary">{tightest.cat.name}</p>
                </>
              ) : (
                <p className="text-sm text-text-muted">No capacity set</p>
              )}
            </div>
            <ByndIcon
              name="chevronRight"
              className="absolute bottom-4 right-4 size-4 text-accent"
              aria-hidden
            />
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard
            value={confirmed}
            label="Registered"
            detail={
              !freeOnly && money.collectedMinor > 0 ? (
                <p>{formatMinorUnits(money.collectedMinor)} collected</p>
              ) : null
            }
          />
        </div>
      )}

      {showAttention.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-accent">Needs attention</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {showAttention.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.href && item.id === 'payout') {
                      window.location.href = item.href;
                      return;
                    }
                    if (item.dest === 'entry') {
                      window.location.href = entryHref;
                      return;
                    }
                    if (item.dest) onNavigate(item.dest);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#141414] px-4 py-4 text-left transition-colors hover:border-accent/40"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <ByndIcon name={item.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-text-primary">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-text-secondary">{item.body}</span>
                  </span>
                  <ByndIcon name="chevronRight" className="size-4 shrink-0 text-accent" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div
        className={cn(
          'grid gap-3',
          showMoney ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3',
        )}
      >
        <DestCard
          title="People"
          body={`${String(confirmed)} registrations`}
          href={peopleHref}
        />
        <DestCard
          title="Entry"
          body={
            compete.length + audienceCats.length === 0
              ? 'No entry yet'
              : `${String(compete.length)} competition · ${String(audienceCats.length)} audience`
          }
          href={entryHref}
        />
        {showMoney ? (
          <DestCard
            title="Money"
            body={
              payoutReady === false && paid
                ? 'Set up payouts'
                : money.collectedMinor > 0
                  ? `${formatMinorUnits(money.collectedMinor)} collected`
                  : 'Paid registrations'
            }
            onClick={() => onNavigate('money')}
          />
        ) : null}
        <DestCard
          title="Event Page"
          body="Poster, details, updates"
          onClick={() => onNavigate('page')}
        />
      </div>
    </div>
  );
}

function normalizeAttention(item: AttentionItem): AttentionItem & { icon: ByndIconName } {
  if (item.id === 'payout') {
    return {
      ...item,
      body: 'Required to open paid entries',
      icon: 'wallet',
    };
  }
  if (item.id.startsWith('low-') || item.id.startsWith('full-')) {
    return { ...item, icon: 'crew' };
  }
  return { ...item, icon: 'media' };
}

function StatCard({
  value,
  label,
  detail,
}: {
  value: number;
  label: string;
  detail?: ReactNode;
}) {
  return (
    <div className="flex min-h-[7.5rem] items-center gap-5 rounded-2xl border border-[#2a2a2a] bg-[#141414] px-5 py-5">
      <div>
        <p className="font-display text-5xl leading-none tracking-[0.02em] text-text-primary sm:text-6xl">
          {value}
        </p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
          {label}
        </p>
      </div>
      {detail ? <div className="space-y-0.5 text-sm text-text-secondary">{detail}</div> : null}
    </div>
  );
}

function DestCard({
  title,
  body,
  onClick,
  href,
}: {
  title: string;
  body: string;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    'relative flex min-h-[7rem] flex-col items-start justify-between rounded-2xl border border-[#2a2a2a] bg-[#141414] px-4 py-4 text-left transition-colors hover:border-accent/40';

  const inner = (
    <>
      <div className="space-y-1.5 pr-6">
        <p className="font-display text-xl uppercase tracking-[0.04em] text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary">{body}</p>
      </div>
      <ByndIcon
        name="chevronRight"
        className="absolute bottom-4 right-4 size-4 text-accent"
        aria-hidden
      />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}
