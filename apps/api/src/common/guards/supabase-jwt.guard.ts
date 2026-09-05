import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { IdentityService } from '../../modules/identity/identity.service';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { SupabaseJwtVerifier } from '../auth/supabase-jwt.verifier';
import type { AuthPrincipal } from '../auth/auth.types';

export function extractBearerToken(request: { headers: FastifyRequest['headers'] }): string | undefined {
  const raw = request.headers.authorization;
  if (typeof raw !== 'string') {
    return undefined;
  }
  const match = /^Bearer\s+(\S+)$/i.exec(raw.trim());
  return match?.[1];
}

export function getAuthUserId(request: FastifyRequest & { auth?: AuthPrincipal }): string {
  const userId = request.auth?.userId;
  if (!userId) {
    throw new UnauthorizedException('Missing authenticated user');
  }
  return userId;
}

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: SupabaseJwtVerifier,
    private readonly identity: IdentityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest & { auth?: AuthPrincipal }>();
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const verified = await this.verifier.verify(token);
    const resolved = await this.identity.resolveOrProvisionUser(verified.providerUserId);
    request.auth = {
      userId: resolved.userId,
      jwtRole: verified.jwtRole,
      platformRole: resolved.profile.platformRole,
      status: resolved.profile.status,
    };
    return true;
  }
}
