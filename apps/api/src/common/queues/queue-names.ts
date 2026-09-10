export const QUEUE_NAMES = {
  RESERVATION_EXPIRY: 'reservation-expiry',
  PAYMENT_SPLIT: 'payment-split',
} as const;

export const RESERVATION_HOLD_MS = 15 * 60 * 1000;

/** Cashfree docs: wait ~2 minutes after payment success before split-after-payment. */
export const PAYMENT_SPLIT_DELAY_MS = 2 * 60 * 1000;

export function reservationExpiryJobId(registrationId: string): string {
  return `expire:${registrationId}`;
}

export function paymentSplitJobId(orderId: string): string {
  return `split:${orderId}`;
}
