import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import type { CompleteOnboardingDto } from './identity.dto';

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureProfile(userId: string): Promise<Profile> {
    const profile = await this.prisma.profile.upsert({
      where: { id: userId },
      create: {
        id: userId,
        name: 'Dancer',
      },
      update: {},
    });
    if (profile.status !== 'active') {
      throw new ForbiddenException('Account is not active');
    }
    return profile;
  }

  async getMe(userId: string, jwtRole: string) {
    const profile = await this.ensureProfile(userId);
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
        id: profile.id,
        name: profile.name,
        dancerName: profile.dancerName,
        city: profile.city,
        crew: profile.crew,
        styles: profile.styles,
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
      where: { id: userId },
      data: {
        dancerName: input.dancerName.trim(),
        city: input.city.trim(),
        name: (input.name ?? input.dancerName).trim(),
        crew: input.crew?.trim(),
        styles: input.styles ?? [],
        instagram: input.instagram?.replace(/^@/, '').trim(),
        onboardedAt: new Date(),
      },
    });
    return this.getMe(userId, jwtRole);
  }
}
