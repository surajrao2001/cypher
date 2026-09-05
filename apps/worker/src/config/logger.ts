import { Injectable, type LoggerService } from '@nestjs/common';
import type { LogLevel } from './env';

const LEVEL_ORDER: Record<LogLevel, number> = {
  verbose: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

export type JobLogEntry = {
  level?: LogLevel;
  job: string;
  jobId?: string | number;
  durationMs?: number;
  message: string;
  [key: string]: unknown;
};

type WriteStream = Pick<NodeJS.WritableStream, 'write'>;

export type StructuredLoggerOptions = {
  environment?: string;
  level?: LogLevel;
  stdout?: WriteStream;
  stderr?: WriteStream;
};

@Injectable()
export class StructuredLogger implements LoggerService {
  private readonly environment: string;
  private readonly minLevel: number;
  private readonly stdout: WriteStream;
  private readonly stderr: WriteStream;

  constructor(options: StructuredLoggerOptions = {}) {
    this.environment = options.environment ?? process.env.APP_ENV ?? process.env.NODE_ENV ?? 'local';
    this.minLevel =
      LEVEL_ORDER[options.level ?? (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info'] ??
      LEVEL_ORDER.info;
    this.stdout = options.stdout ?? process.stdout;
    this.stderr = options.stderr ?? process.stderr;
  }

  log(message: unknown, context?: string): void {
    this.emit('info', message, { context });
  }

  error(message: unknown, stackOrContext?: string, context?: string): void {
    if (context) {
      this.emit('error', message, { stack: stackOrContext, context });
      return;
    }
    this.emit('error', message, { context: stackOrContext });
  }

  warn(message: unknown, context?: string): void {
    this.emit('warn', message, { context });
  }

  debug(message: unknown, context?: string): void {
    this.emit('debug', message, { context });
  }

  verbose(message: unknown, context?: string): void {
    this.emit('verbose', message, { context });
  }

  fatal(message: unknown, context?: string): void {
    this.emit('fatal', message, { context });
  }

  job(entry: JobLogEntry): void {
    const { level = 'info', job, jobId, durationMs, message, ...rest } = entry;
    this.emit(level, {
      job,
      jobId,
      durationMs,
      message,
      ...rest,
    });
  }

  private emit(level: LogLevel, message: unknown, extra: Record<string, unknown> = {}): void {
    if (this.minLevel === undefined || LEVEL_ORDER[level] < this.minLevel) {
      return;
    }

    const payload = isRecord(message) ? message : { message: stringifyUnknown(message) };
    const record = compact({
      timestamp: new Date().toISOString(),
      level,
      service: 'worker',
      environment: this.environment,
      ...extra,
      ...payload,
    });

    const line = `${JSON.stringify(record)}\n`;
    if (level === 'error' || level === 'fatal') {
      this.stderr.write(line);
      return;
    }
    this.stdout.write(line);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Error) {
    return value.message;
  }
  return JSON.stringify(value);
}

function compact(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== ''),
  );
}
