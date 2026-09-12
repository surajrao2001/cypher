'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { openCashfreeCheckout } from '@/features/payments/cashfree-checkout';
import { friendlyError, InlineNotice, PageLoading } from '@/features/shell/AsyncState';

function CashfreePayInner() {
  const params = useSearchParams();
  const session = params.get('session');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setError('Missing payment session');
      return;
    }
    void openCashfreeCheckout(session).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Could not open payment');
    });
  }, [session]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 py-16">
      <p className="kicker text-accent">Payment</p>
      <h1 className="display-title text-4xl">Opening secure payment…</h1>
      {error ? (
        <InlineNotice tone="warn">{friendlyError(error, error)}</InlineNotice>
      ) : (
        <p className="text-sm text-text-secondary">
          If nothing opens, allow pop-ups or return to the event and tap Pay again.
        </p>
      )}
    </main>
  );
}

export default function CashfreePayPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
          <PageLoading variant="form" label="Loading checkout" />
        </main>
      }
    >
      <CashfreePayInner />
    </Suspense>
  );
}
