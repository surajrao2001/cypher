import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizerMembershipGuard } from './organizer-membership.guard';
import { OrganizerPermissionGuard } from './organizer-permission.guard';
import { PlatformRoleGuard } from './platform-role.guard';
import { extractBearerToken } from './supabase-jwt.guard';

function createContext(auth?: { userId: string }): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        auth,
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
  const platformGuard = new PlatformRoleGuard(reflector);
  const membershipGuard = new OrganizerMembershipGuard(reflector);
  const permissionGuard = new OrganizerPermissionGuard(reflector);

  it.each([
    ['PlatformRoleGuard', platformGuard],
    ['OrganizerMembershipGuard', membershipGuard],
    ['OrganizerPermissionGuard', permissionGuard],
  ])('%s rejects requests without a verified principal', (_name, guard) => {
    expect(() => guard.canActivate(createContext())).toThrow(UnauthorizedException);
  });

  it.each([
    ['PlatformRoleGuard', platformGuard],
    ['OrganizerMembershipGuard', membershipGuard],
    ['OrganizerPermissionGuard', permissionGuard],
  ])('%s allows a request with a verified user id', (_name, guard) => {
    expect(guard.canActivate(createContext({ userId: 'user-1' }))).toBe(true);
  });

  it('does not invent platform roles from the JWT', () => {
    const reflector = {
      getAllAndOverride: () => ['admin'],
    };
    const guard = new PlatformRoleGuard(reflector as never);
    expect(() => guard.canActivate(createContext({ userId: 'user-1' }))).toThrow(ForbiddenException);
  });
});
