'use client';

import type { RegistrationDto } from '@cypher/contracts';
import { formatEventDate, formatMinorUnits } from '@cypher/utils';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { friendlyError, InlineNotice } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type PassVariant = 'hold' | 'upcoming' | 'past';

function categoryLabel(ticket: RegistrationDto): string {
  return ticket.category.entryType === 'viewer' ? 'Audience' : ticket.category.name;
}

function roleLabel(ticket: RegistrationDto): string {
  return ticket.category.entryType === 'viewer' ? 'AUDIENCE' : 'COMPETITOR';
}

function holderName(ticket: RegistrationDto): string {
  const p = ticket.participants[0];
  return p?.dancerName?.trim() || p?.displayName?.trim() || ticket.entryName?.trim() || 'Dancer';
}

function statusCopy(ticket: RegistrationDto, variant: PassVariant): string {
  if (variant === 'hold') return 'HOLD — FINISH CONFIRM';
  if (variant === 'past') return 'USED / PAST';
  if (ticket.registrationStatus === 'confirmed') return "YOU'RE ON THE LIST";
  return ticket.registrationStatus.replaceAll('_', ' ').toUpperCase();
}

/** Compact vertical pass — stub + tear line + QR stub, phone-wallet size. */
export function Bynd8Pass({
  ticket,
  variant,
  onConfirmFree,
  onConfirmPayment,
}: {
  ticket: RegistrationDto;
  variant: PassVariant;
  onConfirmFree?: () => Promise<void>;
  onConfirmPayment?: () => Promise<void>;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [doorOpen, setDoorOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const isViewer = ticket.category.entryType === 'viewer';
  const quiet = variant === 'past';
  const showQr = variant !== 'hold' && Boolean(ticket.ticketQrPayload);

  useEffect(() => {
    if (!ticket.ticketQrPayload || variant === 'hold') {
      setQr(null);
      return;
    }
    void QRCode.toDataURL(ticket.ticketQrPayload, {
      margin: 1,
      width: 200,
      color: { dark: '#0B0B0B', light: '#F4F2ED' },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [ticket.ticketQrPayload, variant]);

  return (
    <>
      <article
        className={cn(
          'mx-auto w-full max-w-[17.5rem] overflow-hidden rounded-2xl border border-border bg-bg shadow-[0_12px_40px_rgba(0,0,0,0.35)]',
          quiet && 'opacity-75',
        )}
      >
        <div
          className={cn(
            'px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.16em]',
            variant === 'hold' && 'bg-accent/20 text-accent',
            variant === 'upcoming' && 'bg-accent-2 text-bg',
            variant === 'past' && 'bg-elevated text-text-muted',
          )}
        >
          {statusCopy(ticket, variant)}
        </div>

        <div className="bg-accent px-4 py-3 text-bg">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] opacity-80">
            BYND8 PASS · {roleLabel(ticket)}
          </p>
          <p className="mt-1 font-display text-xl uppercase leading-none tracking-[0.04em]">
            {isViewer ? 'Watch' : categoryLabel(ticket)}
          </p>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div>
            <h2 className="font-display text-2xl uppercase leading-tight tracking-[0.04em] text-text-primary">
              {ticket.event.title}
            </h2>
            <p className="mt-1.5 text-xs text-text-secondary">
              {formatEventDate(ticket.event.startTime)}
              <span className="text-text-muted"> · {ticket.event.city}</span>
            </p>
          </div>

          <div className="border-t border-dashed border-border pt-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              {isViewer ? 'Audience' : 'Competitor'}
            </p>
            <p className="mt-0.5 font-display text-xl uppercase tracking-[0.04em] text-text-primary">
              {holderName(ticket)}
            </p>
            <p className="mt-2 font-mono text-xs tracking-wide text-text-secondary">
              {ticket.registrationCode}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-text-muted">
              {ticket.totalAmountMinor === 0 ? 'Free' : formatMinorUnits(ticket.totalAmountMinor)}
              {variant === 'hold' && ticket.reservationExpiresAt
                ? ` · until ${new Date(ticket.reservationExpiresAt).toLocaleString()}`
                : null}
            </p>
          </div>

          {localError ? <InlineNotice tone="warn">{localError}</InlineNotice> : null}
        </div>

        {/* Ticket perforations */}
        <div className="relative h-4 bg-bg">
          <div className="absolute inset-x-3 top-1/2 border-t border-dashed border-border" />
          <span className="absolute -left-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-[var(--color-bg,#0B0B0B)] ring-1 ring-border" />
          <span className="absolute -right-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-[var(--color-bg,#0B0B0B)] ring-1 ring-border" />
        </div>

        {variant !== 'hold' ? (
          <button
            type="button"
            disabled={!showQr || !qr}
            onClick={() => setDoorOpen(true)}
            className={cn(
              'flex w-full flex-col items-center gap-2 px-4 pb-4 pt-1',
              showQr && qr ? 'cursor-pointer' : 'cursor-default',
            )}
            aria-label={showQr ? 'Enlarge QR for door scan' : 'QR pending'}
          >
            {qr ? (
              <img
                src={qr}
                alt={`QR for ${ticket.registrationCode}`}
                className="h-36 w-36 rounded-md bg-[#F4F2ED] p-2"
              />
            ) : (
              <div className="flex h-36 w-36 items-center justify-center rounded-md border border-border bg-elevated text-center text-xs text-text-muted">
                QR pending
              </div>
            )}
            {showQr ? (
              <span className="text-[9px] uppercase tracking-[0.14em] text-text-muted">
                Tap to enlarge
              </span>
            ) : null}
          </button>
        ) : null}

        <div className="flex flex-wrap justify-center gap-2 border-t border-border px-3 py-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/events/${ticket.event.slug}`}>Event</Link>
          </Button>
          {showQr ? (
            <Button type="button" size="sm" onClick={() => setDoorOpen(true)}>
              At door
            </Button>
          ) : null}
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
                    setLocalError(friendlyError(err, 'Could not confirm'));
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
                    setLocalError(friendlyError(err, 'Payment not confirmed yet'));
                  })
                  .finally(() => setBusy(false));
              }}
            >
              {busy ? 'Checking…' : 'I already paid'}
            </Button>
          ) : null}
        </div>
      </article>

      <Dialog open={doorOpen} onOpenChange={setDoorOpen}>
        <DialogContent className="max-w-sm border-border bg-bg p-0 sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Door pass</DialogTitle>
            <DialogDescription>Full-screen QR for check-in</DialogDescription>
          </DialogHeader>
          <div className="bg-accent-2 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-bg">
            Show at the door
          </div>
          <div className="space-y-4 px-6 py-6 text-center">
            <p className="font-display text-2xl uppercase tracking-[0.04em] text-text-primary">
              {ticket.event.title}
            </p>
            <p className="text-sm text-text-secondary">
              {holderName(ticket)} · {categoryLabel(ticket)}
            </p>
            {qr ? (
              <img
                src={qr}
                alt={`QR for ${ticket.registrationCode}`}
                className="mx-auto h-64 w-64 rounded-sm bg-[#F4F2ED] p-3"
              />
            ) : null}
            <p className="font-mono text-sm tracking-wide text-text-secondary">
              {ticket.registrationCode}
            </p>
            <Button type="button" variant="outline" className="w-full" onClick={() => setDoorOpen(false)}>
              Close
            </Button>
            <p className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
              Or open{' '}
              <Link href={routes.tickets} className="text-accent underline">
                Passes
              </Link>{' '}
              anytime
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
