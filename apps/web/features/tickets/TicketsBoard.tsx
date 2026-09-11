'use client';

import type { RegistrationDto } from '@cypher/contracts';
import { partitionRegistrationsForTickets } from '@cypher/utils';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { EmptyState } from '@/features/shell/EmptyState';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { Bynd8Pass } from '@/features/tickets/Bynd8Pass';
import { cn } from '@/lib/utils';

type WalletTab = 'needs' | 'upcoming' | 'past';

export function TicketsBoard() {
  const { token, api, ready, status, refresh } = useAuth();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<RegistrationDto[]>([]);
  const [error, setError] = useState<unknown>(null);
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
      setError(err);
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
    return <PageLoading variant="list" className="mt-10" label="Loading tickets" />;
  }

  if (status !== 'authenticated' || !token) {
    return (
      <EmptyState
        className="mt-10"
        kicker="Wallet"
        title="Sign in for your passes"
        body="Confirmed entries show here as a BYND8 Pass — name, category, and door QR."
      >
        <Button asChild>
          <Link href={`${routes.login}?next=${routes.tickets}`}>Sign in</Link>
        </Button>
      </EmptyState>
    );
  }

  if (error) {
    return (
      <div className="mt-10">
        <SoftError
          title="Couldn’t load tickets"
          error={error}
          onRetry={() => {
            void refresh().then(() => load());
          }}
        />
      </div>
    );
  }

  const { needsAction, upcoming, past } = partitioned;

  if (needsAction.length === 0 && upcoming.length === 0 && past.length === 0) {
    return (
      <EmptyState
        className="mt-10"
        kicker="Wallet"
        title="No passes yet"
        body="Register for a night — your BYND8 Pass lands here with a door QR."
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

  const tabEmpty = {
    needs: {
      title: 'Nothing left to finish',
      body: 'Holds and unpaid entries show here. You’re clear — check Upcoming for live passes.',
      cta: { href: routes.discover, label: 'Browse events' },
    },
    upcoming: {
      title: 'No upcoming passes',
      body: 'When you confirm a spot, the pass shows here for the door.',
      cta: { href: routes.discover, label: 'Find a cypher' },
    },
    past: {
      title: 'No past nights yet',
      body: 'After an event ends, old passes archive here.',
      cta: { href: routes.discover, label: 'Find a cypher' },
    },
  }[tab];

  return (
    <div className="mt-8 space-y-6">
      <div>
        <p className="kicker text-accent">Wallet</p>
        <h1 className="display-title mt-1 text-4xl md:text-5xl">Your passes</h1>
        <p className="mt-2 max-w-lg text-sm text-text-secondary">
          Not a receipt — your credential for the night. Tap Show at door for a full-screen QR.
        </p>
      </div>

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
        <EmptyState
          kicker={tabs.find((t) => t.id === tab)?.label ?? 'Passes'}
          title={tabEmpty.title}
          body={tabEmpty.body}
          className="py-10 md:py-12"
        >
          <Button asChild variant="outline">
            <Link href={tabEmpty.cta.href}>{tabEmpty.cta.label}</Link>
          </Button>
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {activeList.map((ticket) => (
            <li key={ticket.id}>
              {tab === 'needs' ? (
                <Bynd8Pass
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
                <Bynd8Pass ticket={ticket} variant={tab === 'past' ? 'past' : 'upcoming'} />
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
