import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventStatus,
  EventType,
  CategoryEntryType,
  MediaLinkKind,
  OrganizerMemberRole,
  OrganizerType,
  OrganizerVerificationStatus,
  type Prisma,
} from '@prisma/client';
import { replaceEventDanceStyles } from '../../common/dance-styles';
import { PrismaService } from '../../common/prisma.service';
import { slugify, uniqueSlugCandidate } from '../../common/slug';
import { IdentityService } from '../identity/identity.service';
import { PaymentsService } from '../payments/payments.service';
import { eventInclude, toOrganizerEventDetail } from '../events/events.mapper';
import type { OrganizerEventDetailDto } from '../events/events.types';

export type CreateOrganizerInput = {
  orgName: string;
  slug?: string;
  type?: string;
  city?: string;
  bio?: string;
  instagram?: string;
};

export type UpdateOrganizerInput = {
  orgName?: string;
  type?: string;
  city?: string | null;
  bio?: string | null;
  instagram?: string | null;
};

export type CategoryInput = {
  name: string;
  priceMinor?: number;
  capacity: number;
  entryType?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  teamSize?: number;
};

export type UpdateCategoryInput = {
  name?: string;
  priceMinor?: number;
  capacity?: number;
  entryType?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  teamSize?: number;
};

export type CreateEventInput = {
  title: string;
  slug?: string;
  description?: string;
  eventType?: string;
  city: string;
  venue?: string;
  venueLatitude?: number | null;
  venueLongitude?: number | null;
  startTime: string;
  endTime?: string;
  posterUrl?: string;
  tags?: string[];
  styles?: string[];
  categories?: CategoryInput[];
  audiencePass?: {
    enabled: boolean;
    priceMinor?: number;
    capacity?: number;
    name?: string;
  };
};

export type UpdateEventInput = {
  title?: string;
  description?: string | null;
  eventType?: string;
  city?: string;
  venue?: string | null;
  venueLatitude?: number | null;
  venueLongitude?: number | null;
  startTime?: string;
  endTime?: string | null;
  posterUrl?: string | null;
  tags?: string[];
  styles?: string[];
  featured?: boolean;
  audiencePass?: {
    enabled: boolean;
    priceMinor?: number;
    capacity?: number;
    name?: string;
  };
};

export type MediaLinkInput = {
  title: string;
  url: string;
  kind?: string;
  categoryId?: string | null;
  sortOrder?: number;
};

export type UpdateMediaLinkInput = {
  title?: string;
  url?: string;
  kind?: string;
  categoryId?: string | null;
  sortOrder?: number;
};

