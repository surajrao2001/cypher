'use client';

import type { OrganizerPaymentAccountDto } from '@cypher/contracts';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';

export function PayoutSetupPanel({
  organizerId,
  orgName,
}: {
  organizerId: string;
  orgName: string;
}) {
  const auth = useAuth();
  const [account, setAccount] = useState<OrganizerPaymentAccountDto | null>(null);
  const [displayName, setDisplayName] = useState(orgName);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void auth.api
      .getOrganizerPaymentAccount(organizerId)
      .then((row) => {
        if (cancelled) return;
        setAccount(row);
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
  }, [auth.api, organizerId]);

  async function setup() {
    setBusy(true);
    setError(null);
    try {
      const updated = await auth.api.setupOrganizerPaymentAccount(organizerId, {
        displayName: displayName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
      });
      setAccount(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start payout setup');
    } finally {
      setBusy(false);
    }
  }

  if (!account) {
    return <p className="text-sm text-text-muted">Loading payouts…</p>;
  }

  return (
    <section className="space-y-4 rounded-md border border-border bg-surface p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-3xl uppercase tracking-[0.04em]">Payouts</h2>
        <Badge variant={account.payoutReady ? 'lime' : 'muted'}>
          {account.payoutReady ? 'Ready for paid events' : account.status}
        </Badge>
      </div>
      <p className="text-sm text-text-secondary">
        Cashfree Easy Split pays organizers after dancers checkout. Free (₹0) categories work without
        this. Paid categories stay locked until payouts are ready.
      </p>

      {account.payoutReady ? (
        <p className="text-sm text-text-primary">
          Vendor {account.providerVendorId ?? 'linked'}. You can publish paid categories on events.
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
          <div className="sm:col-span-2">
            <Button onClick={() => void setup()} disabled={busy}>
              {busy ? 'Setting up…' : 'Set up Cashfree payouts'}
            </Button>
          </div>
        </div>
      )}

      {account.lastError ? <p className="text-sm text-error">{account.lastError}</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </section>
  );
}
