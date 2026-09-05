export const QUEUE_NAMES = {
  RESERVATION_EXPIRY: 'reservation-expiry',
  PAYMENT_SPLIT: 'payment-split',
  NOTIFICATIONS: 'notifications',
  MEDIA: 'media',
  EXPORTS: 'exports',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
