import { IdentityService } from './identity.service';

describe('IdentityService', () => {
  it('returns the JWT principal without a profile row', () => {
    expect(new IdentityService().currentUser('user-1', 'authenticated')).toEqual({
      userId: 'user-1',
      jwtRole: 'authenticated',
    });
  });
});
