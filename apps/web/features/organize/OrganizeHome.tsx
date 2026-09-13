'use client';

import { routes } from '@cypher/contracts';
import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { eventEffectiveEndIso, formatMinorUnits } from '@cypher/utils';
import {
  CalendarDays,
  CalendarRange,
  IndianRupee,
  MapPin,
  MoreHorizontal,
  Plus,
  Ticket,
  Trophy,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from '@/components/ui/dropdown';
import { toastInfo } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { hasPaidEntry } from '@/features/organize/event-control';
import {
  entryCopyForType,
  eventTypeDisplayLabel,
  eventTypeGroup,
} from '@/features/organize/event-type-copy';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { ensurePersonalOrganizer } from '@/features/organize/ensure-personal-organizer';
import {
  OrganizerEmptyBlock,
  OrganizerManageShell,
  OrganizerPill,
  OrganizerSearchRow,
  OrganizerTabs,
  type OrganizerPillTone,
} from '@/features/organize/organizer-primitives';
import {
  prefetchOrganizerEvent,
  useMyOrganizersQuery,
} from '@/features/organize/queries';
import { orgKeys } from '@/features/organize/queries/keys';
import { OrganizerWorkspace } from '@/features/organize/organizer-ui';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type EventTab = 'all' | 'live' | 'draft' | 'past' | 'cancelled';

type EventRow = {
  event: OrganizerEventDetailDto;
  org: OrganizerDto;
};

type CardKind = 'live' | 'draft' | 'past' | 'cancelled';

/** Match reference: `Sat, 18 Oct - 6:00 PM` */
function formatCardWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const weekday = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(d);
  const day = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(d);
  const month = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(d);
  return `${weekday}, ${day} ${month} - ${time}`;
}

function cardKind(event: OrganizerEventDetailDto, now: number): CardKind {
  if (event.status === 'draft') return 'draft';
  if (event.status === 'cancelled') return 'cancelled';
  if (
    event.status === 'completed' ||
    (event.status === 'published' &&
      new Date(eventEffectiveEndIso(event.startTime, event.endTime)).getTime() < now)
  ) {
    return 'past';
  }
  if (event.status === 'published' || event.status === 'registration_closed') {
    return 'live';
  }
  return 'past';
}

function cardPlace(event: OrganizerEventDetailDto): string {
  return [event.venue, event.city].filter(Boolean).join(', ');
}

function registeredCount(event: OrganizerEventDetailDto): number {
  return (event.categories ?? []).reduce((n, c) => n + c.confirmedCount, 0);
}

/** Approximate collected from confirmed × current sell price — only real category fields. */
function collectedMinor(event: OrganizerEventDetailDto): number {
  return (event.categories ?? []).reduce((n, c) => {
    const price = c.currentPriceMinor ?? c.priceMinor;
    return n + c.confirmedCount * price;
  }, 0);
}

function entryMetricLabel(event: OrganizerEventDetailDto): string | null {
  const compete = event.competeCategories ?? (event.categories ?? []).filter((c) => c.entryType !== 'viewer');
  const audience =
    event.viewerCategories ?? (event.categories ?? []).filter((c) => c.entryType === 'viewer');
  const copy = entryCopyForType(event.eventType);
  const group = eventTypeGroup(event.eventType);

  if (compete.length === 0 && audience.length === 0) {
    if (group === 'jam' || group === 'session' || group === 'other') return 'Open entry';
    return null;
  }

  if (group === 'battle') {
    if (compete.length > 0) {
      return `${String(compete.length)} competition${compete.length === 1 ? '' : 's'}`;
    }
  }

  if (group === 'workshop' && compete[0]) {
    const cat = compete[0];
    const price = cat.currentPriceMinor ?? cat.priceMinor;
    const priceBit = price > 0 ? `${formatMinorUnits(price)} · ` : '';
    return `${copy.competeTitle} ${priceBit}${String(cat.confirmedCount)}/${String(cat.capacity)} spots`;
  }

  return copy.entryHomeSummary(compete.length, audience.length);
}

export function OrganizeHome() {
  return (
    <OrganizeGate>
      <OrganizeHomeInner />
    </OrganizeGate>
  );
}

