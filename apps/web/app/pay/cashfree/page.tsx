'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { openCashfreeCheckout } from '@/features/payments/cashfree-checkout';

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
      setError(err instanceof Error ? err.message : 'Could not open Cashfree');
    });
  }, [session]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 py-16">
      <p className="kicker text-accent">Cashfree</p>
      <h1 className="display-title text-4xl">Opening checkout…</h1>
      <p className="text-sm text-text-secondary">
        {error
          ? error
          : 'If nothing opens, allow pop-ups or return to the event and tap Pay again.'}
      </p>
    </main>
  );
}

export default function CashfreePayPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
          <p className="text-sm text-text-muted">Loading checkout…</p>
        </main>
      }
    >
      <CashfreePayInner />
    </Suspense>
  );
}
