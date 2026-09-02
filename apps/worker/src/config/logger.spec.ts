import { StructuredLogger } from './logger';

describe('StructuredLogger', () => {
  it('writes JSON with worker service fields', () => {
    const chunks: string[] = [];
    const logger = new StructuredLogger({
      environment: 'test',
      level: 'info',
      stdout: {
        write: (chunk) => {
          chunks.push(String(chunk));
          return true;
        },
      },
      stderr: {
        write: (chunk) => {
          chunks.push(String(chunk));
          return true;
        },
      },
    });

    logger.job({
      job: 'reservation-expiry',
      jobId: 'job-1',
      durationMs: 12,
      message: 'Reservation expiry processed',
      registrationId: 'reg-1',
    });

    expect(chunks).toHaveLength(1);
    const parsed = JSON.parse(chunks[0] ?? '{}') as Record<string, unknown>;
    expect(parsed).toMatchObject({
      level: 'info',
      service: 'worker',
      environment: 'test',
      job: 'reservation-expiry',
      jobId: 'job-1',
      durationMs: 12,
      message: 'Reservation expiry processed',
      registrationId: 'reg-1',
    });
    expect(typeof parsed.timestamp).toBe('string');
  });
});
