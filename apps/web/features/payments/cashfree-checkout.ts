import { load } from '@cashfreepayments/cashfree-js';

export type CashfreeCheckoutResult = {
  /** True when the modal was closed without a completed payment callback. */
  error?: { message?: string } | null;
  paymentDetails?: { paymentMessage?: string } | null;
  redirect?: boolean;
};

/** Opens Cashfree checkout in a modal popup on the current page. */
export async function openCashfreeCheckout(
  paymentSessionId: string,
): Promise<CashfreeCheckoutResult> {
  const mode =
    process.env.NEXT_PUBLIC_CASHFREE_MODE === 'production' ? 'production' : 'sandbox';
  const cashfree = await load({ mode });
  if (!cashfree) {
    throw new Error('Cashfree checkout could not load');
  }
  const result = (await cashfree.checkout({
    paymentSessionId,
    redirectTarget: '_modal',
  })) as CashfreeCheckoutResult | undefined;
  return result ?? {};
}
