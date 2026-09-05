import { AuthProvider } from '@prisma/client';
import { IdentityService } from './identity.service';

describe('IdentityService', () => {
  const prisma = {
    authIdentity: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
    profile: {
      create: jest.fn(),
      findUnique: jest.fn(),
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
    $transaction: jest.fn(),
  };
  const service = new IdentityService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provisions User + AuthIdentity + Profile on first Supabase login', async () => {
    prisma.authIdentity.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn({
        ...prisma,
        authIdentity: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
        },
        user: {
          create: jest.fn().mockResolvedValue({ id: 'cypher-1' }),
        },
        profile: {
          create: jest.fn().mockResolvedValue({
            userId: 'cypher-1',
            name: 'Dancer',
            status: 'active',
            platformRole: 'user',
          }),
        },
      } as never),
    );

    const result = await service.resolveOrProvisionUser('supabase-1');
    expect(result.userId).toBe('cypher-1');
    expect(result.profile.status).toBe('active');
  });

  it('returns an existing mapping without creating duplicates', async () => {
    prisma.authIdentity.findUnique.mockResolvedValue({
      userId: 'cypher-1',
      provider: AuthProvider.SUPABASE,
      providerUserId: 'supabase-1',
      user: {
        profile: {
          userId: 'cypher-1',
          name: 'Dancer',
          status: 'active',
          platformRole: 'user',
        },
      },
    });

    const result = await service.resolveOrProvisionUser('supabase-1');
    expect(result.userId).toBe('cypher-1');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('loads me with Cypher userId as profile.id', async () => {
    prisma.profile.findUniqueOrThrow.mockResolvedValue({
      userId: 'cypher-1',
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

    await expect(service.getMe('cypher-1', 'authenticated')).resolves.toMatchObject({
      userId: 'cypher-1',
      needsOnboarding: true,
      profile: { id: 'cypher-1', styles: [] },
      organizerMemberships: [],
    });
  });
});
