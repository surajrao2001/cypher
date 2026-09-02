export const QUEUE_NAMES = {
  RESERVATION_EXPIRY: 'reservation-expiry',
  NOTIFICATIONS: 'notifications',
  MEDIA: 'media',
  EXPORTS: 'exports',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
