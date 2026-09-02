import { IdentityService } from './identity.service';

describe('IdentityService', () => {
  const prisma = {
    profile: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    organizerMember: {
      findMany: jest.fn(),
    },
  };
  const service = new IdentityService(prisma as never);

  it('lazily creates a dancer profile', async () => {
    prisma.profile.upsert.mockResolvedValue({
      id: 'user-1',
      name: 'Dancer',
      dancerName: null,
      city: null,
      crew: null,
      styles: [],
      instagram: null,
      avatarUrl: null,
      platformRole: 'user',
      status: 'active',
      onboardedAt: null,
    });
    prisma.organizerMember.findMany.mockResolvedValue([]);

    await expect(service.getMe('user-1', 'authenticated')).resolves.toMatchObject({
      userId: 'user-1',
      needsOnboarding: true,
      organizerMemberships: [],
    });
    expect(prisma.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        create: { id: 'user-1', name: 'Dancer' },
      }),
    );
  });
});
