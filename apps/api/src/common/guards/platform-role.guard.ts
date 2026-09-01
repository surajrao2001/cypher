import {
  Injectable,
  SetMetadata,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { extractBearerToken } from './supabase-jwt.guard';

export const PLATFORM_ROLES_KEY = 'platformRoles';

export type PlatformRoleName = 'user' | 'admin';

export const RequirePlatformRoles = (...roles: PlatformRoleName[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);

@Injectable()
export class PlatformRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (!extractBearerToken(request)) {
      throw new UnauthorizedException('Missing bearer token');
    }

    this.reflector.getAllAndOverride<PlatformRoleName[]>(PLATFORM_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return true;
  }
}
