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

export const ORGANIZER_PERMISSION_KEY = 'organizerPermission';

export type OrganizerPermission =
  | 'manage_members'
  | 'manage_events'
  | 'manage_registrations'
  | 'publish';

export const RequireOrganizerPermission = (...permissions: OrganizerPermission[]) =>
  SetMetadata(ORGANIZER_PERMISSION_KEY, permissions);

@Injectable()
export class OrganizerPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (!extractBearerToken(request)) {
      throw new UnauthorizedException('Missing bearer token');
    }

    this.reflector.getAllAndOverride<OrganizerPermission[]>(ORGANIZER_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return true;
  }
}
