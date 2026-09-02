import {
  ForbiddenException,
  Injectable,
  SetMetadata,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { PrismaService } from '../prisma.service';
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
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { auth?: AuthPrincipal; params?: Record<string, string> }>();
    const userId = getAuthUserId(request);
    const meta = this.reflector.getAllAndOverride<OrganizerMembershipMeta>(ORGANIZER_MEMBERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!meta) {
      return true;
    }

    const organizerId = request.params?.[meta.param];
    if (!organizerId) {
      throw new ForbiddenException('Organizer context is required');
    }

    const membership = await this.prisma.organizerMember.findUnique({
      where: { organizerId_userId: { organizerId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('Not an organizer member');
    }
    return true;
  }
}
