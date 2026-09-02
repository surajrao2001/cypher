import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import type { AuthPrincipal } from '../auth/auth.types';
import { RateLimitService } from './rate-limit.service';

const PUBLIC_LIMIT_PER_MIN = 120;
const AUTH_LIMIT_PER_MIN = 300;

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimit: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest & { auth?: AuthPrincipal }>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const ip = request.ip || request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || 'unknown';
    const userId = request.auth?.userId;
    const limit = isPublic || !userId ? PUBLIC_LIMIT_PER_MIN : AUTH_LIMIT_PER_MIN;
    const key = userId ? `rl:user:${userId}` : `rl:ip:${ip}`;
    await this.rateLimit.consume(key, limit, 60);
    return true;
  }
}
