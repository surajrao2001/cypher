import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizerMembershipGuard } from './organizer-membership.guard';
import { OrganizerPermissionGuard, roleAllows } from './organizer-permission.guard';
import { PlatformRoleGuard } from './platform-role.guard';
import { extractBearerToken } from './supabase-jwt.guard';

function createContext(opts?: {
  auth?: { userId: string; platformRole?: 'user' | 'admin'; status?: 'active' | 'suspended' };
  params?: Record<string, string>;
}): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        auth: opts?.auth,
        params: opts?.params ?? {},
      }),
    }),
  } as ExecutionContext;
}

describe('extractBearerToken', () => {
  it('reads a bearer token', () => {
    expect(extractBearerToken({ headers: { authorization: 'Bearer abc.def' } } as never)).toBe(
      'abc.def',
    );
  });

  it('rejects missing or malformed headers', () => {
    expect(extractBearerToken({ headers: {} } as never)).toBeUndefined();
    expect(extractBearerToken({ headers: { authorization: 'Basic abc' } } as never)).toBeUndefined();
  });
});

describe('authorization guards', () => {
  const reflector = new Reflector();
  const prisma = { organizerMember: { findUnique: jest.fn() } };
  const platformGuard = new PlatformRoleGuard(reflector);
  const membershipGuard = new OrganizerMembershipGuard(reflector, prisma as never);
  const permissionGuard = new OrganizerPermissionGuard(reflector, prisma as never);

  it('PlatformRoleGuard rejects requests without a verified principal', () => {
    expect(() => platformGuard.canActivate(createContext())).toThrow(UnauthorizedException);
  });

  it.each([
    ['OrganizerMembershipGuard', membershipGuard],
    ['OrganizerPermissionGuard', permissionGuard],
  ])('%s rejects requests without a verified principal', async (_name, guard) => {
    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows a verified user when no extra role is required', async () => {
    await expect(
      Promise.resolve(platformGuard.canActivate(createContext({ auth: { userId: 'user-1', platformRole: 'user' } }))),
    ).resolves.toBe(true);
    await expect(
      Promise.resolve(membershipGuard.canActivate(createContext({ auth: { userId: 'user-1' } }))),
    ).resolves.toBe(true);
    await expect(
      Promise.resolve(permissionGuard.canActivate(createContext({ auth: { userId: 'user-1' } }))),
    ).resolves.toBe(true);
  });

  it('reads platform role from the profile, not the JWT', () => {
    const roleReflector = { getAllAndOverride: () => ['admin'] };
    const guard = new PlatformRoleGuard(roleReflector as never);
    expect(() =>
      guard.canActivate(createContext({ auth: { userId: 'user-1', platformRole: 'user' } })),
    ).toThrow(ForbiddenException);
    expect(
      guard.canActivate(createContext({ auth: { userId: 'user-1', platformRole: 'admin' } })),
    ).toBe(true);
  });

  it('requires organizer membership when metadata is set', async () => {
    const membershipReflector = { getAllAndOverride: () => ({ param: 'organizerId' }) };
    const guard = new OrganizerMembershipGuard(membershipReflector as never, prisma as never);
    prisma.organizerMember.findUnique.mockResolvedValue(null);
    await expect(
      guard.canActivate(
        createContext({ auth: { userId: 'user-1' }, params: { organizerId: 'org-1' } }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    prisma.organizerMember.findUnique.mockResolvedValue({ role: 'editor' });
    await expect(
      guard.canActivate(
        createContext({ auth: { userId: 'user-1' }, params: { organizerId: 'org-1' } }),
      ),
    ).resolves.toBe(true);
  });
});

describe('roleAllows', () => {
  it('lets editors edit events but not publish', () => {
    expect(roleAllows('editor', ['manage_events'])).toBe(true);
    expect(roleAllows('editor', ['publish'])).toBe(false);
    expect(roleAllows('owner', ['publish', 'manage_members'])).toBe(true);
  });
});