@Injectable()
export class OrganizersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: IdentityService,
    private readonly payments: PaymentsService,
  ) {}

  async createOrganizer(userId: string, input: CreateOrganizerInput) {
    await this.identity.ensureProfile(userId);
    const orgName = input.orgName.trim();
    const slug = await this.allocateOrganizerSlug(input.slug?.trim() || slugify(orgName));

    const organizer = await this.prisma.organizer.create({
      data: {
        orgName,
        slug,
        type: resolveOrganizerType(input.type),
        city: input.city?.trim(),
        bio: input.bio?.trim(),
        instagram: input.instagram?.replace(/^@/, '').trim(),
        verificationStatus: OrganizerVerificationStatus.verified,
        createdById: userId,
        members: {
          create: {
            userId,
            role: OrganizerMemberRole.owner,
          },
        },
      },
    });

    return this.toOrganizerDto(organizer, OrganizerMemberRole.owner);
  }

  async listMine(userId: string) {
    const memberships = await this.prisma.organizerMember.findMany({
      where: { userId },
      include: { organizer: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((row) => this.toOrganizerDto(row.organizer, row.role));
  }

  async getMineBySlug(userId: string, slug: string) {
    const organizer = await this.prisma.organizer.findUnique({ where: { slug } });
    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }
    const membership = await this.requireMembership(organizer.id, userId);
    return this.toOrganizerDto(organizer, membership.role);
  }

  async updateOrganizer(userId: string, organizerId: string, input: UpdateOrganizerInput) {
    await this.requireMembership(organizerId, userId, [OrganizerMemberRole.owner]);
    const organizer = await this.prisma.organizer.update({
      where: { id: organizerId },
      data: {
        orgName: input.orgName?.trim(),
        type: input.type === undefined ? undefined : resolveOrganizerType(input.type),
        city: input.city === undefined ? undefined : input.city?.trim() || null,
        bio: input.bio === undefined ? undefined : input.bio?.trim() || null,
        instagram:
          input.instagram === undefined
            ? undefined
            : input.instagram?.replace(/^@/, '').trim() || null,
      },
    });
    return this.toOrganizerDto(organizer, OrganizerMemberRole.owner);
  }

  async listEvents(userId: string, organizerId: string): Promise<OrganizerEventDetailDto[]> {
    await this.requireMembership(organizerId, userId);
    const events = await this.prisma.event.findMany({
      where: { organizerId },
      include: eventInclude,
      orderBy: { startTime: 'desc' },
    });
    return events.map(toOrganizerEventDetail);
  }

  async getEvent(userId: string, organizerId: string, eventId: string): Promise<OrganizerEventDetailDto> {
    await this.requireMembership(organizerId, userId);
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizerId },
      include: eventInclude,
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return toOrganizerEventDetail(event);
  }

  async listEventRegistrations(userId: string, organizerId: string, eventId: string) {
    await this.requireMembership(organizerId, userId);
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizerId },
      include: {
        categories: { orderBy: { name: 'asc' } },
      },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const rows = await this.prisma.registration.findMany({
      where: { eventId },
      include: {
        category: true,
        participants: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    });

    return {
      eventId: event.id,
      eventTitle: event.title,
      categories: event.categories.map((category) => ({
        id: category.id,
        name: category.name,
        capacity: category.capacity,
        reservedCount: category.reservedCount,
        confirmedCount: category.confirmedCount,
        priceMinor: category.priceMinor,
      })),
      items: rows.map((row) => ({
        id: row.id,
        categoryId: row.categoryId,
        categoryName: row.category.name,
        entryName: row.entryName,
        registrationStatus: row.registrationStatus,
        paymentStatus: row.paymentStatus,
        reservationExpiresAt: row.reservationExpiresAt?.toISOString() ?? null,
        totalAmountMinor: row.totalAmountMinor,
        currency: row.currency,
        registrationCode: row.registrationCode,
        confirmedAt: row.confirmedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        participants: row.participants.map((p) => ({
          id: p.id,
          displayName: p.displayName,
          dancerName: p.dancerName,
          isTeamCaptain: p.isTeamCaptain,
        })),
      })),
      totals: {
        pending: rows.filter((r) => r.registrationStatus === 'pending_payment').length,
        confirmed: rows.filter((r) => r.registrationStatus === 'confirmed').length,
        other: rows.filter(
          (r) => r.registrationStatus !== 'pending_payment' && r.registrationStatus !== 'confirmed',
        ).length,
      },
    };
  }

  async createEvent(userId: string, organizerId: string, input: CreateEventInput) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);
    const organizer = await this.prisma.organizer.findUnique({ where: { id: organizerId } });
    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    const startTime = new Date(input.startTime);
    if (Number.isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid startTime');
    }
    const endTime = input.endTime ? new Date(input.endTime) : undefined;
    if (endTime && Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid endTime');
    }

    const slug = await this.allocateEventSlug(input.slug?.trim() || slugify(input.title));
    const categories = (input.categories ?? []).filter((c) => c.entryType !== 'viewer');
    if (input.categories?.some((c) => c.entryType === 'viewer')) {
      throw new BadRequestException('Use audiencePass for viewer tickets, not categories[]');
    }
    const paidPrices = [
      ...categories.map((c) => c.priceMinor ?? 0),
      ...(input.audiencePass?.enabled ? [input.audiencePass.priceMinor ?? 0] : []),
    ];
    await this.assertPaidCategoriesAllowed(organizerId, paidPrices);
    const eventType = resolveEventType(input.eventType);
    const coords = normalizeVenueCoords(input.venueLatitude, input.venueLongitude);

    const categoryCreates = [
      ...categories.map((category) => {
        const sizes = resolveCategorySizes(category);
        return {
          name: category.name.trim(),
          priceMinor: category.priceMinor ?? 0,
          capacity: category.capacity,
          entryType: sizes.entryType,
          minTeamSize: sizes.minTeamSize,
          maxTeamSize: sizes.maxTeamSize,
        };
      }),
      ...(input.audiencePass?.enabled
        ? [
            {
              name: (input.audiencePass.name?.trim() || 'Viewers pass').slice(0, 80),
              priceMinor: input.audiencePass.priceMinor ?? 0,
              capacity: Math.max(1, input.audiencePass.capacity ?? 100),
              entryType: CategoryEntryType.viewer,
              minTeamSize: 1,
              maxTeamSize: 1,
            },
          ]
        : []),
    ];

    const event = await this.prisma.event.create({
      data: {
        organizerId,
        slug,
        title: input.title.trim(),
        description: input.description?.trim(),
        eventType,
        city: input.city.trim(),
        venue: input.venue?.trim(),
        venueLatitude: coords.lat,
        venueLongitude: coords.lng,
        startTime,
        endTime,
        posterUrl: input.posterUrl?.trim(),
        tags: input.tags ?? [],
        status: EventStatus.draft,
        ...(categoryCreates.length > 0
          ? {
              categories: {
                create: categoryCreates,
              },
            }
          : {}),
      },
      include: eventInclude,
    });

    await syncEventGeography(this.prisma, event.id, coords.lat, coords.lng);

    if (input.styles?.length) {
      await replaceEventDanceStyles(this.prisma, event.id, input.styles);
      return this.getEvent(userId, organizerId, event.id);
    }

    return toOrganizerEventDetail(event);
  }

  async updateEvent(userId: string, organizerId: string, eventId: string, input: UpdateEventInput) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);
    const existing = await this.prisma.event.findFirst({ where: { id: eventId, organizerId } });
    if (!existing) {
      throw new NotFoundException('Event not found');
    }

    const data: Prisma.EventUpdateInput = {};
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.eventType !== undefined) data.eventType = resolveEventType(input.eventType);
    if (input.city !== undefined) data.city = input.city.trim();
    if (input.venue !== undefined) data.venue = input.venue?.trim() || null;
    if (input.venueLatitude !== undefined || input.venueLongitude !== undefined) {
      const coords = normalizeVenueCoords(
        input.venueLatitude !== undefined ? input.venueLatitude : existing.venueLatitude,
        input.venueLongitude !== undefined ? input.venueLongitude : existing.venueLongitude,
      );
      // Clearing one side clears the pin
      if (input.venueLatitude === null || input.venueLongitude === null) {
        data.venueLatitude = null;
        data.venueLongitude = null;
      } else {
        data.venueLatitude = coords.lat;
        data.venueLongitude = coords.lng;
      }
    }
    if (input.posterUrl !== undefined) data.posterUrl = input.posterUrl?.trim() || null;
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.featured !== undefined) data.featured = input.featured;
    if (input.startTime !== undefined) {
      const startTime = new Date(input.startTime);
      if (Number.isNaN(startTime.getTime())) {
        throw new BadRequestException('Invalid startTime');
      }
      data.startTime = startTime;
    }
    if (input.endTime !== undefined) {
      if (input.endTime === null) {
        data.endTime = null;
      } else {
        const endTime = new Date(input.endTime);
        if (Number.isNaN(endTime.getTime())) {
          throw new BadRequestException('Invalid endTime');
        }
        data.endTime = endTime;
      }
    }

    const event = await this.prisma.event.update({
      where: { id: eventId },
      data,
      include: eventInclude,
    });
    if (input.venueLatitude !== undefined || input.venueLongitude !== undefined) {
      await syncEventGeography(
        this.prisma,
        eventId,
        event.venueLatitude,
        event.venueLongitude,
      );
    }
    if (input.audiencePass !== undefined) {
      await this.syncAudiencePass(eventId, organizerId, input.audiencePass);
    }
    if (input.styles !== undefined) {
      await replaceEventDanceStyles(this.prisma, eventId, input.styles);
    }
    if (input.styles !== undefined || input.audiencePass !== undefined) {
      return this.getEvent(userId, organizerId, eventId);
    }
    return toOrganizerEventDetail(event);
  }

  async publishEvent(userId: string, organizerId: string, eventId: string) {
    const membership = await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
    ]);
    const organizer = await this.prisma.organizer.findUnique({ where: { id: organizerId } });
    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }
    if (organizer.verificationStatus !== OrganizerVerificationStatus.verified) {
      throw new ForbiddenException('Organizer must be verified to publish');
    }

    const existing = await this.prisma.event.findFirst({
      where: { id: eventId, organizerId },
      include: { categories: true },
    });
    if (!existing) {
      throw new NotFoundException('Event not found');
    }
    if (existing.categories.length === 0) {
      throw new BadRequestException('Add at least one category before publishing');
    }
    if (existing.status === EventStatus.cancelled) {
      throw new BadRequestException('Cancelled events cannot be published');
    }

    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.published },
      include: eventInclude,
    });
    void membership;
    return toOrganizerEventDetail(event);
  }

  async unpublishEvent(userId: string, organizerId: string, eventId: string) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
    ]);
    const existing = await this.prisma.event.findFirst({ where: { id: eventId, organizerId } });
    if (!existing) {
      throw new NotFoundException('Event not found');
    }
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.draft },
      include: eventInclude,
    });
    return toOrganizerEventDetail(event);
  }

  async addCategory(userId: string, organizerId: string, eventId: string, input: CategoryInput) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);
    const existing = await this.prisma.event.findFirst({ where: { id: eventId, organizerId } });
    if (!existing) {
      throw new NotFoundException('Event not found');
    }
    await this.assertPaidCategoriesAllowed(organizerId, [input.priceMinor ?? 0]);
    const sizes = resolveCategorySizes(input);
    // Multiple viewer SKUs are allowed (day / full weekend passes).
    await this.prisma.eventCategory.create({
      data: {
        eventId,
        name: input.name.trim(),
        priceMinor: input.priceMinor ?? 0,
        capacity: input.capacity,
        entryType: sizes.entryType,
        minTeamSize: sizes.minTeamSize,
        maxTeamSize: sizes.maxTeamSize,
      },
    });
    return this.getEvent(userId, organizerId, eventId);
  }

  async updateCategory(
    userId: string,
    organizerId: string,
    eventId: string,
    categoryId: string,
    input: UpdateCategoryInput,
  ) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);
    const category = await this.prisma.eventCategory.findFirst({
      where: { id: categoryId, eventId, event: { organizerId } },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (input.priceMinor !== undefined && input.priceMinor > 0) {
      await this.assertPaidCategoriesAllowed(organizerId, [input.priceMinor]);
    }
    const nextCapacity = input.capacity ?? category.capacity;
    const occupied = category.reservedCount + category.confirmedCount;
    if (nextCapacity < occupied) {
      throw new BadRequestException(`Capacity cannot be below ${String(occupied)} occupied spots`);
    }
    const sizes =
      input.entryType !== undefined ||
      input.minTeamSize !== undefined ||
      input.maxTeamSize !== undefined ||
      input.teamSize !== undefined
        ? resolveCategorySizes({
            entryType: input.entryType ?? category.entryType,
            minTeamSize: input.minTeamSize ?? category.minTeamSize,
            maxTeamSize: input.maxTeamSize ?? category.maxTeamSize,
            teamSize: input.teamSize,
          })
        : null;
    await this.prisma.eventCategory.update({
      where: { id: categoryId },
      data: {
        name: input.name === undefined ? undefined : input.name.trim(),
        priceMinor: input.priceMinor,
        capacity: input.capacity,
        entryType: sizes?.entryType,
        minTeamSize: sizes?.minTeamSize,
        maxTeamSize: sizes?.maxTeamSize,
      },
    });
    return this.getEvent(userId, organizerId, eventId);
  }

  async deleteCategory(userId: string, organizerId: string, eventId: string, categoryId: string) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizerId },
      include: { categories: true },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    const category = event.categories.find((row) => row.id === categoryId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (category.reservedCount + category.confirmedCount > 0) {
      throw new BadRequestException('Cannot delete a category with reserved or confirmed spots');
    }
    if (event.status === EventStatus.published && event.categories.length <= 1) {
      throw new BadRequestException('Published events need at least one category');
    }
    const registrationCount = await this.prisma.registration.count({ where: { categoryId } });
    if (registrationCount > 0) {
      throw new BadRequestException('Cannot delete a category that already has registrations');
    }
    await this.prisma.eventCategory.delete({ where: { id: categoryId } });
    return this.getEvent(userId, organizerId, eventId);
  }

  async replaceEventDays(
    userId: string,
    organizerId: string,
    eventId: string,
    days: Array<{
      id?: string;
      label: string;
      startsAt: string;
      endsAt?: string | null;
      sortOrder?: number;
    }>,
  ) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizerId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const normalized = days.map((day, index) => {
      const startsAt = new Date(day.startsAt);
      if (Number.isNaN(startsAt.getTime())) {
        throw new BadRequestException(`Invalid startsAt for day “${day.label}”`);
      }
      const endsAt = day.endsAt ? new Date(day.endsAt) : null;
      if (endsAt && Number.isNaN(endsAt.getTime())) {
        throw new BadRequestException(`Invalid endsAt for day “${day.label}”`);
      }
      return {
        id: day.id,
        label: day.label.trim().slice(0, 80) || `Day ${String(index + 1)}`,
        startsAt,
        endsAt,
        sortOrder: day.sortOrder ?? index,
      };
    });

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.eventDay.findMany({ where: { eventId } });
      const keepIds = new Set(normalized.map((d) => d.id).filter(Boolean) as string[]);
      for (const row of existing) {
        if (!keepIds.has(row.id)) {
          await tx.eventDay.delete({ where: { id: row.id } });
        }
      }
      for (const day of normalized) {
        if (day.id && existing.some((e) => e.id === day.id)) {
          await tx.eventDay.update({
            where: { id: day.id },
            data: {
              label: day.label,
              startsAt: day.startsAt,
              endsAt: day.endsAt,
              sortOrder: day.sortOrder,
            },
          });
        } else {
          await tx.eventDay.create({
            data: {
              eventId,
              label: day.label,
              startsAt: day.startsAt,
              endsAt: day.endsAt,
              sortOrder: day.sortOrder,
            },
          });
        }
      }
    });

    return this.getEvent(userId, organizerId, eventId);
  }

  async replaceCategoryPriceTiers(
    userId: string,
    organizerId: string,
    eventId: string,
    categoryId: string,
    tiers: Array<{
      name: string;
      priceMinor: number;
      startsAt?: string | null;
      endsAt?: string | null;
      sortOrder?: number;
      maxQuantity?: number | null;
    }>,
  ) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);
    await this.assertCategoryOwned(organizerId, eventId, categoryId);
    await this.assertPaidCategoriesAllowed(
      organizerId,
      tiers.map((t) => t.priceMinor),
    );

    const normalized = tiers.map((tier, index) => {
      const startsAt = tier.startsAt ? new Date(tier.startsAt) : null;
      const endsAt = tier.endsAt ? new Date(tier.endsAt) : null;
      if (startsAt && Number.isNaN(startsAt.getTime())) {
        throw new BadRequestException('Invalid tier startsAt');
      }
      if (endsAt && Number.isNaN(endsAt.getTime())) {
        throw new BadRequestException('Invalid tier endsAt');
      }
      return {
        name: tier.name.trim().slice(0, 80) || `Tier ${String(index + 1)}`,
        priceMinor: Math.max(0, Math.floor(tier.priceMinor)),
        startsAt,
        endsAt,
        sortOrder: tier.sortOrder ?? index,
        maxQuantity: tier.maxQuantity ?? null,
      };
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.categoryPriceTier.deleteMany({ where: { categoryId } });
      if (normalized.length > 0) {
        await tx.categoryPriceTier.createMany({
          data: normalized.map((tier) => ({ categoryId, ...tier })),
        });
        const listPrice = Math.min(...normalized.map((t) => t.priceMinor));
        await tx.eventCategory.update({
          where: { id: categoryId },
          data: { priceMinor: listPrice },
        });
      }
    });

    return this.getEvent(userId, organizerId, eventId);
  }

  async setCategoryValidDays(
    userId: string,
    organizerId: string,
    eventId: string,
    categoryId: string,
    dayIds: string[],
  ) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);
    await this.assertCategoryOwned(organizerId, eventId, categoryId);
    const days = await this.prisma.eventDay.findMany({
      where: { eventId, id: { in: dayIds } },
    });
    if (days.length !== dayIds.length) {
      throw new BadRequestException('One or more days do not belong to this event');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.eventCategoryDay.deleteMany({ where: { categoryId } });
      if (dayIds.length > 0) {
        await tx.eventCategoryDay.createMany({
          data: dayIds.map((dayId) => ({ categoryId, dayId })),
        });
      }
    });
    return this.getEvent(userId, organizerId, eventId);
  }

  async generateAudienceDayPasses(
    userId: string,
    organizerId: string,
    eventId: string,
    input: {
      dayPriceMinor: number;
      fullPriceMinor: number;
      capacityPerDay: number;
      fullCapacity?: number;
      earlyBird?: {
        priceMinorDay: number;
        priceMinorFull: number;
        endsAt: string;
      };
    },
  ) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizerId },
      include: {
        days: { orderBy: { sortOrder: 'asc' } },
        categories: true,
      },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.days.length < 2) {
      throw new BadRequestException('Add at least two event days before generating day passes');
    }

    const prices = [
      input.dayPriceMinor,
      input.fullPriceMinor,
      ...(input.earlyBird
        ? [input.earlyBird.priceMinorDay, input.earlyBird.priceMinorFull]
        : []),
    ];
    await this.assertPaidCategoriesAllowed(organizerId, prices);

    const earlyEndsAt = input.earlyBird ? new Date(input.earlyBird.endsAt) : null;
    if (input.earlyBird && earlyEndsAt && Number.isNaN(earlyEndsAt.getTime())) {
      throw new BadRequestException('Invalid early bird endsAt');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const cat of event.categories.filter((c) => c.entryType === CategoryEntryType.viewer)) {
        const occupied = cat.reservedCount + cat.confirmedCount;
        if (occupied === 0) {
          await tx.eventCategory.delete({ where: { id: cat.id } });
        }
      }

      for (const day of event.days) {
        const created = await tx.eventCategory.create({
          data: {
            eventId,
            name: day.label,
            priceMinor: input.dayPriceMinor,
            capacity: Math.max(1, input.capacityPerDay),
            entryType: CategoryEntryType.viewer,
            minTeamSize: 1,
            maxTeamSize: 1,
            validDays: { create: [{ dayId: day.id }] },
          },
        });
        if (input.earlyBird && earlyEndsAt) {
          await tx.categoryPriceTier.createMany({
            data: [
              {
                categoryId: created.id,
                name: 'Early bird',
                priceMinor: input.earlyBird.priceMinorDay,
                endsAt: earlyEndsAt,
                sortOrder: 0,
              },
              {
                categoryId: created.id,
                name: 'Regular',
                priceMinor: input.dayPriceMinor,
                startsAt: earlyEndsAt,
                sortOrder: 1,
              },
            ],
          });
        }
      }

      const full = await tx.eventCategory.create({
        data: {
          eventId,
          name: 'Full event',
          priceMinor: input.fullPriceMinor,
          capacity: Math.max(1, input.fullCapacity ?? input.capacityPerDay * event.days.length),
          entryType: CategoryEntryType.viewer,
          minTeamSize: 1,
          maxTeamSize: 1,
          validDays: {
            create: event.days.map((day) => ({ dayId: day.id })),
          },
        },
      });
      if (input.earlyBird && earlyEndsAt) {
        await tx.categoryPriceTier.createMany({
          data: [
            {
              categoryId: full.id,
              name: 'Early bird',
              priceMinor: input.earlyBird.priceMinorFull,
              endsAt: earlyEndsAt,
              sortOrder: 0,
            },
            {
              categoryId: full.id,
              name: 'Regular',
              priceMinor: input.fullPriceMinor,
              startsAt: earlyEndsAt,
              sortOrder: 1,
            },
          ],
        });
      }
    });

    return this.getEvent(userId, organizerId, eventId);
  }

  private async assertCategoryOwned(organizerId: string, eventId: string, categoryId: string) {
    const category = await this.prisma.eventCategory.findFirst({
      where: { id: categoryId, eventId, event: { organizerId } },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  async addMediaLink(
    userId: string,
    organizerId: string,
    eventId: string,
    input: MediaLinkInput,
  ) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizerId },
      include: { categories: true },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    const categoryId = await this.resolveOptionalCategoryId(event, input.categoryId);
    const url = input.url.trim();
    await this.prisma.mediaLink.create({
      data: {
        eventId,
        categoryId,
        title: input.title.trim(),
        url,
        kind: resolveMediaLinkKind(input.kind, url),
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return this.getEvent(userId, organizerId, eventId);
  }

  async updateMediaLink(
    userId: string,
    organizerId: string,
    eventId: string,
    mediaLinkId: string,
    input: UpdateMediaLinkInput,
  ) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizerId },
      include: { categories: true },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    const existing = await this.prisma.mediaLink.findFirst({
      where: { id: mediaLinkId, eventId },
    });
    if (!existing) {
      throw new NotFoundException('Media link not found');
    }
    const categoryId =
      input.categoryId === undefined
        ? undefined
        : await this.resolveOptionalCategoryId(event, input.categoryId);
    const nextUrl = input.url === undefined ? existing.url : input.url.trim();
    await this.prisma.mediaLink.update({
      where: { id: mediaLinkId },
      data: {
        title: input.title === undefined ? undefined : input.title.trim(),
        url: input.url === undefined ? undefined : nextUrl,
        kind:
          input.kind !== undefined || input.url !== undefined
            ? resolveMediaLinkKind(input.kind ?? existing.kind, nextUrl)
            : undefined,
        categoryId,
        sortOrder: input.sortOrder,
      },
    });
    return this.getEvent(userId, organizerId, eventId);
  }

  async deleteMediaLink(
    userId: string,
    organizerId: string,
    eventId: string,
    mediaLinkId: string,
  ) {
    await this.requireMembership(organizerId, userId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);
    const existing = await this.prisma.mediaLink.findFirst({
      where: { id: mediaLinkId, eventId, event: { organizerId } },
    });
    if (!existing) {
      throw new NotFoundException('Media link not found');
    }
    await this.prisma.mediaLink.delete({ where: { id: mediaLinkId } });
    return this.getEvent(userId, organizerId, eventId);
  }

  private async resolveOptionalCategoryId(
    event: { id: string; categories: Array<{ id: string }> },
    categoryId: string | null | undefined,
  ): Promise<string | null> {
    if (categoryId === undefined || categoryId === null || categoryId === '') {
      return null;
    }
    if (!event.categories.some((row) => row.id === categoryId)) {
      throw new BadRequestException('Category does not belong to this event');
    }
    return categoryId;
  }

  private async syncAudiencePass(
    eventId: string,
    organizerId: string,
    pass: {
      enabled: boolean;
      priceMinor?: number;
      capacity?: number;
      name?: string;
    },
  ) {
    const viewers = await this.prisma.eventCategory.findMany({
      where: { eventId, entryType: CategoryEntryType.viewer },
      orderBy: { createdAt: 'asc' },
    });
    if (!pass.enabled) {
      for (const existing of viewers) {
        const occupied = existing.reservedCount + existing.confirmedCount;
        if (occupied > 0) {
          throw new BadRequestException('Cannot remove audience pass while holds or tickets exist');
        }
        await this.prisma.eventCategory.delete({ where: { id: existing.id } });
      }
      return;
    }

    const existing = viewers[0];
    const priceMinor = pass.priceMinor ?? existing?.priceMinor ?? 0;
    const capacity = Math.max(1, pass.capacity ?? existing?.capacity ?? 100);
    const name = (pass.name?.trim() || existing?.name || 'Viewers pass').slice(0, 80);
    await this.assertPaidCategoriesAllowed(organizerId, [priceMinor]);

    if (existing) {
      if (capacity < existing.reservedCount + existing.confirmedCount) {
        throw new BadRequestException('Audience capacity below current holds/tickets');
      }
      await this.prisma.eventCategory.update({
        where: { id: existing.id },
        data: { name, priceMinor, capacity, minTeamSize: 1, maxTeamSize: 1 },
      });
      return;
    }

    await this.prisma.eventCategory.create({
      data: {
        eventId,
        name,
        priceMinor,
        capacity,
        entryType: CategoryEntryType.viewer,
        minTeamSize: 1,
        maxTeamSize: 1,
      },
    });
  }

  private async assertPaidCategoriesAllowed(organizerId: string, pricesMinor: number[]) {
    if (!pricesMinor.some((price) => price > 0)) {
      return;
    }
    const ok = await this.payments.organizerCanAcceptPaid(organizerId);
    if (!ok) {
      throw new BadRequestException(
        'Set up Cashfree payouts before creating paid categories. Free (₹0) categories are always allowed.',
      );
    }
  }

  private async requireMembership(
    organizerId: string,
    userId: string,
    roles?: OrganizerMemberRole[],
  ) {
    const membership = await this.prisma.organizerMember.findUnique({
      where: { organizerId_userId: { organizerId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('Not an organizer member');
    }
    if (roles && !roles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient organizer permission');
    }
    return membership;
  }

  private async allocateOrganizerSlug(preferred: string): Promise<string> {
    let candidate = preferred;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const existing = await this.prisma.organizer.findUnique({ where: { slug: candidate } });
      if (!existing) {
        return candidate;
      }
      candidate = uniqueSlugCandidate(preferred);
    }
    throw new ConflictException('Could not allocate a unique organizer slug');
  }

  private async allocateEventSlug(preferred: string): Promise<string> {
    let candidate = preferred;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const existing = await this.prisma.event.findUnique({ where: { slug: candidate } });
      if (!existing) {
        return candidate;
      }
      candidate = uniqueSlugCandidate(preferred);
    }
    throw new ConflictException('Could not allocate a unique event slug');
  }

  private toOrganizerDto(
    organizer: {
      id: string;
      orgName: string;
      slug: string;
      type: OrganizerType;
      city: string | null;
      bio: string | null;
      instagram: string | null;
      verificationStatus: OrganizerVerificationStatus;
      createdAt: Date;
    },
    role: OrganizerMemberRole,
  ) {
    return {
      id: organizer.id,
      orgName: organizer.orgName,
      slug: organizer.slug,
      type: organizer.type,
      city: organizer.city,
      bio: organizer.bio,
      instagram: organizer.instagram,
      verificationStatus: organizer.verificationStatus,
      role,
      createdAt: organizer.createdAt.toISOString(),
    };
  }
}

function resolveEventType(value?: string): EventType {
  if (!value) {
    return EventType.battle;
  }
  if ((Object.values(EventType) as string[]).includes(value)) {
    return value as EventType;
  }
  throw new BadRequestException(`Unsupported eventType: ${value}`);
}

function resolveOrganizerType(value?: string): OrganizerType {
  if (!value) {
    return OrganizerType.independent;
  }
  if ((Object.values(OrganizerType) as string[]).includes(value)) {
    return value as OrganizerType;
  }
  throw new BadRequestException(`Unsupported organizer type: ${value}`);
}

function resolveCategorySizes(input: {
  entryType?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  teamSize?: number;
}): { entryType: CategoryEntryType; minTeamSize: number; maxTeamSize: number } {
  if (input.entryType === 'viewer') {
    return { entryType: CategoryEntryType.viewer, minTeamSize: 1, maxTeamSize: 1 };
  }
  const maxTeamSize = Math.max(1, input.maxTeamSize ?? input.teamSize ?? input.minTeamSize ?? 1);
  const minTeamSize = Math.max(1, Math.min(input.minTeamSize ?? maxTeamSize, maxTeamSize));
  let entryType: CategoryEntryType;
  if (input.entryType === 'solo' || input.entryType === 'team') {
    entryType = input.entryType;
  } else {
    entryType = maxTeamSize > 1 ? CategoryEntryType.team : CategoryEntryType.solo;
  }
  if (entryType === CategoryEntryType.solo && (minTeamSize !== 1 || maxTeamSize !== 1)) {
    return { entryType: CategoryEntryType.solo, minTeamSize: 1, maxTeamSize: 1 };
  }
  return { entryType, minTeamSize, maxTeamSize };
}

function resolveMediaLinkKind(kind: string | undefined, url: string): MediaLinkKind {
  if (kind && (Object.values(MediaLinkKind) as string[]).includes(kind)) {
    return kind as MediaLinkKind;
  }
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return MediaLinkKind.other;
  }
  if (host.includes('youtube.com') || host === 'youtu.be' || host.endsWith('.youtube.com')) {
    return MediaLinkKind.youtube;
  }
  if (host.includes('instagram.com')) {
    return MediaLinkKind.instagram;
  }
  if (host.includes('drive.google.com') || host.includes('docs.google.com')) {
    return MediaLinkKind.drive;
  }
  return MediaLinkKind.other;
}

function normalizeVenueCoords(
  lat: number | null | undefined,
  lng: number | null | undefined,
): { lat: number | null; lng: number | null } {
  if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return { lat: null, lng: null };
  }
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new BadRequestException('Map pin is out of range');
  }
  return { lat: latitude, lng: longitude };
}

async function syncEventGeography(
  prisma: PrismaService,
  eventId: string,
  lat: number | null,
  lng: number | null,
) {
  try {
    if (lat == null || lng == null) {
      await prisma.$executeRawUnsafe(`UPDATE "events" SET "location" = NULL WHERE "id" = $1::uuid`, eventId);
      return;
    }
    await prisma.$executeRawUnsafe(
      `UPDATE "events" SET "location" = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE "id" = $3::uuid`,
      lng,
      lat,
      eventId,
    );
  } catch {
    // PostGIS may be unavailable in some local setups — lat/lng columns still work for the map.
  }
}
