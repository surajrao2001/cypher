import { Injectable, SetMetadata, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from '../auth/auth.types';
import { getAuthUserId } from './supabase-jwt.guard';

export const ORGANIZER_MEMBERSHIP_KEY = 'organizerMembership';

export type OrganizerMembershipMeta = {
  param: string;
};

export const RequireOrganizerMembership = (param = 'organizerId') =>
  SetMetadata(ORGANIZER_MEMBERSHIP_KEY, { param } satisfies OrganizerMembershipMeta);

@Injectable()
export class OrganizerMembershipGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest & { auth?: AuthPrincipal }>();
    getAuthUserId(request);
    this.reflector.getAllAndOverride<OrganizerMembershipMeta>(ORGANIZER_MEMBERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    return true;
  }
}
