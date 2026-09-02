import {
  ForbiddenException,
  Injectable,
  SetMetadata,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from '../auth/auth.types';
import { getAuthUserId } from './supabase-jwt.guard';

export const PLATFORM_ROLES_KEY = 'platformRoles';

export type PlatformRoleName = 'user' | 'admin';

export const RequirePlatformRoles = (...roles: PlatformRoleName[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);

@Injectable()
export class PlatformRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest & { auth?: AuthPrincipal }>();
    getAuthUserId(request);

    const roles = this.reflector.getAllAndOverride<PlatformRoleName[]>(PLATFORM_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) {
      return true;
    }

    throw new ForbiddenException('Platform role is resolved from the profile in a later milestone');
  }
}
