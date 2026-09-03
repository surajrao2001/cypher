import { IdentityService } from './identity.service';

describe('IdentityService', () => {
  const prisma = {
    profile: {
      upsert: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    organizerMember: {
      findMany: jest.fn(),
    },
    profileDanceStyle: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    danceStyle: {
      findFirst: jest.fn(),
      create: jest.fn(),
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
      instagram: null,
      avatarUrl: null,
      platformRole: 'user',
      status: 'active',
      onboardedAt: null,
    });
    prisma.profile.findUniqueOrThrow.mockResolvedValue({
      id: 'user-1',
      name: 'Dancer',
      dancerName: null,
      city: null,
      crew: null,
      instagram: null,
      avatarUrl: null,
      platformRole: 'user',
      status: 'active',
      onboardedAt: null,
      danceStyles: [],
    });
    prisma.organizerMember.findMany.mockResolvedValue([]);

    await expect(service.getMe('user-1', 'authenticated')).resolves.toMatchObject({
      userId: 'user-1',
      needsOnboarding: true,
      profile: { styles: [] },
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
