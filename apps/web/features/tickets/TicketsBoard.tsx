'use client';

import type { RegistrationDto } from '@cypher/contracts';
import { formatEventDate, formatMinorUnits, partitionRegistrationsForTickets } from '@cypher/utils';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { EmptyState } from '@/features/shell/EmptyState';
import { cn } from '@/lib/utils';

type WalletTab = 'needs' | 'upcoming' | 'past';

export function TicketsBoard() {
  const { token, api, ready, status, refresh } = useAuth();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<RegistrationDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<WalletTab>('upcoming');
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
      setError(err instanceof Error ? err.message : 'Could not load tickets');
    } finally {
      setLoading(false);
    }
  }, [api, token]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    void load();
  }, [load, ready]);

  useEffect(() => {
    if (!ready || !token || status !== 'authenticated') {
      return;
    }
    const payment = searchParams.get('payment');
    const orderId = searchParams.get('order_id');
    if (payment !== 'return' || !orderId || reconciledOrderRef.current === orderId) {
      return;
    }
    reconciledOrderRef.current = orderId;
    void (async () => {
      try {
        await api.reconcileCashfreeOrder(orderId);
      } catch {
        // Still refresh list; webhook may confirm later in prod.
      }
      await load();
    })();
  }, [api, load, ready, searchParams, status, token]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible' && token) {
        void load();
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load, token]);

  const partitioned = partitionRegistrationsForTickets(items);

  useEffect(() => {
    if (loading || tabSeeded.current) return;
    tabSeeded.current = true;
    if (partitioned.needsAction.length > 0) setTab('needs');
    else if (partitioned.upcoming.length > 0) setTab('upcoming');
    else if (partitioned.past.length > 0) setTab('past');
  }, [loading, partitioned.needsAction.length, partitioned.upcoming.length, partitioned.past.length]);

  if (!ready || status === 'loading' || loading) {
    return <p className="mt-10 text-sm text-text-secondary">Loading tickets…</p>;
  }

  if (status !== 'authenticated' || !token) {
    return (
      <EmptyState
        className="mt-10"
        kicker="Wallet"
        title="Sign in to see tickets"
        body="Confirmed entries show here with a registration code and QR."
      >
        <Button asChild>
          <Link href={`${routes.login}?next=${routes.tickets}`}>Sign in</Link>
        </Button>
      </EmptyState>
    );
  }

  if (error) {
    return (
      <div className="mt-10 space-y-3">
        <p className="text-sm text-error">{error}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void refresh().then(() => load());
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const { needsAction, upcoming, past } = partitioned;

  if (needsAction.length === 0 && upcoming.length === 0 && past.length === 0) {
    return (
      <EmptyState
        className="mt-10"
        kicker="Wallet"
        title="No tickets yet"
        body="Register for an event — confirmed passes land here with a QR."
      >
        <Button asChild>
          <Link href={routes.discover}>Find a cypher</Link>
        </Button>
      </EmptyState>
    );
  }

  const tabs: Array<{ id: WalletTab; label: string; count: number }> = [
    { id: 'needs', label: 'Needs action', count: needsAction.length },
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'past', label: 'Past', count: past.length },
  ];

  const activeList =
    tab === 'needs' ? needsAction : tab === 'upcoming' ? upcoming : past;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex gap-5 border-b border-border">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'border-b-2 px-0.5 py-2.5 text-[13.5px] font-semibold transition-colors',
              tab === item.id
                ? 'border-accent text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary',
            )}
          >
            {item.label}
            <span className="ml-1.5 text-text-muted">({item.count})</span>
          </button>
        ))}
      </div>

      {activeList.length === 0 ? (
        <p className="py-8 text-sm text-text-muted">Nothing in this tab.</p>
      ) : (
        <ul className="space-y-4">
          {activeList.map((ticket) => (
            <li key={ticket.id}>
              {tab === 'needs' ? (
                <TicketCard
                  ticket={ticket}
                  variant="hold"
                  onConfirmFree={
                    ticket.totalAmountMinor === 0
                      ? async () => {
                          await api.confirmFreeRegistration(ticket.id);
                          await load();
                        }
                      : undefined
                  }
                  onConfirmPayment={
                    ticket.totalAmountMinor > 0
                      ? async () => {
                          await api.reconcileRegistrationCheckout(ticket.id);
                          await load();
                        }
                      : undefined
                  }
                />
              ) : (
                <TicketCard ticket={ticket} variant={tab === 'past' ? 'past' : 'upcoming'} />
              )}
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="ghost" size="sm" onClick={() => void load()}>
        Refresh
      </Button>
    </div>
  );
}

function categoryLabel(ticket: RegistrationDto): string {
  return ticket.category.entryType === 'viewer' ? 'Viewers pass' : ticket.category.name;
}

function TicketCard({
  ticket,
  variant,
  onConfirmFree,
  onConfirmPayment,
}: {
  ticket: RegistrationDto;
  variant: 'hold' | 'upcoming' | 'past';
  onConfirmFree?: () => Promise<void>;
  onConfirmPayment?: () => Promise<void>;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const prominentQr = variant === 'upcoming';
  const quiet = variant === 'past';

  useEffect(() => {
    if (!ticket.ticketQrPayload || variant === 'hold') {
      setQr(null);
      return;
    }
    void QRCode.toDataURL(ticket.ticketQrPayload, {
      margin: 1,
      width: prominentQr ? 200 : 120,
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [prominentQr, ticket.ticketQrPayload, variant]);

  return (
    <article
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-surface',
        quiet && 'opacity-70',
      )}
    >
      {variant === 'hold' ? (
        <div className="bg-accent/15 px-4 py-2 text-[12.5px] font-semibold text-accent">
          Spot held — finish confirm or payment
          {ticket.reservationExpiresAt
            ? ` · until ${new Date(ticket.reservationExpiresAt).toLocaleString()}`
            : ''}
        </div>
      ) : null}

      <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {variant === 'hold' ? <Badge variant="muted">pending</Badge> : null}
            {ticket.category.entryType === 'viewer' ? <Badge variant="lime">Viewers</Badge> : null}
            <p className="kicker text-accent">{categoryLabel(ticket)}</p>
          </div>
          <h2 className="mt-1 font-display text-3xl uppercase tracking-[0.04em]">{ticket.event.title}</h2>
          <p className="mt-2 text-sm text-text-secondary">
            {ticket.event.city} · {formatEventDate(ticket.event.startTime)}
          </p>
          <p className="mt-1 text-sm text-text-secondary">{ticket.event.organizerName}</p>
          <p className="mt-4 text-sm text-text-primary">
            Code <span className="font-semibold tracking-wide">{ticket.registrationCode}</span>
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-text-muted">
            {ticket.totalAmountMinor === 0 ? 'Free' : formatMinorUnits(ticket.totalAmountMinor)}
            {variant === 'hold' ? ' · hold' : ' · confirmed'}
          </p>
          {localError ? <p className="mt-2 text-sm text-error">{localError}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/${ticket.event.slug}`}>Open event</Link>
            </Button>
            {onConfirmFree ? (
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  setLocalError(null);
                  void onConfirmFree()
                    .catch((err: unknown) => {
                      setLocalError(err instanceof Error ? err.message : 'Could not confirm');
                    })
                    .finally(() => setBusy(false));
                }}
              >
                {busy ? 'Confirming…' : 'Confirm'}
              </Button>
            ) : null}
            {onConfirmPayment ? (
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  setLocalError(null);
                  void onConfirmPayment()
                    .catch((err: unknown) => {
                      setLocalError(err instanceof Error ? err.message : 'Payment not confirmed yet');
                    })
                    .finally(() => setBusy(false));
                }}
              >
                {busy ? 'Checking…' : 'I already paid'}
              </Button>
            ) : null}
          </div>
        </div>

        {variant !== 'hold' ? (
          <div
            className={cn(
              'flex flex-col items-center justify-center border-t border-border bg-elevated/40 px-5 py-4 sm:border-l sm:border-t-0',
              quiet && 'opacity-90',
            )}
          >
            {qr ? (
              <img
                src={qr}
                alt={`QR for ${ticket.registrationCode}`}
                className={cn(
                  'rounded-md bg-white p-2',
                  prominentQr ? 'h-40 w-40' : 'h-24 w-24',
                )}
              />
            ) : (
              <div
                className={cn(
                  'flex items-center justify-center rounded-md border border-border bg-elevated text-xs text-text-muted',
                  prominentQr ? 'h-40 w-40' : 'h-24 w-24',
                )}
              >
                QR pending
              </div>
            )}
            {prominentQr ? (
              <p className="mt-2 max-w-[9rem] text-center text-[10px] text-text-muted">
                Show at the door
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
