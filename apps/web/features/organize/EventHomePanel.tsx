'use client';

import type { ReactNode } from 'react';
import type {
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';
import Link from 'next/link';

import { ByndIcon, type ByndIconName } from '@/components/icons/bynd8';
import {
  buildAttention,
  hasPaidEntry,
  isPastEvent,
  moneyFromRegistrations,
  statusLabel,
  type AttentionItem,
  type ControlDest,
} from '@/features/organize/event-control';
import {
  entryCopyForType,
  eventTypeDisplayLabel,
  eventTypeGroup,
  hasAnyEntry,
} from '@/features/organize/event-type-copy';
import { EventReadiness } from '@/features/organize/EventReadiness';
import { cn } from '@/lib/utils';

export function EventHomePanel({
  org,
  event,
  regs,
  payoutReady,
  checkedInCount: _checkedInCount,
  entryHref,
  peopleHref,
  editHref,
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
  editHref: string;
  onNavigate: (dest: ControlDest) => void;
  onPublished: (next: OrganizerEventDetailDto) => void;
}) {
  void _checkedInCount;
  const isDraft = event.status === 'draft';
  const isLive = event.status === 'published';
  const past = isPastEvent(event);
  const paid = hasPaidEntry(event);
  const showMoney = paid;
  const copy = entryCopyForType(event.eventType);
  const group = eventTypeGroup(event.eventType);
  const anyEntry = hasAnyEntry(event);
  const compete =
    event.competeCategories ?? (event.categories ?? []).filter((c) => c.entryType !== 'viewer');
  const audienceCats =
    event.viewerCategories ?? (event.categories ?? []).filter((c) => c.entryType === 'viewer');
  const competeConfirmed = compete.reduce((n, c) => n + c.confirmedCount, 0);
  const audienceConfirmed = audienceCats.reduce((n, c) => n + c.confirmedCount, 0);
  const confirmed = regs?.totals.confirmed ?? competeConfirmed + audienceConfirmed;
  const capacity = (event.categories ?? []).reduce((n, c) => n + c.capacity, 0);
  const money = moneyFromRegistrations(regs);
  const attention = past || isDraft ? [] : buildAttention({ event, payoutReady, orgSlug: org.slug });
  const draftAttention = isDraft
    ? buildAttention({ event, payoutReady, orgSlug: org.slug }).filter((a) => a.id === 'payout')
    : [];
  const showAttention = [...draftAttention, ...attention].map(normalizeAttention);
  const publicHref = `${routes.events}/${event.slug}`;
  const mediaCount = event.mediaLinks?.length ?? 0;

  const tightest = [...compete, ...audienceCats]
    .filter((c) => c.capacity > 0)
    .map((c) => ({
      cat: c,
      left: Math.max(0, c.capacity - c.confirmedCount - c.reservedCount),
    }))
    .sort((a, b) => a.left - b.left)[0];

  const entryBody = !anyEntry
    ? copy.emptyEntryHome
    : copy.entryHomeSummary(compete.length, audienceCats.length);

  const showNoRegSummary = !anyEntry && copy.noEntrySummary && !isDraft;

  if (isDraft) {
    return (
      <div className="space-y-6">
        <EventReadiness org={org} event={event} onPublished={onPublished} />
        {copy.suggestEntryTitle && !anyEntry ? (
          <section className="rounded-2xl border border-[#2a2a2a] bg-[#141414] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
              {copy.suggestEntryTitle}
            </p>
            <p className="mt-1 text-sm text-text-secondary">{copy.suggestEntryBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={entryHref}
                className="inline-flex min-h-10 items-center rounded-xl bg-accent px-4 text-xs font-semibold uppercase tracking-[0.12em] text-bg"
              >
                {copy.addCompete}
              </Link>
              {group === 'battle' ? (
                <Link
                  href={entryHref}
                  className="inline-flex min-h-10 items-center rounded-xl border border-[#2a2a2a] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-text-primary"
                >
                  {copy.addAudience}
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <DestCard title="Entry" body={entryBody} href={entryHref} />
          {anyEntry ? (
            <DestCard title="People" body="Registrations" href={peopleHref} />
          ) : null}
        </div>
        <PublicPageSection
          event={event}
          editHref={editHref}
          publicHref={publicHref}
          isLive={false}
          canView={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!past ? (
        showNoRegSummary ? (
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] px-5 py-6">
            <p className="font-display text-2xl tracking-[0.04em] text-text-primary sm:text-3xl">
              {copy.noEntrySummary}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Want to limit spots or charge entry?
            </p>
            <Link
              href={entryHref}
              className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-[#2a2a2a] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-text-primary transition-colors hover:border-accent/40"
            >
              {copy.addCompete}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {group === 'workshop' && capacity > 0 ? (
              <StatCard
                value={`${String(confirmed)} / ${String(capacity)}`}
                label="Spots filled"
                detail={
                  tightest ? <p>{String(tightest.left)} spots left</p> : null
                }
              />
            ) : (
              <StatCard
                value={String(confirmed)}
                label="Registered"
                detail={
                  anyEntry ? (
                    <>
                      {compete.length > 0 && group === 'battle' ? (
                        <p>{competeConfirmed} competitors</p>
                      ) : null}
                      {audienceCats.length > 0 && group === 'battle' ? (
                        <p>{audienceConfirmed} audience</p>
                      ) : null}
                      {group !== 'battle' && compete.length + audienceCats.length > 0 ? (
                        <p>{entryBody}</p>
                      ) : null}
                    </>
                  ) : null
                }
              />
            )}
            {anyEntry ? (
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
            ) : null}
          </div>
        )
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard
            value={String(confirmed)}
            label="Registered"
            detail={
              paid && money.collectedMinor > 0 ? (
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
                    if (item.href === 'edit') {
                      window.location.href = editHref;
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

      {!showNoRegSummary ? (
        <div
          className={cn(
            'grid gap-3',
            showMoney ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2',
          )}
        >
          <DestCard
            title="People"
            body={anyEntry ? `${String(confirmed)} registrations` : 'No registrations yet'}
            href={peopleHref}
          />
          <DestCard title="Entry" body={entryBody} href={entryHref} />
          {showMoney ? (
            <DestCard
              title="Money"
              body={
                payoutReady === false
                  ? 'Set up payouts'
                  : money.collectedMinor > 0
                    ? `${formatMinorUnits(money.collectedMinor)} collected`
                    : 'Paid registrations'
              }
              onClick={() => onNavigate('money')}
            />
          ) : null}
        </div>
      ) : null}

      <PublicPageSection
        event={event}
        editHref={editHref}
        publicHref={publicHref}
        isLive={isLive}
        canView={isLive}
        mediaCount={mediaCount}
      />
    </div>
  );
}

function PublicPageSection({
  event,
  editHref,
  publicHref,
  isLive,
  canView,
  mediaCount = 0,
}: {
  event: OrganizerEventDetailDto;
  editHref: string;
  publicHref: string;
  isLive: boolean;
  canView: boolean;
  mediaCount?: number;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
        Public page
      </h2>
      <div className="flex flex-col gap-4 rounded-2xl border border-[#2a2a2a] bg-[#141414] p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(160deg,#1c1207_0%,#141414_55%,#0f0f0f_100%)] sm:h-28 sm:w-28"
          aria-hidden
        >
          {event.posterUrl ? (
            <img src={event.posterUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
              <span className="font-display text-lg tracking-[0.08em] text-text-muted/40">+</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-text-muted/50">
                Poster
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="truncate font-display text-2xl tracking-[0.04em] text-text-primary sm:text-3xl">
            {event.title}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
              {eventTypeDisplayLabel(event.eventType)}
            </span>
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]',
                isLive ? 'bg-accent-2 text-bg' : 'bg-[#1e1e1e] text-text-secondary',
              )}
            >
              {isLive ? 'Live' : statusLabel(event.status)}
            </span>
            {!isLive ? (
              <span className="text-xs text-text-muted">Not live yet</span>
            ) : null}
          </div>
          {mediaCount > 0 ? (
            <p className="text-xs text-text-muted">
              Media · {String(mediaCount)} link{mediaCount === 1 ? '' : 's'}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {canView ? (
              <Link
                href={publicHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#2a2a2a] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-text-primary transition-colors hover:border-accent/40"
              >
                View event
                <ByndIcon name="external" className="size-3.5" aria-hidden />
              </Link>
            ) : null}
            <Link
              href={editHref}
              className="inline-flex min-h-10 items-center rounded-xl bg-accent px-4 text-xs font-semibold uppercase tracking-[0.12em] text-bg"
            >
              Edit event
            </Link>
            <Link
              href={`${editHref}#media`}
              className="inline-flex min-h-10 items-center rounded-xl border border-transparent px-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted transition-colors hover:text-text-secondary"
            >
              Manage media
            </Link>
          </div>
        </div>
      </div>
    </section>
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
  if (item.id === 'basics') {
    return { ...item, icon: 'media' };
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
  value: string | number;
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
