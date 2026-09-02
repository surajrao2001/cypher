import {
  ForbiddenException,
  Injectable,
  SetMetadata,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { OrganizerMemberRole } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { PrismaService } from '../prisma.service';
import type { AuthPrincipal } from '../auth/auth.types';
import { getAuthUserId } from './supabase-jwt.guard';

export const ORGANIZER_PERMISSION_KEY = 'organizerPermission';

export type OrganizerPermission =
  | 'manage_members'
  | 'manage_events'
  | 'manage_registrations'
  | 'publish';

export const RequireOrganizerPermission = (...permissions: OrganizerPermission[]) =>
  SetMetadata(ORGANIZER_PERMISSION_KEY, permissions);

const ROLE_PERMISSIONS: Record<OrganizerMemberRole, OrganizerPermission[]> = {
  owner: ['manage_members', 'manage_events', 'manage_registrations', 'publish'],
  manager: ['manage_members', 'manage_events', 'manage_registrations', 'publish'],
  editor: ['manage_events'],
};

export function roleAllows(role: OrganizerMemberRole, permissions: OrganizerPermission[]): boolean {
  const granted = ROLE_PERMISSIONS[role];
  return permissions.every((permission) => granted.includes(permission));
}

@Injectable()
export class OrganizerPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { auth?: AuthPrincipal; params?: Record<string, string> }>();
    const userId = getAuthUserId(request);
    const permissions = this.reflector.getAllAndOverride<OrganizerPermission[]>(ORGANIZER_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permissions || permissions.length === 0) {
      return true;
    }

    const organizerId = request.params?.organizerId;
    if (!organizerId) {
      throw new ForbiddenException('Organizer context is required');
    }

    const membership = await this.prisma.organizerMember.findUnique({
      where: { organizerId_userId: { organizerId, userId } },
    });
    if (!membership || !roleAllows(membership.role, permissions)) {
      throw new ForbiddenException('Insufficient organizer permission');
    }
    return true;
  }
}
