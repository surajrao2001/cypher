import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { SupabaseJwtGuard } from './supabase-jwt.guard';

function createContext(authorization?: string) {
  const request = { headers: { authorization }, auth: undefined as undefined | Record<string, string> };
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
  return { context, request };
}

describe('SupabaseJwtGuard', () => {
  it('skips verification on public routes', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(true) };
    const verifier = { verify: jest.fn() };
    const identity = { ensureProfile: jest.fn() };
    const guard = new SupabaseJwtGuard(reflector as never, verifier as never, identity as never);
    const { context } = createContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('rejects missing bearer tokens', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const verifier = { verify: jest.fn() };
    const identity = { ensureProfile: jest.fn() };
    const guard = new SupabaseJwtGuard(reflector as never, verifier as never, identity as never);
    const { context } = createContext();
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the verified principal and lazy profile', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const verifier = {
      verify: jest.fn().mockResolvedValue({ userId: 'user-1', jwtRole: 'authenticated' }),
    };
    const identity = {
      ensureProfile: jest.fn().mockResolvedValue({ platformRole: 'user', status: 'active' }),
    };
    const guard = new SupabaseJwtGuard(reflector as never, verifier as never, identity as never);
    const { context, request } = createContext('Bearer token.jwt');
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifier.verify).toHaveBeenCalledWith('token.jwt');
    expect(identity.ensureProfile).toHaveBeenCalledWith('user-1');
    expect(request.auth).toEqual({
      userId: 'user-1',
      jwtRole: 'authenticated',
      platformRole: 'user',
      status: 'active',
    });
  });

  it('blocks suspended profiles', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const verifier = {
      verify: jest.fn().mockResolvedValue({ userId: 'user-1', jwtRole: 'authenticated' }),
    };
    const identity = {
      ensureProfile: jest.fn().mockResolvedValue({ platformRole: 'user', status: 'suspended' }),
    };
    const guard = new SupabaseJwtGuard(reflector as never, verifier as never, identity as never);
    const { context } = createContext('Bearer token.jwt');
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
