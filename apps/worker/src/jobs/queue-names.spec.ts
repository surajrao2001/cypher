import { QUEUE_NAMES } from './queue-names';

describe('QUEUE_NAMES', () => {
  it('exposes the Phase 1 worker queues', () => {
    expect(Object.values(QUEUE_NAMES)).toEqual([
      'reservation-expiry',
      'notifications',
      'media',
      'exports',
    ]);
  });
});
