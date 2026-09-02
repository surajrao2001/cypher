import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { SupabaseJwtGuard } from './supabase-jwt.guard';

function createContext(authorization?: string) {
  const request = { headers: { authorization }, auth: undefined as undefined | { userId: string } };
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
    const guard = new SupabaseJwtGuard(reflector as never, verifier as never);
    const { context } = createContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('rejects missing bearer tokens', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const verifier = { verify: jest.fn() };
    const guard = new SupabaseJwtGuard(reflector as never, verifier as never);
    const { context } = createContext();
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the verified principal', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const verifier = {
      verify: jest.fn().mockResolvedValue({ userId: 'user-1', jwtRole: 'authenticated' }),
    };
    const guard = new SupabaseJwtGuard(reflector as never, verifier as never);
    const { context, request } = createContext('Bearer token.jwt');
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifier.verify).toHaveBeenCalledWith('token.jwt');
    expect(request.auth).toEqual({ userId: 'user-1', jwtRole: 'authenticated' });
  });
});
