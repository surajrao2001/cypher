export const QUEUE_NAMES = {
  RESERVATION_EXPIRY: 'reservation-expiry',
} as const;

export const RESERVATION_HOLD_MS = 15 * 60 * 1000;

export function reservationExpiryJobId(registrationId: string): string {
  return `expire:${registrationId}`;
}
