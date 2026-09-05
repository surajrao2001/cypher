import { load } from '@cashfreepayments/cashfree-js';

/** Opens Cashfree hosted checkout for a payment_session_id (web + mobile WebBrowser). */
export async function openCashfreeCheckout(paymentSessionId: string): Promise<void> {
  const mode =
    process.env.NEXT_PUBLIC_CASHFREE_MODE === 'production' ? 'production' : 'sandbox';
  const cashfree = await load({ mode });
  if (!cashfree) {
    throw new Error('Cashfree checkout could not load');
  }
  await cashfree.checkout({
    paymentSessionId,
    redirectTarget: '_self',
  });
}
