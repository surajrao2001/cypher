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
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (!extractBearerToken(request)) {
      throw new UnauthorizedException('Missing bearer token');
    }

    this.reflector.getAllAndOverride<OrganizerMembershipMeta>(ORGANIZER_MEMBERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return true;
  }
}
