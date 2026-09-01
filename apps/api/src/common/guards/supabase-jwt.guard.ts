import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

export function extractBearerToken(request: FastifyRequest): string | undefined {
  const raw = request.headers.authorization;
  if (typeof raw !== 'string') {
    return undefined;
  }
  const match = /^Bearer\s+(\S+)$/i.exec(raw.trim());
  return match?.[1];
}

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    return true;
  }
}
