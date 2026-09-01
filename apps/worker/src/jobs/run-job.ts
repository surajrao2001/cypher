import { UnrecoverableError, type Job } from 'bullmq';
import type { StructuredLogger } from '../config/logger';

export async function runJob<T>(
  logger: StructuredLogger,
  jobName: string,
  job: Job,
  work: () => Promise<T>,
  extra: Record<string, unknown> = {},
): Promise<T> {
  const startedAt = Date.now();
  logger.job({
    level: 'info',
    job: jobName,
    jobId: job.id,
    attempt: job.attemptsMade + 1,
    message: 'started',
    ...extra,
  });

  try {
    const result = await work();
    logger.job({
      level: 'info',
      job: jobName,
      jobId: job.id,
      durationMs: Date.now() - startedAt,
      message: 'completed',
      ...extra,
    });
    return result;
  } catch (error) {
    logger.job({
      level: 'error',
      job: jobName,
      jobId: job.id,
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
      ...extra,
    });
    throw error;
  }
}

export function requireRegistrationId(job: Job<{ registrationId?: string }>): string {
  const registrationId = job.data?.registrationId;
  if (typeof registrationId !== 'string' || registrationId.length === 0) {
    throw new UnrecoverableError(`${job.queueName} job requires registrationId`);
  }
  return registrationId;
}
