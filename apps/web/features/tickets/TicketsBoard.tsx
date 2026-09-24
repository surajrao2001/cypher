'use client';

import type { RegistrationDto } from '@cypher/contracts';
import { formatEventDate, partitionRegistrationsForTickets } from '@cypher/utils';
import { routes } from '@cypher/contracts';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';

import { BrandHeroBanner } from '@/components/brand/BrandHeroBanner';
import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { EventPoster } from '@/features/discovery/EventPoster';
import { isLiveCompanionRelevant } from '@/features/live/live-view-model';
import { EmptyState } from '@/features/shell/EmptyState';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { LEGAL_URLS } from '@/lib/release';
import { cn } from '@/lib/utils';

type PassTab = 'upcoming' | 'used' | 'cancelled';

function PassesHero() {
  /* Banner already bakes MY PASSES / YOUR TICKETS… — no HTML title overlay */
  return (
    <BrandHeroBanner
      desktopSrc="/bynd8/passes-hero-desktop-v2.jpg"
      mobileSrc="/bynd8/passes-hero-mobile-v2.jpg"
      priority
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-[#080808] via-[#080808]/70 to-transparent"
      />
    </BrandHeroBanner>
  );
}

function ticketIdLabel(code: string): string {
  const clean = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length >= 8) {
    return `#BN8-${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
  }
  return `#${code}`;
}

function PassRowCard({
  ticket,
  status,
}: {
  ticket: RegistrationDto;
  status: 'CONFIRMED' | 'PENDING' | 'USED' | 'CANCELLED';
}) {
  const [qr, setQr] = useState<string | null>(null);
  const isViewer = ticket.category.entryType === 'viewer';
  const subtitle = isViewer ? 'Audience Pass' : ticket.category.name;
  const typeHint = isViewer
    ? 'AUDIENCE'
    : ticket.category.entryType === 'team'
      ? 'JAM / CYPHER'
      : 'BATTLE';

  useEffect(() => {
    if (!ticket.ticketQrPayload) {
      setQr(null);
      return;
    }
    void QRCode.toDataURL(ticket.ticketQrPayload, {
      margin: 1,
      width: 180,
      color: { dark: '#0B0B0B', light: '#F4F2ED' },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [ticket.ticketQrPayload]);

  function downloadPass() {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `bynd8-pass-${ticket.registrationCode}.png`;
    a.click();
  }

  return (
    <article className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#121212]">
      <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-stretch lg:gap-4 lg:p-3.5">
        <Link
          href={`/events/${ticket.event.slug}`}
          className="relative h-36 w-full shrink-0 overflow-hidden rounded-md bg-[#0D0E0D] sm:h-40 lg:h-auto lg:w-[7.5rem]"
        >
          <EventPoster title={ticket.event.title} src={null} sizes="140px" />
          <span className="absolute left-1.5 top-1.5 font-display text-[9px] tracking-[0.1em] text-white/90">
            BYND8
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
              {typeHint}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]',
                status === 'CONFIRMED' && 'bg-accent-2 text-bg',
                status === 'PENDING' && 'bg-accent/25 text-accent',
                status === 'USED' && 'bg-white/10 text-white/60',
                status === 'CANCELLED' && 'bg-error/20 text-error',
              )}
            >
              {status}
            </span>
          </div>
          <h3 className="text-[1.15rem] font-semibold leading-tight text-white sm:text-[1.25rem]">
            {ticket.event.title}
          </h3>
          <p className="text-[12px] text-white/50">{subtitle}</p>
          <p className="mt-1 flex items-start gap-1.5 text-[11px] text-white/55">
            <ByndIcon name="calendar" className="mt-0.5 size-3.5 shrink-0 opacity-70" />
            <span>{formatEventDate(ticket.event.startTime)}</span>
          </p>
          <p className="flex items-start gap-1.5 text-[11px] text-accent">
            <ByndIcon name="pin" className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-1">{ticket.event.city}</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col justify-center border-white/[0.06] lg:border-l lg:pl-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            Ticket ID
          </p>
          <p className="mt-1 font-mono text-[12px] tracking-wide text-white/75">
            {ticketIdLabel(ticket.registrationCode)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-2 lg:w-[9.5rem]">
          {qr ? (
            <img
              src={qr}
              alt={`QR for ${ticket.registrationCode}`}
              className="size-[6.5rem] rounded-md bg-[#F4F2ED] p-1.5"
            />
          ) : (
            <div className="flex size-[6.5rem] items-center justify-center rounded-md border border-white/10 bg-[#0D0E0D] text-center text-[10px] text-white/40">
              QR pending
            </div>
          )}
          <p className="text-[10px] text-white/40">Show this at the venue.</p>
          <div className="flex w-full flex-col gap-1.5">
            {status === 'CONFIRMED' && isLiveCompanionRelevant(ticket.event.startTime) ? (
              <Button
                asChild
                className="h-9 rounded-md text-[11px] font-semibold normal-case tracking-normal"
              >
                <Link href={routes.eventLive(ticket.event.slug)}>Event Live</Link>
              </Button>
            ) : null}
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-md border-white/20 bg-transparent text-[11px] font-medium normal-case tracking-normal text-white hover:bg-white/5"
            >
              <Link href={`/events/${ticket.event.slug}`}>View event →</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!qr}
              onClick={downloadPass}
              className="h-9 rounded-md border-white/20 bg-transparent text-[11px] font-medium normal-case tracking-normal text-white hover:bg-white/5 disabled:opacity-40"
            >
              <ByndIcon name="external" className="size-3.5" />
              Download pass
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function PassesAside() {
  return (
    <aside className="space-y-3 lg:w-[16rem] lg:shrink-0 xl:w-[17.5rem]">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full justify-center gap-2 rounded-md border-white/15 bg-[#121212] text-[12px] font-medium normal-case tracking-normal text-white hover:bg-white/5"
        onClick={() => {
          /* Bulk download is per-pass for now */
        }}
      >
        <ByndIcon name="external" className="size-3.5" />
        Download all passes
      </Button>

      <div className="rounded-lg border border-white/[0.08] bg-[#121212] p-4">
        <div className="flex gap-3">
          <ByndIcon name="tickets" className="mt-0.5 size-5 shrink-0 text-accent" />
          <div>
            <p className="text-[13px] font-semibold text-white">Keep your passes handy</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/45">
              Show the QR at the door for check-in. Screenshot or download before you lose signal.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.08] bg-[#121212] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Need help?
        </p>
        <ul className="mt-3 space-y-2">
          {[
            { href: 'mailto:support@bynd8.in', label: 'Contact support', icon: 'megaphone' as const },
            { href: LEGAL_URLS.terms, label: 'View ticketing FAQ', icon: 'help' as const },
            { href: LEGAL_URLS.refunds, label: 'Event entry guidelines', icon: 'checkIn' as const },
          ].map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-2 rounded-md px-1 py-1.5 text-[12px] text-white/70 hover:bg-white/[0.04] hover:text-white"
              >
                <ByndIcon name={item.icon} className="size-3.5 text-white/40" />
                <span className="flex-1">{item.label}</span>
                <span aria-hidden className="text-white/30">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-white/[0.08]">
        <div className="relative h-28 w-full">
          <Image
            src="/bynd8/passes-hero-desktop-v2.jpg"
            alt=""
            fill
            sizes="280px"
            className="object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
            People · Events · Culture
          </p>
          <p className="mt-1 text-[12px] leading-snug text-white/85">
            It&apos;s more than a ticket. It&apos;s a bigger story.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function TicketsBoard() {
  const { token, api, ready, status, refresh } = useAuth();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<RegistrationDto[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PassTab>('upcoming');
  const reconciledOrderRef = useRef<string | null>(null);
  const tabSeeded = useRef(false);

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.listMyRegistrations();
      setItems(res.items);
      setError(null);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api, token]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [load, ready]);

  useEffect(() => {
    if (!ready || !token || status !== 'authenticated') return;
    const payment = searchParams.get('payment');
    const orderId = searchParams.get('order_id');
    if (payment !== 'return' || !orderId || reconciledOrderRef.current === orderId) return;
    reconciledOrderRef.current = orderId;
    void (async () => {
      try {
        await api.reconcileCashfreeOrder(orderId);
      } catch {
        // webhook may confirm later
      }
      await load();
    })();
  }, [api, load, ready, searchParams, status, token]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible' && token) void load();
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load, token]);

  const partitioned = partitionRegistrationsForTickets(items);
  const cancelled = useMemo(
    () => items.filter((row) => row.registrationStatus === 'cancelled'),
    [items],
  );
  const pending = partitioned.needsAction;

  useEffect(() => {
    if (loading || tabSeeded.current) return;
    tabSeeded.current = true;
    if (partitioned.upcoming.length > 0 || pending.length > 0) setTab('upcoming');
    else if (partitioned.past.length > 0) setTab('used');
    else if (cancelled.length > 0) setTab('cancelled');
  }, [
    cancelled.length,
    loading,
    partitioned.past.length,
    partitioned.upcoming.length,
    pending.length,
  ]);

  const upcomingCombined = [...pending, ...partitioned.upcoming];

  const tabs: Array<{ id: PassTab; label: string; count: number }> = [
    { id: 'upcoming', label: 'Upcoming', count: upcomingCombined.length },
    { id: 'used', label: 'Used', count: partitioned.past.length },
    { id: 'cancelled', label: 'Cancelled', count: cancelled.length },
  ];

  const activeList =
    tab === 'upcoming'
      ? upcomingCombined
      : tab === 'used'
        ? partitioned.past
        : cancelled;

  function statusFor(ticket: RegistrationDto): 'CONFIRMED' | 'PENDING' | 'USED' | 'CANCELLED' {
    if (ticket.registrationStatus === 'cancelled') return 'CANCELLED';
    if (tab === 'used') return 'USED';
    if (ticket.registrationStatus === 'pending_payment') return 'PENDING';
    return 'CONFIRMED';
  }

  return (
    <div className="w-full px-3 pb-10 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-5 py-4 sm:gap-6 sm:py-5">
        <PassesHero />

        {!ready || status === 'loading' || (token && loading) ? (
          <PageLoading variant="list" label="Loading passes" />
        ) : status !== 'authenticated' || !token ? (
          <EmptyState
            kicker="Passes"
            title="Sign in for your passes"
            body="Confirmed entries show here as a BYND8 Pass — name, category, and door QR."
            illustration="signIn"
          >
            <Button asChild className="h-10 rounded-md normal-case tracking-normal">
              <Link href={`${routes.login}?next=${routes.tickets}`}>Sign in</Link>
            </Button>
          </EmptyState>
        ) : error ? (
          <SoftError
            title="Couldn’t load tickets"
            error={error}
            onRetry={() => {
              void refresh().then(() => load());
            }}
          />
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap gap-2">
                {tabs.map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={cn(
                        'rounded-md border px-3.5 py-2 text-[12px] font-medium transition-colors',
                        active
                          ? 'border-accent text-white'
                          : 'border-white/10 bg-[#121212] text-white/50 hover:border-white/20 hover:text-white/80',
                      )}
                    >
                      {item.label}
                      <span className={cn('ml-1.5', active ? 'text-white/70' : 'text-white/35')}>
                        ({item.count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeList.length === 0 ? (
                <EmptyState
                  kicker={tabs.find((t) => t.id === tab)?.label ?? 'Passes'}
                  title={
                    tab === 'upcoming'
                      ? 'No upcoming passes'
                      : tab === 'used'
                        ? 'No used passes yet'
                        : 'No cancelled passes'
                  }
                  body={
                    tab === 'upcoming'
                      ? 'When you confirm a spot, the pass shows here for the door.'
                      : tab === 'used'
                        ? 'After a night ends, used passes archive here.'
                        : 'Cancelled entries will show up here.'
                  }
                  illustration={tab === 'cancelled' ? 'cancelled' : 'passes'}
                  className="py-10"
                >
                  <Button asChild variant="outline" className="h-10 rounded-md normal-case tracking-normal">
                    <Link href={routes.discover}>Find a cypher</Link>
                  </Button>
                </EmptyState>
              ) : (
                <ul className="space-y-3">
                  {activeList.map((ticket) => (
                    <li key={ticket.id}>
                      <PassRowCard ticket={ticket} status={statusFor(ticket)} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <PassesAside />
          </div>
        )}
      </div>
    </div>
  );
}
