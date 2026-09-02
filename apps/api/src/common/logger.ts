import { ConsoleLogger } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestLogStore = {
  requestId: string;
  startedAt: number;
};

export const requestContext = new AsyncLocalStorage<RequestLogStore>();

type LogFields = {
  message: string;
  level: string;
  requestId?: string;
  durationMs?: number;
  [key: string]: unknown;
};

function serialize(fields: LogFields): string {
  const store = requestContext.getStore();
  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level: fields.level,
    service: 'api',
    environment: process.env.NODE_ENV ?? 'development',
    message: fields.message,
  };

  const requestId = fields.requestId ?? store?.requestId;
  if (requestId) {
    payload.requestId = requestId;
  }

  if (typeof fields.durationMs === 'number') {
    payload.durationMs = fields.durationMs;
  }

  for (const [key, value] of Object.entries(fields)) {
    if (key === 'message' || key === 'level' || key === 'requestId' || key === 'durationMs') {
      continue;
    }
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  return JSON.stringify(payload);
}

export function writeLog(fields: LogFields): void {
  const line = `${serialize(fields)}\n`;
  if (fields.level === 'error' || fields.level === 'fatal') {
    process.stderr.write(line);
    return;
  }
  process.stdout.write(line);
}

export class AppLogger extends ConsoleLogger {
  override log(message: unknown, ...optionalParams: unknown[]): void {
    writeLog({
      level: 'info',
      message: this.stringify(message),
      context: this.contextFrom(optionalParams),
    });
  }

  override error(message: unknown, ...optionalParams: unknown[]): void {
    const stack = optionalParams.find((param) => typeof param === 'string' && param.includes('\n'));
    writeLog({
      level: 'error',
      message: this.stringify(message),
      context: this.contextFrom(optionalParams),
      stack: typeof stack === 'string' ? stack : undefined,
    });
  }

  override warn(message: unknown, ...optionalParams: unknown[]): void {
    writeLog({
      level: 'warn',
      message: this.stringify(message),
      context: this.contextFrom(optionalParams),
    });
  }

  override debug(message: unknown, ...optionalParams: unknown[]): void {
    writeLog({
      level: 'debug',
      message: this.stringify(message),
      context: this.contextFrom(optionalParams),
    });
  }

  override verbose(message: unknown, ...optionalParams: unknown[]): void {
    writeLog({
      level: 'verbose',
      message: this.stringify(message),
      context: this.contextFrom(optionalParams),
    });
  }

  override fatal(message: unknown, ...optionalParams: unknown[]): void {
    writeLog({
      level: 'fatal',
      message: this.stringify(message),
      context: this.contextFrom(optionalParams),
    });
  }

  protected override printMessages(): void {
    return;
  }

  private stringify(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  private contextFrom(optionalParams: unknown[]): string | undefined {
    const context = optionalParams.find(
      (param) => typeof param === 'string' && !param.includes('\n'),
    );
    return typeof context === 'string' ? context : this.context;
  }
}
