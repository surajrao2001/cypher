'use client';

import type {
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
  OrganizerRegistrationItemDto,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';
import { Clock3, IndianRupee, Landmark } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { EditEventDrawer } from '@/features/organize/EditEventDrawer';
import {
  hasPaidEntry,
  isFreeOnlyEvent,
  moneyFromRegistrations,
} from '@/features/organize/event-control';
import {
  OrganizerEmptyBlock,
  OrganizerEventSubHeader,
  OrganizerManageShell,
  OrganizerPill,
  OrganizerSearchRow,
  OrganizerSkeletonRows,
  OrganizerTabs,
  OrganizerUserAvatar,
  type OrganizerPillTone,
} from '@/features/organize/organizer-primitives';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { OrganizerWorkspace } from '@/features/organize/organizer-ui';
import { PayoutSetupPanel } from '@/features/organize/PayoutSetupPanel';
import { SoftError } from '@/features/shell/AsyncState';
import {
  useEventRegistrationsQuery,
  useInvalidateOrganize,
  useOrganizerBySlugQuery,
  useOrganizerEventQuery,
  usePayoutAccountQuery,
} from '@/features/organize/queries';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type MoneyTab = 'transactions' | 'payouts';

export function EventMoneyView({ slug, eventId }: { slug: string; eventId: string }) {
  return (
    <OrganizeGate>
      <EventMoneyScreen slug={slug} eventId={eventId} />
    </OrganizeGate>
  );
}

function EventMoneyScreen({ slug, eventId }: { slug: string; eventId: string }) {
  const invalidate = useInvalidateOrganize();
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<MoneyTab>('transactions');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const orgQuery = useOrganizerBySlugQuery(slug);
  const org = orgQuery.data ?? null;
  const eventQuery = useOrganizerEventQuery(org?.id, eventId, Boolean(org?.id));
  const event = eventQuery.data ?? null;
  const regsQuery = useEventRegistrationsQuery(org?.id, eventId, Boolean(org?.id));
  const regs = regsQuery.data ?? null;
  const paid = event ? hasPaidEntry(event) : false;
  const payoutQuery = usePayoutAccountQuery(org?.id, Boolean(org?.id) && paid);
  const payoutReady = !paid
    ? null
    : payoutQuery.data
      ? Boolean(payoutQuery.data.payoutReady)
      : payoutQuery.isPending
        ? null
        : false;
  const error = orgQuery.error ?? eventQuery.error;
  const loading =
    (orgQuery.isPending && !org) || (Boolean(org) && eventQuery.isPending && !event);

  const money = moneyFromRegistrations(regs);
  const pendingCount = useMemo(() => {
    if (!regs) return 0;
    return regs.items.filter(
      (r) => r.registrationStatus === 'pending_payment' || r.paymentStatus === 'pending',
    ).length;
  }, [regs]);

  const transactions = useMemo(() => {
    if (!regs) return [] as OrganizerRegistrationItemDto[];
    const q = query.trim().toLowerCase();
    return regs.items
      .filter((row) => row.totalAmountMinor > 0 || row.paymentStatus !== 'not_started')
      .filter((row) => {
        if (statusFilter === 'paid' && row.paymentStatus !== 'paid') return false;
        if (statusFilter === 'pending' && row.paymentStatus !== 'pending') return false;
        if (
          statusFilter === 'refunded' &&
          row.paymentStatus !== 'refunded' &&
          row.paymentStatus !== 'partially_refunded'
        ) {
          return false;
        }
        if (!q) return true;
        const payer =
          row.participants[0]?.displayName ?? row.entryName ?? row.registrationCode;
        const hay = [payer, row.categoryName, row.registrationCode, row.id].join(' ').toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const ta = new Date(a.confirmedAt ?? a.createdAt).getTime();
        const tb = new Date(b.confirmedAt ?? b.createdAt).getTime();
        return tb - ta;
      });
  }, [query, regs, statusFilter]);

  if (loading && !event) {
    return (
      <OrganizerWorkspace width="canvas" className="space-y-6">
        <div className="h-28 animate-pulse rounded-xl bg-white/[0.04]" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
        <OrganizerSkeletonRows count={5} />
      </OrganizerWorkspace>
    );
  }

  if (error && !event) {
    return (
      <div className="px-6 py-16">
        <SoftError
          title="Couldn’t load money"
          error={error}
          onRetry={() => {
            void orgQuery.refetch();
            void eventQuery.refetch();
            void regsQuery.refetch();
          }}
        />
      </div>
    );
  }

  if (!org || !event) return null;

  const manageHref = `${routes.organize}/${org.slug}/events/${event.id}`;
  const freeOnly = isFreeOnlyEvent(event);

  if (freeOnly && !paid) {
    return (
      <OrganizerManageShell>
        <OrganizerWorkspace width="canvas" className="relative z-10 space-y-5">
          <OrganizerEventSubHeader
            org={org}
            event={event}
            sectionLabel="Money"
            onEditEvent={() => setEditOpen(true)}
          />
          <OrganizerEmptyBlock
            title="No payments for this event"
            body="Money appears when Entry has a price greater than ₹0."
          >
            <Button asChild variant="outline" className="rounded-lg border-white/15">
              <Link href={manageHref}>Back to event</Link>
            </Button>
          </OrganizerEmptyBlock>
          <EditEventDrawer
            open={editOpen}
            onOpenChange={setEditOpen}
            organizerId={org.id}
            orgSlug={org.slug}
            event={event}
            onUpdated={(next) => invalidate.setEventCache(next)}
          />
        </OrganizerWorkspace>
      </OrganizerManageShell>
    );
  }

  return (
    <OrganizerManageShell>
      <OrganizerWorkspace width="canvas" className="relative z-10 space-y-5 sm:space-y-6">
        <OrganizerEventSubHeader
          org={org}
          event={event}
          sectionLabel="Money"
          onEditEvent={() => setEditOpen(true)}
        />
        <EditEventDrawer
          open={editOpen}
          onOpenChange={setEditOpen}
          organizerId={org.id}
          orgSlug={org.slug}
          event={event}
          onUpdated={(next) => {
            invalidate.setEventCache(next);
            invalidate.invalidateOrganizerEvents(org.id);
          }}
        />

        <motion.div
          initial={{ opacity: 0.88 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16 }}
          className="space-y-5"
        >
        {paid && payoutReady === false ? (
          <section className="space-y-4">
            <OrganizerEmptyBlock
              title="Set up payouts"
              body="Set up your details so BYND8 can send you money from paid registrations."
            >
              <Button asChild className="rounded-lg">
                <Link href={routes.organizePayouts(org.slug)}>Set up payouts</Link>
              </Button>
            </OrganizerEmptyBlock>
            <PayoutSetupPanel
              organizerId={org.id}
              orgName={org.orgName}
              embedded
              onReadyChange={() => {
                void payoutQuery.refetch();
              }}
            />
          </section>
        ) : (
          <>
            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
              <MetricCard
                icon={<IndianRupee className="size-4 text-accent" strokeWidth={1.75} />}
                value={formatMinorUnits(money.collectedMinor)}
                label="Total collected"
                hint={
                  money.pendingMinor > 0
                    ? `${formatMinorUnits(money.pendingMinor)} pending`
                    : undefined
                }
              />
              <MetricCard
                icon={<Clock3 className="size-4 text-amber-300" strokeWidth={1.75} />}
                value={formatMinorUnits(money.pendingMinor)}
                label="Pending"
                hint={
                  pendingCount > 0
                    ? `${String(pendingCount)} registration${pendingCount === 1 ? '' : 's'}`
                    : 'No pending payments'
                }
              />
              <MetricCard
                icon={<Landmark className="size-4 text-white/45" strokeWidth={1.75} />}
                value={payoutReady ? 'Ready' : '—'}
                label="Payouts"
                hint={
                  payoutReady
                    ? 'Payout account connected'
                    : 'Ledger not available — open payout setup'
                }
                className="sm:col-span-2 lg:col-span-1"
                action={
                  <Button asChild variant="outline" size="sm" className="mt-2 h-8 rounded-md border-white/12 text-[11px]">
                    <Link href={routes.organizePayouts(org.slug)}>
                      {payoutReady ? 'Manage payouts' : 'Set up'}
                    </Link>
                  </Button>
                }
              />
            </div>

            <OrganizerTabs
              ariaLabel="Money sections"
              items={[
                { id: 'transactions' as const, label: 'Transactions', count: transactions.length },
                { id: 'payouts' as const, label: 'Payouts' },
              ]}
              value={tab}
              onChange={setTab}
            />

            {tab === 'payouts' ? (
              <OrganizerEmptyBlock
                title="Payout ledger not in this view yet"
                body="Paid-out totals and payout history aren’t available from the current API. Manage your payout account instead."
              >
                <Button asChild variant="outline" className="rounded-lg border-white/15">
                  <Link href={routes.organizePayouts(org.slug)}>Open payout setup</Link>
                </Button>
              </OrganizerEmptyBlock>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <OrganizerSearchRow
                    value={query}
                    onChange={setQuery}
                    placeholder="Search by payer name, transaction ID..."
                    onFilterClick={() => setFilterOpen((o) => !o)}
                  />
                  {filterOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 z-20 mt-2 min-w-[11rem] rounded-lg border border-white/[0.1] bg-[#161716] py-1 shadow-lg"
                    >
                      {(
                        [
                          ['all', 'All'],
                          ['paid', 'Success'],
                          ['pending', 'Pending'],
                          ['refunded', 'Refunded'],
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

                {transactions.length === 0 ? (
                  <OrganizerEmptyBlock
                    title="No transactions yet"
                    body="Paid and pending registrations will show here."
                  />
                ) : (
                  <>
                    <div className="hidden overflow-hidden rounded-xl border border-white/[0.08] bg-[#111211]/80 md:block">
                      <table className="w-full table-fixed border-collapse text-left">
                        <thead>
                          <tr className="border-b border-white/[0.07] text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                            <th className="w-[8.5rem] px-4 py-3 font-semibold" scope="col">
                              Date
                            </th>
                            <th className="px-4 py-3 font-semibold" scope="col">
                              Payer
                            </th>
                            <th className="w-[12rem] px-4 py-3 font-semibold" scope="col">
                              Item
                            </th>
                            <th className="w-[6.5rem] px-4 py-3 font-semibold" scope="col">
                              Amount
                            </th>
                            <th className="w-[7rem] px-4 py-3 font-semibold" scope="col">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((row) => {
                            const payer =
                              row.participants[0]?.displayName ??
                              row.entryName ??
                              row.registrationCode;
                            return (
                              <tr
                                key={row.id}
                                className="h-14 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.025]"
                              >
                                <td className="px-4 text-[13px] text-white/55">
                                  {formatTxnDate(row.confirmedAt ?? row.createdAt)}
                                </td>
                                <td className="px-4">
                                  <div className="flex items-center gap-2.5">
                                    <OrganizerUserAvatar seed={row.id} />
                                    <span className="truncate text-[13px] font-semibold text-[#F4F4F1]">
                                      {payer}
                                    </span>
                                  </div>
                                </td>
                                <td className="truncate px-4 text-[13px] text-white/65">
                                  {row.categoryName}
                                </td>
                                <td className="px-4 text-[13px] font-semibold text-[#F4F4F1]">
                                  {formatMinorUnits(row.totalAmountMinor)}
                                </td>
                                <td className="px-4">
                                  <PaymentStatusPill status={row.paymentStatus} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <ul className="divide-y divide-white/[0.07] overflow-hidden rounded-xl border border-white/[0.08] bg-[#111211]/80 md:hidden">
                      {transactions.map((row) => {
                        const payer =
                          row.participants[0]?.displayName ??
                          row.entryName ??
                          row.registrationCode;
                        return (
                          <li
                            key={row.id}
                            className="flex items-start justify-between gap-3 px-3.5 py-3.5"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <p className="truncate text-[14px] font-semibold text-[#F4F4F1]">
                                {payer}
                              </p>
                              <p className="truncate text-[12px] text-white/45">{row.categoryName}</p>
                              <p className="text-[12px] text-white/35">
                                {formatTxnDate(row.confirmedAt ?? row.createdAt)}
                              </p>
                            </div>
                            <div className="shrink-0 space-y-1.5 text-right">
                              <p className="text-[14px] font-semibold text-[#F4F4F1]">
                                {formatMinorUnits(row.totalAmountMinor)}
                              </p>
                              <PaymentStatusPill status={row.paymentStatus} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            )}
          </>
        )}
        </motion.div>
      </OrganizerWorkspace>
    </OrganizerManageShell>
  );
}

function MetricCard({
  icon,
  value,
  label,
  hint,
  action,
  className,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-w-[11.5rem] shrink-0 rounded-xl border border-white/[0.08] bg-[#141514] px-4 py-3.5 sm:min-w-0',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[1.65rem] leading-none tracking-[0.04em] text-[#F4F4F1] sm:text-[1.85rem]">
            {value}
          </p>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/42">
            {label}
          </p>
          {hint ? <p className="mt-1 text-[12px] text-white/45">{hint}</p> : null}
          {action}
        </div>
      </div>
    </div>
  );
}

function PaymentStatusPill({ status }: { status: string }) {
  let tone: OrganizerPillTone = 'neutral';
  let label = status.replaceAll('_', ' ');
  if (status === 'paid') {
    tone = 'success';
    label = 'Success';
  } else if (status === 'pending') {
    tone = 'pending';
    label = 'Pending';
  } else if (status === 'refunded' || status === 'partially_refunded') {
    tone = 'failed';
    label = status === 'partially_refunded' ? 'Partial refund' : 'Refunded';
  } else if (status === 'failed') {
    tone = 'failed';
    label = 'Failed';
  }
  return <OrganizerPill tone={tone}>{label}</OrganizerPill>;
}

function formatTxnDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

/** Embedded panel kept for ManageView ?tab=money until fully routed away. */
export function EventMoneyPanel({
  org,
  event,
  regs,
}: {
  org: OrganizerDto;
  event: OrganizerEventDetailDto;
  regs: OrganizerEventRegistrationsResponse | null;
}) {
  void regs;
  return (
    <section className="space-y-3">
      <p className="text-sm text-text-secondary">Opening Money workspace…</p>
      <Button asChild>
        <Link href={routes.organizeEventMoney(org.slug, event.id)}>Go to Money</Link>
      </Button>
    </section>
  );
}
