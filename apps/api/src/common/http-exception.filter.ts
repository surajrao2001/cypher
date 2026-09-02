import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { requestContext, writeLog } from './logger';
import { readRequestId } from './request-id.middleware';

type ErrorBody = {
  statusCode: number;
  message: string;
  error: string;
  requestId?: string;
};

function httpStatusName(status: number): string {
  const key = HttpStatus[status];
  if (typeof key !== 'string') {
    return 'Error';
  }
  return key
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalize(exception: unknown): Omit<ErrorBody, 'requestId'> {
  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return { statusCode, message: response, error: httpStatusName(statusCode) };
    }
    if (typeof response === 'object' && response !== null) {
      const body = response as { message?: string | string[]; error?: string };
      const message = Array.isArray(body.message)
        ? body.message.join('; ')
        : (body.message ?? exception.message);
      return {
        statusCode,
        message,
        error: body.error ?? httpStatusName(statusCode),
      };
    }
    return {
      statusCode,
      message: exception.message,
      error: httpStatusName(statusCode),
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    error: 'Internal Server Error',
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest & { requestId?: string }>();
    const reply = ctx.getResponse<FastifyReply>();
    const normalized = normalize(exception);
    const requestId = readRequestId(request) ?? requestContext.getStore()?.requestId;
    const startedAt = requestContext.getStore()?.startedAt;

    writeLog({
      level: normalized.statusCode >= 500 ? 'error' : 'warn',
      message: normalized.message,
      requestId,
      durationMs: startedAt ? Date.now() - startedAt : undefined,
      statusCode: normalized.statusCode,
      error: normalized.error,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    const body: ErrorBody = {
      ...normalized,
      requestId,
    };

    void reply.status(normalized.statusCode).send(body);
  }
}
