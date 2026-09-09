'use client';

import type { OrganizerPaymentAccountDto } from '@cypher/contracts';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/utils';

type SettlementMethod = 'bank' | 'upi';

export function PayoutSetupPanel({
  organizerId,
  orgName,
  embedded = false,
  onReadyChange,
}: {
  organizerId: string;
  orgName: string;
  /** Nested inside onboarding — drop the outer chrome. */
  embedded?: boolean;
  onReadyChange?: (ready: boolean) => void;
}) {
  const auth = useAuth();
  const [account, setAccount] = useState<OrganizerPaymentAccountDto | null>(null);
  const [displayName, setDisplayName] = useState(orgName);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [pan, setPan] = useState('');
  const [method, setMethod] = useState<SettlementMethod>('bank');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [upiVpa, setUpiVpa] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void auth.api
      .getOrganizerPaymentAccount(organizerId)
      .then((row) => {
        if (cancelled) return;
        setAccount(row);
        onReadyChange?.(row.payoutReady);
        if (row.displayName) setDisplayName(row.displayName);
        if (row.contactEmail) setContactEmail(row.contactEmail);
        if (row.contactPhone) setContactPhone(row.contactPhone);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load payouts');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth.api, onReadyChange, organizerId]);

  async function setup() {
    setBusy(true);
    setError(null);
    const tid = toastPending(toastCopy.saving);
    try {
      const holder = bankAccountHolder.trim() || displayName.trim() || undefined;
      const updated = await auth.api.setupOrganizerPaymentAccount(organizerId, {
        displayName: displayName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        pan: pan.trim().toUpperCase(),
        ...(method === 'bank'
          ? {
              bankAccountNumber: bankAccountNumber.trim() || undefined,
              bankAccountHolder: holder,
              bankIfsc: bankIfsc.trim().toUpperCase() || undefined,
            }
          : {
              upiVpa: upiVpa.trim() || undefined,
              bankAccountHolder: holder,
            }),
      });
      setAccount(updated);
      onReadyChange?.(updated.payoutReady);
      toastResolve(tid, toastCopy.payoutStarted);
    } catch (err) {
      const detail = err instanceof Error ? err.message : undefined;
      toastReject(tid, toastCopy.payoutFailed, detail);
      setError(detail ?? 'Could not start payout setup');
    } finally {
      setBusy(false);
    }
  }

  if (!account) {
    return <p className="text-sm text-text-muted">Loading payouts…</p>;
  }

  const form = (
    <>
      {account.payoutReady ? (
        <p className="text-sm text-text-primary">
          Settlement connected ({account.providerVendorId ?? 'ready'}). Paid entry fees settle here
          after dancers checkout.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs uppercase tracking-[0.14em] text-text-muted" htmlFor="payout-name">
              Display name
            </label>
            <Input
              id="payout-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={orgName}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.14em] text-text-muted" htmlFor="payout-email">
              Contact email
            </label>
            <Input
              id="payout-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="crew@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.14em] text-text-muted" htmlFor="payout-phone">
              Contact phone
            </label>
            <Input
              id="payout-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="9876543210"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs uppercase tracking-[0.14em] text-text-muted" htmlFor="payout-pan">
              PAN
            </label>
            <Input
              id="payout-pan"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              placeholder="ABCPV1234D"
              maxLength={10}
              autoComplete="off"
            />
            <p className="text-xs text-text-muted">
              Required for Cashfree KYC. Sandbox test PAN: ABCPV1234D.
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Settle to</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={cn(
                  'flex-1 rounded-sm border px-3 py-2.5 text-sm font-medium transition-colors',
                  method === 'bank'
                    ? 'border-accent bg-accent/10 text-text-primary'
                    : 'border-border bg-elevated text-text-secondary hover:text-text-primary',
                )}
              >
                Bank account
              </button>
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={cn(
                  'flex-1 rounded-sm border px-3 py-2.5 text-sm font-medium transition-colors',
                  method === 'upi'
                    ? 'border-accent bg-accent/10 text-text-primary'
                    : 'border-border bg-elevated text-text-secondary hover:text-text-primary',
                )}
              >
                UPI
              </button>
            </div>
            <p className="text-xs text-text-muted">
              Cashfree accepts one settlement method — bank or UPI, not both.
            </p>
          </div>

          {method === 'bank' ? (
            <>
              <div className="space-y-1 sm:col-span-2">
                <label
                  className="text-xs uppercase tracking-[0.14em] text-text-muted"
                  htmlFor="payout-holder"
                >
                  Account holder
                </label>
                <Input
                  id="payout-holder"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder={displayName || 'Account holder name'}
                />
              </div>
              <div className="space-y-1">
                <label
                  className="text-xs uppercase tracking-[0.14em] text-text-muted"
                  htmlFor="payout-account"
                >
                  Account number
                </label>
                <Input
                  id="payout-account"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="026291800001191"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1">
                <label
                  className="text-xs uppercase tracking-[0.14em] text-text-muted"
                  htmlFor="payout-ifsc"
                >
                  IFSC
                </label>
                <Input
                  id="payout-ifsc"
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                  placeholder="YESB0000262"
                  maxLength={11}
                />
              </div>
              <p className="text-xs text-text-muted sm:col-span-2">
                Sandbox: leave blank to use Cashfree test account (026291800001191 / YESB0000262).
              </p>
            </>
          ) : (
            <>
              <div className="space-y-1 sm:col-span-2">
                <label
                  className="text-xs uppercase tracking-[0.14em] text-text-muted"
                  htmlFor="payout-holder"
                >
                  Account holder
                </label>
                <Input
                  id="payout-holder"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder={displayName || 'Name on UPI'}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label
                  className="text-xs uppercase tracking-[0.14em] text-text-muted"
                  htmlFor="payout-upi"
                >
                  UPI ID
                </label>
                <Input
                  id="payout-upi"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value.toLowerCase())}
                  placeholder="name@oksbi"
                  autoComplete="off"
                />
                <p className="text-xs text-text-muted">
                  Sandbox test VPA: success@upi
                </p>
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <Button
              onClick={() => void setup()}
              disabled={busy || pan.trim().length !== 10 || (method === 'upi' && !upiVpa.trim())}
            >
              {busy
                ? 'Connecting…'
                : method === 'bank'
                  ? 'Connect bank account'
                  : 'Connect UPI'}
            </Button>
          </div>
        </div>
      )}

      {account.lastError ? <p className="text-sm text-error">{account.lastError}</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-4 rounded-sm border border-border bg-surface/80 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-text-primary">Connect settlement account</p>
          <Badge variant={account.payoutReady ? 'lime' : 'muted'}>
            {account.payoutReady ? 'Connected' : account.status}
          </Badge>
        </div>
        <p className="text-xs text-text-secondary">
          Bank or UPI — needed when entry fees are above ₹0 so checkout money settles to you.
        </p>
        {form}
      </div>
    );
  }

  return (
    <section className={cn('space-y-4 rounded-md border border-border bg-surface p-4 md:p-5')}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-3xl uppercase tracking-[0.04em]">Entry-fee settlement</h2>
        <Badge variant={account.payoutReady ? 'lime' : 'muted'}>
          {account.payoutReady ? 'Connected' : account.status}
        </Badge>
      </div>
      <p className="text-sm text-text-secondary">
        Connect bank or UPI when categories cost more than ₹0, so dancer payments settle to you.
      </p>
      {form}
    </section>
  );
}
