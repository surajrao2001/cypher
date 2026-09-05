'use client';

import type { RegistrationDto } from '@cypher/contracts';
import { formatEventDate, formatMinorUnits } from '@cypher/utils';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { EmptyState } from '@/features/shell/EmptyState';

export function TicketsBoard() {
  const { token, me, api, ready } = useAuth();
  const [items, setItems] = useState<RegistrationDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!token || !me) {
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    void api
      .listMyRegistrations()
      .then((res) => {
        setItems(res.items.filter((row) => row.registrationStatus === 'confirmed'));
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load tickets');
      })
      .finally(() => setLoading(false));
  }, [api, me, ready, token]);

  if (!ready || loading) {
    return <p className="mt-10 text-sm text-text-secondary">Loading tickets…</p>;
  }

  if (!token || !me) {
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
    return <p className="mt-10 text-sm text-red-400">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        className="mt-10"
        kicker="Wallet"
        title="No tickets yet"
        body="Register for a free category and confirm — your pass lands here."
      >
        <Button asChild>
          <Link href={routes.discover}>Find a cypher</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <ul className="mt-10 space-y-6">
      {items.map((ticket) => (
        <li key={ticket.id}>
          <TicketCard ticket={ticket} />
        </li>
      ))}
    </ul>
  );
}

function TicketCard({ ticket }: { ticket: RegistrationDto }) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!ticket.ticketQrPayload) {
      setQr(null);
      return;
    }
    void QRCode.toDataURL(ticket.ticketQrPayload, { margin: 1, width: 220, color: { dark: '#0a0a0a', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [ticket.ticketQrPayload]);

  return (
    <article className="rounded-lg border border-border bg-surface p-5 md:flex md:items-start md:gap-6">
      <div className="min-w-0 flex-1">
        <p className="kicker text-accent">{ticket.category.name}</p>
        <h2 className="mt-1 font-display text-3xl uppercase tracking-[0.04em]">{ticket.event.title}</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {ticket.event.city} · {formatEventDate(ticket.event.startTime)}
        </p>
        <p className="mt-1 text-sm text-text-secondary">{ticket.event.organizerName}</p>
        <p className="mt-4 text-sm text-text-primary">
          Code <span className="font-semibold tracking-wide">{ticket.registrationCode}</span>
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-text-muted">
          {ticket.totalAmountMinor === 0 ? 'Free' : formatMinorUnits(ticket.totalAmountMinor)} · confirmed
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={`/events/${ticket.event.slug}`}>Event</Link>
        </Button>
      </div>
      <div className="mt-5 flex shrink-0 flex-col items-center md:mt-0">
        {qr ? (
          <img src={qr} alt={`QR for ${ticket.registrationCode}`} className="h-44 w-44 rounded-md bg-white p-2" />
        ) : (
          <div className="flex h-44 w-44 items-center justify-center rounded-md border border-border bg-elevated text-xs text-text-muted">
            QR pending
          </div>
        )}
        <p className="mt-2 max-w-[11rem] break-all text-center text-[10px] text-text-muted">
          Check-in scans this code later
        </p>
      </div>
    </article>
  );
}
