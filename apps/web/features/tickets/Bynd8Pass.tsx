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
  return ticket.category.entryType === 'viewer' ? 'AUDIENCE PASS' : 'COMPETITOR';
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
      width: 280,
      color: { dark: '#0B0B0B', light: '#F4F2ED' },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [ticket.ticketQrPayload, variant]);

  return (
    <>
      <article
        className={cn(
          'overflow-hidden rounded-lg border border-border bg-bg',
          quiet && 'opacity-75',
        )}
      >
        {/* Status strip — lime = confirmed truth */}
        <div
          className={cn(
            'flex items-center justify-between gap-3 px-4 py-2',
            variant === 'hold' && 'bg-accent/20 text-accent',
            variant === 'upcoming' && 'bg-accent-2 text-bg',
            variant === 'past' && 'bg-elevated text-text-muted',
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
            {statusCopy(ticket, variant)}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
            BYND8 PASS
          </p>
        </div>

        {/* Orange role / category band */}
        <div className="border-b border-border bg-accent px-4 py-2.5 text-bg">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
            {roleLabel(ticket)}
          </p>
          <p className="mt-0.5 font-display text-lg uppercase tracking-[0.06em]">
            {isViewer ? 'Watch the floor' : categoryLabel(ticket)}
          </p>
        </div>

        <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0 space-y-4 p-5">
            <div>
              <p className="kicker text-accent">{ticket.event.organizerName}</p>
              <h2 className="mt-1 font-display text-3xl uppercase tracking-[0.04em] text-text-primary md:text-4xl">
                {ticket.event.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {formatEventDate(ticket.event.startTime)}
                <span className="text-text-muted"> · {ticket.event.city}</span>
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                {isViewer ? 'Attendee' : 'Competitor'}
              </p>
              <p className="mt-1 font-display text-2xl uppercase tracking-[0.04em] text-text-primary">
                {holderName(ticket)}
              </p>
              <p className="mt-3 font-mono text-sm tracking-wide text-text-secondary">
                {ticket.registrationCode}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-text-muted">
                {ticket.totalAmountMinor === 0 ? 'Free' : formatMinorUnits(ticket.totalAmountMinor)}
                {variant === 'hold' && ticket.reservationExpiresAt
                  ? ` · until ${new Date(ticket.reservationExpiresAt).toLocaleString()}`
                  : null}
              </p>
            </div>

            {localError ? (
              <InlineNotice tone="warn">{localError}</InlineNotice>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/events/${ticket.event.slug}`}>Open event</Link>
              </Button>
              {showQr ? (
                <Button type="button" size="sm" onClick={() => setDoorOpen(true)}>
                  Show at door
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
          </div>

          {variant !== 'hold' ? (
            <button
              type="button"
              disabled={!showQr || !qr}
              onClick={() => setDoorOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center gap-2 border-t border-border bg-elevated/50 px-5 py-5 text-left sm:border-l sm:border-t-0',
                showQr && qr ? 'cursor-pointer hover:bg-elevated' : 'cursor-default',
              )}
              aria-label={showQr ? 'Enlarge QR for door scan' : 'QR pending'}
            >
              {qr ? (
                <img
                  src={qr}
                  alt={`QR for ${ticket.registrationCode}`}
                  className="h-36 w-36 rounded-sm bg-[#F4F2ED] p-2 sm:h-40 sm:w-40"
                />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-sm border border-border bg-elevated text-center text-xs text-text-muted sm:h-40 sm:w-40">
                  QR pending
                </div>
              )}
              {showQr ? (
                <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  Tap to enlarge
                </span>
              ) : null}
            </button>
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
              Or open <Link href={routes.tickets} className="text-accent underline">Tickets</Link> anytime
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
