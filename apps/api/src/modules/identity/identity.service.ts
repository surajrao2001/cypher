import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthProvider, type Profile } from '@prisma/client';
import { replaceProfileDanceStyles } from '../../common/dance-styles';
import { PrismaService } from '../../common/prisma.service';
import type { CompleteOnboardingDto } from './identity.dto';

export type ResolvedUser = {
  userId: string;
  profile: Profile;
};

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve Supabase auth.users.id → Cypher User.id, provisioning on first login.
   * Domain code must only ever see the returned `userId` (never the provider id).
   */
  async resolveOrProvisionUser(providerUserId: string): Promise<ResolvedUser> {
    const existing = await this.findByProviderUserId(providerUserId);
    if (existing) {
      return this.assertActive(existing);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const raced = await tx.authIdentity.findUnique({
          where: {
            provider_providerUserId: {
              provider: AuthProvider.SUPABASE,
              providerUserId,
            },
          },
          include: { user: { include: { profile: true } } },
        });
        if (raced?.user.profile) {
          return this.assertActive({
            userId: raced.userId,
            profile: raced.user.profile,
          });
        }

        const user = await tx.user.create({ data: {} });
        await tx.authIdentity.create({
          data: {
            userId: user.id,
            provider: AuthProvider.SUPABASE,
            providerUserId,
          },
        });
        const profile = await tx.profile.create({
          data: {
            userId: user.id,
            name: 'Dancer',
          },
        });
        return { userId: user.id, profile };
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        const again = await this.findByProviderUserId(providerUserId);
        if (!again) {
          throw error;
        }
        return this.assertActive(again);
      }
      throw error;
    }
  }

  /** Load profile for an already-resolved Cypher userId. */
  async ensureProfile(userId: string): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new ForbiddenException('Account is not active');
    }
    return this.assertActive({ userId, profile }).profile;
  }

  async getMe(userId: string, jwtRole: string) {
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { userId },
      include: {
        danceStyles: {
          include: { style: true },
          orderBy: { style: { name: 'asc' } },
        },
      },
    });
    this.assertActive({ userId, profile });
    const memberships = await this.prisma.organizerMember.findMany({
      where: { userId },
      include: {
        organizer: {
          select: {
            id: true,
            orgName: true,
            slug: true,
            verificationStatus: true,
          },
        },
      },
    });

    return {
      userId,
      jwtRole,
      needsOnboarding: profile.onboardedAt === null,
      profile: {
        id: profile.userId,
        name: profile.name,
        dancerName: profile.dancerName,
        city: profile.city,
        crew: profile.crew,
        styles: profile.danceStyles.map((row) => row.style.name),
        instagram: profile.instagram,
        avatarUrl: profile.avatarUrl,
        platformRole: profile.platformRole,
        status: profile.status,
      },
      organizerMemberships: memberships.map((membership) => ({
        organizerId: membership.organizerId,
        role: membership.role,
        orgName: membership.organizer.orgName,
        slug: membership.organizer.slug,
        verificationStatus: membership.organizer.verificationStatus,
      })),
    };
  }

  async completeOnboarding(userId: string, input: CompleteOnboardingDto, jwtRole: string) {
    await this.ensureProfile(userId);
    await this.prisma.profile.update({
      where: { userId },
      data: {
        dancerName: input.dancerName.trim(),
        city: input.city.trim(),
        name: (input.name ?? input.dancerName).trim(),
        crew: input.crew?.trim(),
        instagram: input.instagram?.replace(/^@/, '').trim(),
        onboardedAt: new Date(),
      },
    });
    await replaceProfileDanceStyles(this.prisma, userId, input.styles ?? []);
    return this.getMe(userId, jwtRole);
  }

  private async findByProviderUserId(providerUserId: string): Promise<ResolvedUser | null> {
    const row = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider: AuthProvider.SUPABASE,
          providerUserId,
        },
      },
      include: { user: { include: { profile: true } } },
    });
    if (!row?.user.profile) {
      return null;
    }
    return { userId: row.userId, profile: row.user.profile };
  }

  private assertActive(resolved: ResolvedUser): ResolvedUser {
    if (resolved.profile.status !== 'active') {
      throw new ForbiddenException('Account is not active');
    }
    return resolved;
  }
}
