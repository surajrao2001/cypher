import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { requestContext, writeLog } from './logger';

export const REQUEST_ID_HEADER = 'x-request-id';

type MiddlewareRequest = IncomingMessage & {
  requestId?: string;
  originalUrl?: string;
};

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function setResponseHeader(res: ServerResponse, name: string, value: string): void {
  if (res.headersSent) {
    return;
  }
  res.setHeader(name, value);
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: MiddlewareRequest, res: ServerResponse, next: () => void): void {
    const incoming = headerValue(req.headers[REQUEST_ID_HEADER]);
    const requestId = incoming && incoming.trim().length > 0 ? incoming : randomUUID();
    req.headers[REQUEST_ID_HEADER] = requestId;
    req.requestId = requestId;
    setResponseHeader(res, REQUEST_ID_HEADER, requestId);

    const startedAt = Date.now();
    const method = req.method ?? 'GET';
    const url = req.originalUrl ?? req.url ?? '/';

    const store = { requestId, startedAt };
    res.on('finish', () => {
      writeLog({
        level: 'info',
        message: 'request completed',
        requestId,
        durationMs: Date.now() - startedAt,
        method,
        url,
        statusCode: res.statusCode,
      });
    });

    requestContext.run(store, () => next());
  }
}

export function readRequestId(req: { headers: IncomingMessage['headers']; requestId?: string }): string | undefined {
  return req.requestId ?? headerValue(req.headers[REQUEST_ID_HEADER]);
}
