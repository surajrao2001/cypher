'use client';

import type {
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';
import Link from 'next/link';

import {
  buildAttention,
  hasPaidEntry,
  isEventDay,
  isFreeOnlyEvent,
  isPastEvent,
  moneyFromRegistrations,
  type ControlDest,
} from '@/features/organize/event-control';
import { EventReadiness } from '@/features/organize/EventReadiness';
import {
  CountLabel,
  ObjectSurface,
  PosterThumb,
} from '@/features/organize/organizer-ui';
import { cn } from '@/lib/utils';

export function EventHomePanel({
  org,
  event,
  regs,
  payoutReady,
  checkedInCount,
  onNavigate,
  onPublished,
}: {
  org: OrganizerDto;
  event: OrganizerEventDetailDto;
  regs: OrganizerEventRegistrationsResponse | null;
  payoutReady: boolean | null;
  checkedInCount: number | null;
  onNavigate: (dest: ControlDest) => void;
  onPublished: (next: OrganizerEventDetailDto) => void;
}) {
  const isDraft = event.status === 'draft';
  const past = isPastEvent(event);
  const today = isEventDay(event.startTime);
  const freeOnly = isFreeOnlyEvent(event);
  const paid = hasPaidEntry(event);
  const compete =
    event.competeCategories ?? (event.categories ?? []).filter((c) => c.entryType !== 'viewer');
  const audienceCats =
    event.viewerCategories ?? (event.categories ?? []).filter((c) => c.entryType === 'viewer');
  const competeConfirmed = compete.reduce((n, c) => n + c.confirmedCount, 0);
  const competeCapacity = compete.reduce((n, c) => n + c.capacity, 0);
  const audienceConfirmed = audienceCats.reduce((n, c) => n + c.confirmedCount, 0);
  const confirmed = regs?.totals.confirmed ?? competeConfirmed + audienceConfirmed;
  const money = moneyFromRegistrations(regs);
  const attention = past || isDraft ? [] : buildAttention({ event, payoutReady, orgSlug: org.slug });
  const draftAttention = isDraft
    ? buildAttention({ event, payoutReady, orgSlug: org.slug }).filter((a) => a.id === 'payout')
    : [];
  const showAttention = [...draftAttention, ...attention];
  const checkInHref = routes.organizeEventCheckIn(org.slug, event.id);
  let destIndex = 0;

  if (isDraft) {
    return (
      <div className="space-y-8">
        <EventReadiness org={org} event={event} onPublished={onPublished} />
        <div className="space-y-0">
          <DestRow
            index={++destIndex}
            title="Entry"
            body={
              compete.length + audienceCats.length === 0
                ? 'Optional — add competition or audience when people need to register'
                : `${String(compete.length)} competition · ${String(audienceCats.length)} audience`
            }
            onClick={() => onNavigate('entry')}
          />
          <DestRow
            index={++destIndex}
            title="Event Page"
            body="Poster, details, media, updates"
            onClick={() => onNavigate('page')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="min-w-0 space-y-8">
        {today && !past ? (
          <section className="space-y-3 border-b border-border/70 pb-6">
            <p className="kicker text-accent">Today</p>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-display text-4xl tracking-[0.04em] md:text-5xl">
                  {confirmed} confirmed
                </p>
                {checkedInCount != null ? (
                  <p className="mt-1 text-sm text-text-secondary">
                    {checkedInCount} checked in
                  </p>
                ) : null}
              </div>
              <Link
                href={checkInHref}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline"
              >
                Open check-in →
              </Link>
            </div>
          </section>
        ) : null}

        {!past ? (
          <section className="space-y-2">
            <p className="font-display text-6xl tracking-[0.04em] text-text-primary md:text-7xl">
              {confirmed}
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
              Registered
            </p>
            {(compete.length > 0 || audienceCats.length > 0) && (
              <p className="text-sm text-text-secondary">
                {compete.length > 0
                  ? `${String(competeConfirmed)} / ${String(competeCapacity)} competition`
                  : null}
                {compete.length > 0 && audienceCats.length > 0 ? ' · ' : null}
                {audienceCats.length > 0 ? `${String(audienceConfirmed)} audience` : null}
              </p>
            )}
          </section>
        ) : (
          <section className="space-y-2">
            <p className="kicker text-text-muted">Past event</p>
            <p className="font-display text-4xl tracking-[0.04em]">{confirmed} registered</p>
            {checkedInCount != null ? (
              <p className="text-sm text-text-secondary">{checkedInCount} checked in</p>
            ) : null}
            {!freeOnly && money.collectedMinor > 0 ? (
              <p className="text-sm text-text-secondary">
                {formatMinorUnits(money.collectedMinor)} collected
              </p>
            ) : null}
          </section>
        )}

        {showAttention.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Needs attention
            </h2>
            <ul className="flex flex-wrap gap-2">
              {showAttention.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="rounded-sm border border-accent/35 bg-accent/5 px-4 py-3 text-left transition-colors hover:border-accent/60"
                    onClick={() => {
                      if (item.dest) onNavigate(item.dest);
                    }}
                  >
                    <p className="text-sm font-semibold text-text-primary">
                      {item.title} →
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary">{item.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="space-y-0">
          <DestRow
            index={++destIndex}
            title="People"
            body={`${String(confirmed)} registrations${
              competeConfirmed || audienceConfirmed
                ? ` · ${String(competeConfirmed)} competitors · ${String(audienceConfirmed)} audience`
                : ''
            }`}
            onClick={() => onNavigate('people')}
          />
          <DestRow
            index={++destIndex}
            title="Entry"
            body={
              compete.length + audienceCats.length === 0
                ? 'No entry yet'
                : `${String(compete.length)} competition · ${String(audienceCats.length)} audience${
                    compete[0]
                      ? ` · ${compete[0].name} ${String(compete[0].confirmedCount)}/${String(compete[0].capacity)}`
                      : ''
                  }`
            }
            onClick={() => onNavigate('entry')}
          />
          {!freeOnly || paid ? (
            <DestRow
              index={++destIndex}
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
          <DestRow
            index={++destIndex}
            title="Event Page"
            body="Poster · details · updates"
            onClick={() => onNavigate('page')}
          />
        </div>
      </div>

      {event.posterUrl ? (
        <div className="hidden lg:block">
          <ObjectSurface className="overflow-hidden p-2">
            <PosterThumb src={event.posterUrl} size="hero" />
          </ObjectSurface>
        </div>
      ) : null}
    </div>
  );
}

function DestRow({
  index,
  title,
  body,
  onClick,
}: {
  index: number;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-3 border-b border-border/70 py-4 text-left transition-colors hover:border-accent/50',
      )}
    >
      <span className="min-w-0 space-y-1">
        <CountLabel index={index} label={title} />
        <span className="block font-display text-xl tracking-[0.04em] text-text-primary md:text-2xl">
          {title}
        </span>
        <span className="mt-0.5 block text-sm text-text-secondary">{body}</span>
      </span>
      <span className="text-accent" aria-hidden>
        →
      </span>
    </button>
  );
}
