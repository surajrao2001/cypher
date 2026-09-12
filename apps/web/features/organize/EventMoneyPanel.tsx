'use client';

import type {
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { hasPaidEntry, isFreeOnlyEvent, moneyFromRegistrations } from '@/features/organize/event-control';
import { PayoutSetupPanel } from '@/features/organize/PayoutSetupPanel';

export function EventMoneyPanel({
  org,
  event,
  regs,
}: {
  org: OrganizerDto;
  event: OrganizerEventDetailDto;
  regs: OrganizerEventRegistrationsResponse | null;
}) {
  const auth = useAuth();
  const [payoutReady, setPayoutReady] = useState<boolean | null>(null);
  const freeOnly = isFreeOnlyEvent(event);
  const paid = hasPaidEntry(event);
  const money = moneyFromRegistrations(regs);

  useEffect(() => {
    if (freeOnly && !paid) {
      setPayoutReady(null);
      return;
    }
    let cancelled = false;
    void auth.api
      .getOrganizerPaymentAccount(org.id)
      .then((row) => {
        if (!cancelled) setPayoutReady(Boolean(row.payoutReady));
      })
      .catch(() => {
        if (!cancelled) setPayoutReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth.api, freeOnly, org.id, paid]);

  if (freeOnly && !paid) {
    return (
      <section className="space-y-3">
        <p className="kicker text-accent">Money</p>
        <h2 className="font-display text-3xl uppercase tracking-[0.04em]">Money</h2>
        <p className="text-sm text-text-secondary">Free event · No payments</p>
      </section>
    );
  }

  if (paid && payoutReady === false) {
    return (
      <section className="space-y-5">
        <div>
          <p className="kicker text-accent">Money</p>
          <h2 className="font-display text-3xl uppercase tracking-[0.04em]">Set up payouts</h2>
          <p className="mt-2 max-w-lg text-sm text-text-secondary">
            Set up your details so BYND8 can send you money from paid registrations.
          </p>
          <Button asChild className="mt-4">
            <Link href={routes.organizePayouts(org.slug)}>Set up payouts</Link>
          </Button>
        </div>
        <PayoutSetupPanel
          organizerId={org.id}
          orgName={org.orgName}
          embedded
          onReadyChange={setPayoutReady}
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="kicker text-accent">Money</p>
        <h2 className="font-display text-3xl uppercase tracking-[0.04em]">Money</h2>
      </div>

      <div className="space-y-4">
        <div>
          <p className="font-display text-4xl tracking-[0.04em]">
            {formatMinorUnits(money.collectedMinor)}
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Collected
          </p>
        </div>
        {money.pendingMinor > 0 ? (
          <p className="text-sm text-text-secondary">
            Pending · {formatMinorUnits(money.pendingMinor)}
          </p>
        ) : null}
        {money.refundedMinor > 0 ? (
          <p className="text-sm text-text-secondary">
            Refunded · {formatMinorUnits(money.refundedMinor)}
          </p>
        ) : null}
        <p className="text-sm text-text-secondary">
          Payout · {payoutReady ? 'Ready' : payoutReady === null ? '…' : 'Not set up'}
        </p>
      </div>

      <Button asChild variant="outline">
        <Link href={routes.organizePayouts(org.slug)}>
          {payoutReady ? 'Update payouts' : 'Set up payouts'}
        </Link>
      </Button>
    </section>
  );
}