function OrganizeHomeInner() {
  const auth = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hostFilter, setHostFilter] = useState<string | 'all'>('all');
  const [tab, setTab] = useState<EventTab>('all');
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const orgsQuery = useMyOrganizersQuery();
  const orgs = orgsQuery.data ?? [];

  const eventQueries = useQueries({
    queries: orgs.map((org) => ({
      queryKey: orgKeys.organizerEvents(org.id),
      queryFn: async () => {
        const list = await auth.api.listOrganizerEvents(org.id);
        for (const event of list.items) {
          queryClient.setQueryData(orgKeys.event(event.id), event);
        }
        return list;
      },
      enabled: orgsQuery.isSuccess && orgs.length > 0,
      staleTime: 30_000,
    })),
  });

  const rows = useMemo(() => {
    if (!orgsQuery.isSuccess) return null;
    if (orgs.length === 0) return [] as EventRow[];
    if (eventQueries.some((q) => q.isPending && !q.data)) return null;
    const out: EventRow[] = [];
    orgs.forEach((org, i) => {
      const items = eventQueries[i]?.data?.items ?? [];
      for (const event of items) out.push({ event, org });
    });
    return out;
  }, [eventQueries, orgs, orgsQuery.isSuccess]);

  const loadError =
    orgsQuery.error ?? eventQueries.find((q) => q.error)?.error ?? null;

  const now = Date.now();

  const counts = useMemo(() => {
    if (!rows) return { all: 0, live: 0, draft: 0, past: 0, cancelled: 0 };
    let live = 0;
    let draft = 0;
    let past = 0;
    let cancelled = 0;
    for (const row of rows) {
      const kind = cardKind(row.event, now);
      if (kind === 'live') live += 1;
      else if (kind === 'draft') draft += 1;
      else if (kind === 'cancelled') cancelled += 1;
      else past += 1;
    }
    return { all: rows.length, live, draft, past, cancelled };
  }, [now, rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    let list = [...rows];
    if (hostFilter !== 'all') {
      list = list.filter((row) => row.org.slug === hostFilter);
    }
    list.sort(
      (a, b) =>
        new Date(b.event.startTime).getTime() - new Date(a.event.startTime).getTime(),
    );
    switch (tab) {
      case 'draft':
        list = list.filter((r) => cardKind(r.event, now) === 'draft');
        break;
      case 'live':
        list = list.filter((r) => cardKind(r.event, now) === 'live');
        break;
      case 'past':
        list = list.filter((r) => cardKind(r.event, now) === 'past');
        break;
      case 'cancelled':
        list = list.filter((r) => cardKind(r.event, now) === 'cancelled');
        break;
      default:
        break;
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const hay = [r.event.title, r.event.city, r.event.venue ?? '', r.org.orgName]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [hostFilter, now, query, rows, tab]);

  async function onCreate() {
    setCreating(true);
    try {
      if (orgs.length === 0) {
        await ensurePersonalOrganizer(auth.api, auth.me?.profile);
        await orgsQuery.refetch();
      }
      const slugHint =
        hostFilter !== 'all'
          ? hostFilter
          : orgs.length === 1
            ? orgs[0]!.slug
            : undefined;
      const q = slugHint ? `?host=${encodeURIComponent(slugHint)}` : '';
      router.push(`${routes.organize}/create${q}`);
    } catch {
      setCreating(false);
    }
  }

  function prefetchCard(orgId: string, eventId: string) {
    void prefetchOrganizerEvent(queryClient, auth.api, orgId, eventId);
  }

  return (
    <OrganizerManageShell glow="top-right">
      <OrganizerWorkspace width="canvas" className="relative z-10 space-y-6 sm:space-y-7">
        {/* Open page header */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Organize</p>
            <h1 className="display-title text-[2.35rem] leading-[0.9] tracking-[0.04em] text-[#F4F4F1] sm:text-[3.25rem] md:text-[3.75rem]">
              Your Events
            </h1>
            <p className="max-w-xl text-[14px] leading-relaxed text-white/55 sm:text-[15px]">
              Create, manage and grow your events. Bring people together through dance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0 sm:pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 gap-2 rounded-lg border-white/[0.12] bg-[#111211]/55 px-4 text-[13px] font-semibold text-[#F4F4F1] backdrop-blur-[6px] hover:border-white/20"
              onClick={() => toastInfo('Calendar view isn’t available yet.')}
            >
              <CalendarRange className="size-4" strokeWidth={1.75} aria-hidden />
              Calendar view
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={creating}
              onClick={() => void onCreate()}
              className="h-11 gap-2 rounded-lg px-4 text-[13px] font-bold tracking-[0.06em]"
            >
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              {creating ? 'Starting…' : 'Create event'}
            </Button>
          </div>
        </header>

        {orgs.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
              Hosting as
            </span>
            <select
              value={hostFilter}
              onChange={(e) => setHostFilter(e.target.value === 'all' ? 'all' : e.target.value)}
              className="h-9 rounded-lg border border-white/[0.1] bg-[#161716] px-3 text-sm text-[#F4F4F1]"
            >
              <option value="all">All hosts</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.slug}>
                  {org.orgName}
                </option>
              ))}
            </select>
            <Link
              href={`${routes.organize}/new`}
              className="text-xs text-white/42 underline underline-offset-2 hover:text-accent"
            >
              Create a host profile
            </Link>
          </div>
        ) : orgs.length === 1 ? (
          <p className="text-xs text-white/42">
            Hosting as {orgs[0]!.orgName}
            {' · '}
            <Link
              href={`${routes.organize}/new`}
              className="underline underline-offset-2 hover:text-accent"
            >
              Add another host profile
            </Link>
          </p>
        ) : null}

        {loadError && rows === null ? (
          <SoftError
            title="Couldn’t load events"
            error={loadError}
            onRetry={() => {
              void orgsQuery.refetch();
              for (const q of eventQueries) void q.refetch();
            }}
          />
        ) : rows === null ? (
          <PageLoading variant="cards" label="Loading your events" />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
              <OrganizerTabs
                ariaLabel="Event status"
                className="min-w-0 flex-1"
                items={[
                  { id: 'all' as const, label: 'All', count: counts.all },
                  { id: 'live' as const, label: 'Live', count: counts.live },
                  { id: 'draft' as const, label: 'Drafts', count: counts.draft },
                  { id: 'past' as const, label: 'Past', count: counts.past },
                  { id: 'cancelled' as const, label: 'Cancelled', count: counts.cancelled },
                ]}
                value={tab}
                onChange={setTab}
              />
              <div className="relative w-full lg:max-w-md">
                <OrganizerSearchRow
                  value={query}
                  onChange={setQuery}
                  placeholder="Search your events..."
                  onFilterClick={() => setFilterOpen((o) => !o)}
                  filterLabel="Filter"
                />
                {filterOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 min-w-[12rem] rounded-lg border border-white/[0.1] bg-[#161716] py-1 shadow-lg"
                  >
                    {(
                      [
                        ['all', 'All hosts'],
                        ...(orgs.length > 1
                          ? orgs.map((o) => [o.slug, o.orgName] as const)
                          : []),
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        role="menuitem"
                        className={cn(
                          'block w-full px-3 py-2 text-left text-[13px] hover:bg-white/[0.04]',
                          hostFilter === id ? 'text-accent' : 'text-[#F4F4F1]',
                        )}
                        onClick={() => {
                          setHostFilter(id);
                          setFilterOpen(false);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {filtered.length === 0 ? (
              <OrganizerEmptyBlock
                title={rows.length === 0 ? 'No events yet' : 'Nothing in this tab'}
                body={
                  rows.length === 0
                    ? 'Got something happening?'
                    : 'Switch tabs, clear search, or create another event.'
                }
              >
                <Button
                  type="button"
                  disabled={creating}
                  onClick={() => void onCreate()}
                  className="rounded-lg"
                >
                  <Plus className="mr-1.5 size-3.5" strokeWidth={2} aria-hidden />
                  Create event
                </Button>
              </OrganizerEmptyBlock>
            ) : (
              <ul className="grid gap-3.5 sm:gap-4 lg:grid-cols-2">
                {filtered.map(({ event, org }) => (
                  <li key={event.id}>
                    <YourEventCard
                      event={event}
                      org={org}
                      showHost={orgs.length > 1}
                      now={now}
                      onPrefetch={() => prefetchCard(org.id, event.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </OrganizerWorkspace>
    </OrganizerManageShell>
  );
}

function YourEventCard({
  event,
  org,
  showHost,
  now,
  onPrefetch,
}: {
  event: OrganizerEventDetailDto;
  org: OrganizerDto;
  showHost: boolean;
  now: number;
  onPrefetch?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const kind = cardKind(event, now);
  const place = cardPlace(event);
  const when = formatCardWhen(event.startTime);
  const registered = registeredCount(event);
  const entryLabel = entryMetricLabel(event);
  const money = collectedMinor(event);
  const paid = hasPaidEntry(event);
  const manageHref = `${routes.organize}/${org.slug}/events/${event.id}`;
  const publicHref = `${routes.events}/${event.slug}`;
  const editHref = `${routes.organize}/${org.slug}/events/${event.id}`;
  const reportsHref = paid
    ? routes.organizeEventMoney(org.slug, event.id)
    : routes.organizeEventPeople(org.slug, event.id);

  const statusTone: OrganizerPillTone =
    kind === 'live' ? 'live' : kind === 'draft' ? 'neutral' : 'neutral';
  const statusLabelText =
    kind === 'live'
      ? 'Live'
      : kind === 'draft'
        ? 'Draft'
        : kind === 'cancelled'
          ? 'Cancelled'
          : 'Past';

  return (
    <article
      className="group flex h-full flex-col gap-3.5 rounded-xl border border-white/[0.08] bg-[#141514] p-3 transition-[border-color,background-color] duration-150 hover:border-white/[0.14] sm:flex-row sm:gap-4 sm:p-3.5"
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
    >
      <Link
        href={manageHref}
        className="relative mx-auto block h-[8.5rem] w-[6.25rem] shrink-0 sm:mx-0 sm:h-[9.5rem] sm:w-[7rem]"
        onClick={onPrefetch}
        onPointerEnter={onPrefetch}
        onFocus={onPrefetch}
      >
        <motion.div
          layoutId={reduceMotion ? undefined : `event-poster-${event.id}`}
          className="relative h-full w-full overflow-hidden rounded-lg bg-[#111211] shadow-[0_12px_28px_-16px_rgba(0,0,0,0.9)]"
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        >
          {event.posterUrl ? (
            <img src={event.posterUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
              <span className="font-display text-lg tracking-[0.08em] text-white/25">+</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/28">
                Poster
              </span>
            </div>
          )}
        </motion.div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
              {eventTypeDisplayLabel(event.eventType)}
            </span>
            <OrganizerPill tone={statusTone}>{statusLabelText}</OrganizerPill>
          </div>
          <Dropdown>
            <DropdownTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="More actions"
                className="size-8 shrink-0 text-white/40 hover:text-[#F4F4F1]"
              >
                <MoreHorizontal className="size-4" strokeWidth={1.75} />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem onSelect={() => { window.location.href = manageHref; }}>
                Open event
              </DropdownItem>
              {kind === 'live' || kind === 'past' ? (
                <DropdownItem
                  onSelect={() => {
                    window.open(publicHref, '_blank', 'noopener,noreferrer');
                  }}
                >
                  View public page
                </DropdownItem>
              ) : null}
            </DropdownContent>
          </Dropdown>
        </div>

        <Link href={manageHref} className="min-w-0" onClick={onPrefetch} onPointerEnter={onPrefetch}>
          <motion.h2
            layoutId={reduceMotion ? undefined : `event-title-${event.id}`}
            className="display-title truncate text-[1.35rem] leading-[0.95] tracking-[0.04em] text-[#F4F4F1] sm:text-[1.55rem]"
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            {event.title}
          </motion.h2>
        </Link>

        <div className="space-y-1 text-[12px] text-white/55 sm:text-[13px]">
          {when ? (
            <p className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0 text-white/30" strokeWidth={1.75} />
              <span className="truncate">{when}</span>
            </p>
          ) : null}
          {place ? (
            <p className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-white/30" strokeWidth={1.75} />
              <span className="truncate">{place}</span>
            </p>
          ) : null}
          {showHost ? <p className="truncate text-white/35">{org.orgName}</p> : null}
        </div>

        <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[12px] text-white/50">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5 text-white/30" strokeWidth={1.75} aria-hidden />
            {registered} registered
          </span>
          {entryLabel ? (
            <span className="inline-flex items-center gap-1.5">
              {eventTypeGroup(event.eventType) === 'battle' ? (
                <Trophy className="size-3.5 text-white/30" strokeWidth={1.75} aria-hidden />
              ) : (
                <Ticket className="size-3.5 text-white/30" strokeWidth={1.75} aria-hidden />
              )}
              <span className="truncate">{entryLabel}</span>
            </span>
          ) : null}
          {paid && money > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <IndianRupee className="size-3.5 text-accent" strokeWidth={1.75} aria-hidden />
              {formatMinorUnits(money)} collected
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {kind === 'live' ? (
            <>
              <CardAction href={publicHref} external>
                View event
              </CardAction>
              <CardAction href={manageHref} accent>
                Manage event
              </CardAction>
            </>
          ) : null}
          {kind === 'draft' ? (
            <>
              <CardAction href={editHref}>Edit draft</CardAction>
              <CardAction href={publicHref} external>
                Preview
              </CardAction>
            </>
          ) : null}
          {kind === 'past' || kind === 'cancelled' ? (
            <>
              <CardAction href={publicHref} external>
                View event
              </CardAction>
              <CardAction href={reportsHref}>View reports</CardAction>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function CardAction({
  href,
  children,
  accent,
  external,
}: {
  href: string;
  children: ReactNode;
  accent?: boolean;
  external?: boolean;
}) {
  return (
    <Button
      asChild
      size="sm"
      variant="outline"
      className={cn(
        'h-9 flex-1 rounded-md border-white/12 bg-[#111211]/80 px-3 text-[12px] font-semibold sm:flex-none sm:min-w-[7.5rem]',
        accent && 'border-accent/55 text-accent hover:border-accent hover:bg-accent/10',
      )}
    >
      <Link
        href={href}
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {children}
      </Link>
    </Button>
  );
}
