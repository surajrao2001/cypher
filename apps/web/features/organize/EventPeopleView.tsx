'use client';

import type {
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
  OrganizerRegistrationItemDto,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { EditEventDrawer } from '@/features/organize/EditEventDrawer';
import {
  OrganizerEmptyBlock,
  OrganizerEventSubHeader,
  OrganizerPill,
  OrganizerSearchRow,
  OrganizerSkeletonRows,
  OrganizerTabs,
  OrganizerUserAvatar,
  type OrganizerPillTone,
} from '@/features/organize/organizer-primitives';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { OrganizerWorkspace } from '@/features/organize/organizer-ui';
import { SoftError, friendlyError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type PeopleFilter = 'all' | 'competitors' | 'audience' | 'checked_in';
type StatusFilter = 'all' | 'confirmed' | 'pending' | 'checked_in';

const PAGE_SIZE = 10;

export function EventPeopleView({ slug, eventId }: { slug: string; eventId: string }) {
  return (
    <OrganizeGate>
      <EventPeoplePanel slug={slug} eventId={eventId} />
    </OrganizeGate>
  );
}

function EventPeoplePanel({ slug, eventId }: { slug: string; eventId: string }) {
  const auth = useAuth();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [event, setEvent] = useState<OrganizerEventDetailDto | null>(null);
  const [data, setData] = useState<OrganizerEventRegistrationsResponse | null>(null);
  const [checkedAt, setCheckedAt] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<PeopleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const organizer = await auth.api.getMyOrganizerBySlug(slug);
        const [detail, regs, checkIns] = await Promise.all([
          auth.api.getOrganizerEvent(organizer.id, eventId),
          auth.api.listOrganizerEventRegistrations(organizer.id, eventId),
          auth.api.listCheckIns(organizer.id, eventId).catch(() => null),
        ]);
        if (cancelled) return;
        setOrg(organizer);
        setEvent(detail);
        setData(regs);
        const map = new Map<string, string>();
        for (const c of checkIns?.items ?? []) {
          map.set(c.registrationId, c.checkedInAt);
        }
        setCheckedAt(map);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.api, eventId, reloadKey, slug]);

  const viewerIds = useMemo(() => {
    const viewers =
      event?.viewerCategories ?? (event?.categories ?? []).filter((c) => c.entryType === 'viewer');
    return new Set((viewers ?? []).map((c) => c.id));
  }, [event]);

  const filtered = useMemo(() => {
    if (!data) return [] as OrganizerRegistrationItemDto[];
    const q = query.trim().toLowerCase();
    return data.items.filter((row) => {
      const isAudience = viewerIds.has(row.categoryId);
      const isChecked = checkedAt.has(row.id);
      if (filter === 'competitors' && isAudience) return false;
      if (filter === 'audience' && !isAudience) return false;
      if (filter === 'checked_in' && !isChecked) return false;
      if (statusFilter === 'confirmed' && row.registrationStatus !== 'confirmed') return false;
      if (
        statusFilter === 'pending' &&
        row.registrationStatus !== 'pending_payment'
      ) {
        return false;
      }
      if (statusFilter === 'checked_in' && !isChecked) return false;
      if (!q) return true;
      const hay = [
        row.entryName ?? '',
        row.registrationCode,
        row.categoryName,
        ...row.participants.map((p) => p.displayName),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [checkedAt, data, filter, query, statusFilter, viewerIds]);

  const counts = useMemo(() => {
    if (!data) return { all: 0, competitors: 0, audience: 0, checked_in: 0 };
    let competitors = 0;
    let audience = 0;
    for (const row of data.items) {
      if (viewerIds.has(row.categoryId)) audience += 1;
      else competitors += 1;
    }
    return {
      all: data.items.length,
      competitors,
      audience,
      checked_in: checkedAt.size,
    };
  }, [checkedAt, data, viewerIds]);

  useEffect(() => {
    setPage(1);
  }, [filter, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  async function checkInRow(row: OrganizerRegistrationItemDto) {
    if (!org || checkedAt.has(row.id)) return;
    setCheckingId(row.id);
    const tid = toastPending('Checking in…');
    try {
      await auth.api.checkIn(org.id, eventId, {
        registrationCode: row.registrationCode,
        channel: 'MANUAL',
      });
      setCheckedAt((prev) => {
        const next = new Map(prev);
        next.set(row.id, new Date().toISOString());
        return next;
      });
      toastResolve(tid, 'Checked in');
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, friendlyError(err));
    } finally {
      setCheckingId(null);
    }
  }

  if (loading && !data) {
    return (
      <OrganizerWorkspace width="canvas" className="space-y-6">
        <div className="h-28 animate-pulse rounded-xl bg-white/[0.04]" />
        <OrganizerSkeletonRows count={6} />
      </OrganizerWorkspace>
    );
  }
  if (error && !event) {
    return (
      <div className="px-6 py-16">
        <SoftError
          title="Couldn’t load people"
          error={error}
          onRetry={() => setReloadKey((n) => n + 1)}
        />
      </div>
    );
  }
  if (!org || !event || !data) return null;

  const entryHref = routes.organizeEventEntry(org.slug, event.id);
  const checkInHref = routes.organizeEventCheckIn(org.slug, event.id);

  const filters: Array<{ id: PeopleFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'competitors', label: 'Competitors', count: counts.competitors },
    { id: 'audience', label: 'Audience', count: counts.audience },
    { id: 'checked_in', label: 'Checked in', count: counts.checked_in },
  ];

  return (
    <div className="relative min-h-[70vh] bg-[#080908]">
      <OrganizerWorkspace width="canvas" className="relative z-10 space-y-5 sm:space-y-6">
        <OrganizerEventSubHeader
          org={org}
          event={event}
          sectionLabel="People"
          onEditEvent={() => setEditOpen(true)}
        />

        <EditEventDrawer
          open={editOpen}
          onOpenChange={setEditOpen}
          organizerId={org.id}
          orgSlug={org.slug}
          event={event}
          onUpdated={(next) => {
            setEvent(next);
            setReloadKey((n) => n + 1);
          }}
        />

        {data.categories.length === 0 ? (
          <OrganizerEmptyBlock
            title="No registrations yet"
            body="Add a competition or audience pass to start taking registrations."
          >
            <Button asChild variant="outline" size="sm" className="rounded-lg border-white/15">
              <Link href={entryHref}>Add Entry</Link>
            </Button>
          </OrganizerEmptyBlock>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <OrganizerTabs
              ariaLabel="People filters"
              items={filters}
              value={filter}
              onChange={setFilter}
            />

            <div className="relative">
              <OrganizerSearchRow
                value={query}
                onChange={setQuery}
                placeholder="Search people by name, email or pass ID..."
                onFilterClick={() => setFilterOpen((o) => !o)}
                filterLabel="Filter"
              />
              {filterOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 min-w-[11rem] rounded-lg border border-white/[0.1] bg-[#161716] py-1 shadow-lg"
                >
                  {(
                    [
                      ['all', 'All statuses'],
                      ['confirmed', 'Confirmed'],
                      ['pending', 'Pending'],
                      ['checked_in', 'Checked in'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="menuitem"
                      className={cn(
                        'block w-full px-3 py-2 text-left text-[13px] hover:bg-white/[0.04]',
                        statusFilter === id ? 'text-accent' : 'text-[#F4F4F1]',
                      )}
                      onClick={() => {
                        setStatusFilter(id);
                        setFilterOpen(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {filtered.length === 0 ? (
              <OrganizerEmptyBlock
                title="Nobody matches"
                body="Try another filter or clear search."
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-white/15"
                  onClick={() => {
                    setFilter('all');
                    setStatusFilter('all');
                    setQuery('');
                  }}
                >
                  Clear
                </Button>
              </OrganizerEmptyBlock>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-xl border border-white/[0.08] bg-[#111211]/80 md:block">
                  <table className="w-full table-fixed border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/[0.07] text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                        <th className="w-10 px-3 py-3 font-semibold" scope="col">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="px-3 py-3 font-semibold" scope="col">
                          Name
                        </th>
                        <th className="w-[7.5rem] px-3 py-3 font-semibold" scope="col">
                          Role
                        </th>
                        <th className="w-[9rem] px-3 py-3 font-semibold" scope="col">
                          Pass / Entry
                        </th>
                        <th className="w-[8rem] px-3 py-3 font-semibold" scope="col">
                          Status
                        </th>
                        <th className="w-[7.5rem] px-3 py-3 font-semibold" scope="col">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((row) => {
                        const isAudience = viewerIds.has(row.categoryId);
                        const name =
                          row.participants[0]?.displayName ??
                          row.entryName ??
                          row.registrationCode;
                        const checked = checkedAt.has(row.id);
                        return (
                          <tr
                            key={row.id}
                            className="h-16 border-b border-white/[0.06] transition-colors duration-150 last:border-0 hover:bg-white/[0.025]"
                          >
                            <td className="px-3 align-middle">
                              <input
                                type="checkbox"
                                className="size-3.5 rounded border-white/20 bg-transparent"
                                aria-label={`Select ${name}`}
                              />
                            </td>
                            <td className="px-3 align-middle">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <OrganizerUserAvatar seed={row.id} />
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-semibold text-[#F4F4F1]">
                                    {name}
                                  </p>
                                  {row.entryName && row.entryName !== name ? (
                                    <p className="truncate text-[12px] text-white/42">
                                      {row.entryName}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 align-middle">
                              <OrganizerPill tone="neutral">
                                {isAudience ? 'Audience' : 'Competitor'}
                              </OrganizerPill>
                            </td>
                            <td className="px-3 align-middle">
                              <span className="truncate text-[13px] text-white/65">
                                {row.categoryName}
                              </span>
                            </td>
                            <td className="px-3 align-middle">
                              <PeopleStatusPill
                                status={row.registrationStatus}
                                checkedIn={checked}
                              />
                            </td>
                            <td className="px-3 align-middle">
                              {checked ? (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-md border-white/12 px-3 text-[11px] font-bold tracking-[0.08em]"
                                >
                                  <Link href={checkInHref}>View</Link>
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={checkingId === row.id}
                                  onClick={() => void checkInRow(row)}
                                  className="h-8 rounded-md px-3 text-[11px] font-bold tracking-[0.08em]"
                                >
                                  {checkingId === row.id ? '…' : 'Check in'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list */}
                <ul className="divide-y divide-white/[0.07] overflow-hidden rounded-xl border border-white/[0.08] bg-[#111211]/80 md:hidden">
                  {pageItems.map((row) => {
                    const isAudience = viewerIds.has(row.categoryId);
                    const name =
                      row.participants[0]?.displayName ?? row.entryName ?? row.registrationCode;
                    const checked = checkedAt.has(row.id);
                    return (
                      <li key={row.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
                          onClick={() => {
                            if (!checked) void checkInRow(row);
                          }}
                        >
                          <OrganizerUserAvatar seed={row.id} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold text-[#F4F4F1]">
                              {name}
                            </p>
                            <p className="truncate text-[12px] uppercase tracking-[0.06em] text-white/42">
                              {isAudience ? 'Audience' : 'Competitor'} · {row.categoryName}
                            </p>
                          </div>
                          <PeopleStatusPill
                            status={row.registrationStatus}
                            checkedIn={checked}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[12px] text-white/42">
                  <p>
                    Showing {rangeStart}–{rangeEnd} of {filtered.length}
                  </p>
                  {totalPages > 1 ? (
                    <div className="flex items-center gap-1">
                      {pageNumbers(pageSafe, totalPages).map((n, idx) =>
                        n === '…' ? (
                          <span key={`e-${String(idx)}`} className="px-1">
                            …
                          </span>
                        ) : (
                          <button
                            key={n}
                            type="button"
                            aria-current={n === pageSafe ? 'page' : undefined}
                            onClick={() => setPage(n)}
                            className={cn(
                              'inline-flex size-8 items-center justify-center rounded-md text-[12px] font-semibold transition-colors',
                              n === pageSafe
                                ? 'border border-white/15 text-[#F4F4F1]'
                                : 'text-white/45 hover:text-[#F4F4F1]',
                            )}
                          >
                            {n}
                          </button>
                        ),
                      )}
                      {pageSafe < totalPages ? (
                        <button
                          type="button"
                          aria-label="Next page"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          className="inline-flex size-8 items-center justify-center rounded-md text-white/45 hover:text-[#F4F4F1]"
                        >
                          ›
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        )}
      </OrganizerWorkspace>
    </div>
  );
}

function PeopleStatusPill({
  status,
  checkedIn,
}: {
  status: string;
  checkedIn: boolean;
}) {
  if (checkedIn) {
    return <OrganizerPill tone="checked_in">Checked in</OrganizerPill>;
  }
  let tone: OrganizerPillTone = 'neutral';
  let label = status.replaceAll('_', ' ');
  if (status === 'confirmed') {
    tone = 'confirmed';
    label = 'Confirmed';
  } else if (status === 'pending_payment') {
    tone = 'pending';
    label = 'Pending';
  }
  return <OrganizerPill tone={tone}>{label}</OrganizerPill>;
}

function pageNumbers(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: Array<number | '…'> = [1];
  if (current > 3) out.push('…');
  for (let n = Math.max(2, current - 1); n <= Math.min(total - 1, current + 1); n += 1) {
    out.push(n);
  }
  if (current < total - 2) out.push('…');
  out.push(total);
  return out;
}
