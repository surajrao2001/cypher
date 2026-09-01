import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  it('returns the standard error contract', () => {
    const payload = { statusCode: 0, body: undefined as unknown };
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-request-id': 'req-1' } }),
        getResponse: () => ({
          status(code: number) {
            payload.statusCode = code;
            return this;
          },
          send(body: unknown) {
            payload.body = body;
            return this;
          },
        }),
      }),
    } as ArgumentsHost;

    const filter = new HttpExceptionFilter();
    filter.catch(new UnauthorizedLike(), host);

    expect(payload.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    expect(payload.body).toEqual({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Missing bearer token',
      error: 'Unauthorized',
      requestId: 'req-1',
    });
  });
});

class UnauthorizedLike extends HttpException {
  constructor() {
    super('Missing bearer token', HttpStatus.UNAUTHORIZED);
  }
}
