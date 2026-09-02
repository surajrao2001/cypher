import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizerMembershipGuard } from './organizer-membership.guard';
import { OrganizerPermissionGuard } from './organizer-permission.guard';
import { PlatformRoleGuard } from './platform-role.guard';
import { extractBearerToken, SupabaseJwtGuard } from './supabase-jwt.guard';

function createContext(authorization?: string): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authorization ? { authorization } : {},
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

describe('auth guards', () => {
  const jwtGuard = new SupabaseJwtGuard();
  const reflector = new Reflector();
  const platformGuard = new PlatformRoleGuard(reflector);
  const membershipGuard = new OrganizerMembershipGuard(reflector);
  const permissionGuard = new OrganizerPermissionGuard(reflector);

  it.each([
    ['SupabaseJwtGuard', jwtGuard],
    ['PlatformRoleGuard', platformGuard],
    ['OrganizerMembershipGuard', membershipGuard],
    ['OrganizerPermissionGuard', permissionGuard],
  ])('%s rejects requests without a bearer token', (_name, guard) => {
    expect(() => guard.canActivate(createContext())).toThrow(UnauthorizedException);
  });

  it.each([
    ['SupabaseJwtGuard', jwtGuard],
    ['PlatformRoleGuard', platformGuard],
    ['OrganizerMembershipGuard', membershipGuard],
    ['OrganizerPermissionGuard', permissionGuard],
  ])('%s allows a request that includes a bearer token', (_name, guard) => {
    expect(guard.canActivate(createContext('Bearer token-value'))).toBe(true);
  });
});
