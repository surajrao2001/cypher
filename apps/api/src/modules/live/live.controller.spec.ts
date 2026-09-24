import { UnauthorizedException } from '@nestjs/common';
import { getAuthUserId } from '../../common/guards/supabase-jwt.guard';
import { LiveController } from './live.controller';

describe('LiveController', () => {
  const live = { getMyEventLive: jest.fn() };
  const controller = new LiveController(live as never);

  beforeEach(() => {
    jest.clearAllMocks();
    live.getMyEventLive.mockResolvedValue({ eventId: 'e1' });
  });

  // O / P — identity from auth only
  it('passes authenticated userId from request.auth, not params', async () => {
    const req = { auth: { userId: 'user-auth' } } as never;
    await controller.getMyEventLive(req, 'event-1');
    expect(live.getMyEventLive).toHaveBeenCalledWith('user-auth', 'event-1');
  });

  it('rejects missing auth via getAuthUserId', () => {
    expect(() => getAuthUserId({} as never)).toThrow(UnauthorizedException);
  });
});
