import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventStatus,
  RegistrationPaymentStatus,
  RegistrationStatus,
  type Prisma,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma.service';
import { RESERVATION_HOLD_MS } from '../../common/queues/queue-names';
import { ReservationJobsService } from '../../common/queues/reservation-jobs.service';
import { IdentityService } from '../identity/identity.service';
import { TicketsService } from '../tickets/tickets.service';

const HOLD_MS = RESERVATION_HOLD_MS;
const ACTIVE_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.pending_payment,
  RegistrationStatus.confirmed,
  RegistrationStatus.waitlist,
];

export type CreateRegistrationParticipantInput = {
  displayName: string;
  dancerName?: string;
  email?: string;
  phoneNumber?: string;
  userId?: string;
  isTeamCaptain?: boolean;
};

export type CreateRegistrationInput = {
  categoryId: string;
  entryName?: string;
  participants: CreateRegistrationParticipantInput[];
};

const registrationInclude = {
  category: true,
  event: { include: { organizer: true } },
  participants: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.RegistrationInclude;

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: IdentityService,
    private readonly tickets: TicketsService,
    private readonly reservationJobs: ReservationJobsService,
  ) {}

  async createHold(userId: string, input: CreateRegistrationInput) {
    await this.identity.ensureProfile(userId);
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId } });

    const category = await this.prisma.eventCategory.findUnique({
      where: { id: input.categoryId },
      include: { event: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const event = category.event;
    if (event.status !== EventStatus.published) {
      throw new BadRequestException('Event is not open for registration');
    }
    const now = new Date();
    if (event.registrationOpensAt && event.registrationOpensAt > now) {
      throw new BadRequestException('Registration has not opened yet');
    }
    if (event.registrationClosesAt && event.registrationClosesAt < now) {
      throw new BadRequestException('Registration is closed');
    }

    const participants = normalizeParticipants(input.participants, profile);
    validateTeamSize(category.minTeamSize, category.maxTeamSize, participants.length);

    const linkedUserIds = participants
      .map((p) => p.userId)
      .filter((id): id is string => Boolean(id));

    const expiresAt = new Date(now.getTime() + HOLD_MS);
    const registrationCode = await this.allocateRegistrationCode();

    try {
      const registration = await this.prisma.$transaction(async (tx) => {
        const existingCreator = await tx.registration.findFirst({
          where: {
            userId,
            categoryId: category.id,
            registrationStatus: { in: ACTIVE_STATUSES },
          },
        });
        if (existingCreator) {
          throw new ConflictException('You already have an active entry in this category');
        }

        if (linkedUserIds.length > 0) {
          const teammateConflict = await tx.registrationParticipant.findFirst({
            where: {
              userId: { in: linkedUserIds },
              registration: {
                categoryId: category.id,
                registrationStatus: { in: ACTIVE_STATUSES },
              },
            },
          });
          if (teammateConflict) {
            throw new ConflictException(
              'A participant is already on an active entry in this category',
            );
          }
        }

        const locked = await tx.$queryRaw<
          Array<{ id: string; reserved_count: number; confirmed_count: number; capacity: number }>
        >`
          SELECT id, reserved_count, confirmed_count, capacity
          FROM event_categories
          WHERE id = ${category.id}::uuid
          FOR UPDATE
        `;
        const row = locked[0];
        if (!row) {
          throw new NotFoundException('Category not found');
        }
        if (row.reserved_count + row.confirmed_count >= row.capacity) {
          throw new ConflictException('Category is full');
        }

        await tx.eventCategory.update({
          where: { id: category.id },
          data: { reservedCount: { increment: 1 } },
        });

        return tx.registration.create({
          data: {
            userId,
            eventId: event.id,
            categoryId: category.id,
            entryName: input.entryName?.trim() || null,
            paymentStatus:
              category.priceMinor === 0
                ? RegistrationPaymentStatus.not_started
                : RegistrationPaymentStatus.pending,
            registrationStatus: RegistrationStatus.pending_payment,
            reservationExpiresAt: expiresAt,
            totalAmountMinor: category.priceMinor,
            currency: 'INR',
            registrationCode,
            participants: {
              create: participants.map((p, index) => ({
                userId: p.userId ?? null,
                displayName: p.displayName,
                dancerName: p.dancerName ?? null,
                email: p.email ?? null,
                phoneNumber: p.phoneNumber ?? null,
                isTeamCaptain: p.isTeamCaptain ?? index === 0,
              })),
            },
          },
          include: registrationInclude,
        });
      });

      await this.reservationJobs.scheduleExpiry(registration.id, expiresAt);
      return toRegistrationDto(registration, this.tickets);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException('You already have an active entry in this category');
      }
      throw error;
    }
  }

  async listMine(userId: string) {
    const rows = await this.prisma.registration.findMany({
      where: { userId },
      include: registrationInclude,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { items: rows.map((row) => toRegistrationDto(row, this.tickets)) };
  }

  async getMine(userId: string, registrationId: string) {
    const row = await this.prisma.registration.findFirst({
      where: { id: registrationId, userId },
      include: registrationInclude,
    });
    if (!row) {
      throw new NotFoundException('Registration not found');
    }
    return toRegistrationDto(row, this.tickets);
  }

  async cancelHold(userId: string, registrationId: string) {
    const dto = await this.prisma.$transaction(async (tx) => {
      const row = await tx.registration.findFirst({
        where: { id: registrationId, userId },
        include: registrationInclude,
      });
      if (!row) {
        throw new NotFoundException('Registration not found');
      }
      if (row.registrationStatus !== RegistrationStatus.pending_payment) {
        throw new BadRequestException('Only pending holds can be cancelled');
      }

      const updated = await tx.registration.update({
        where: { id: row.id },
        data: {
          registrationStatus: RegistrationStatus.cancelled,
          reservationExpiresAt: null,
        },
        include: registrationInclude,
      });

      await tx.eventCategory.update({
        where: { id: row.categoryId },
        data: { reservedCount: { decrement: 1 } },
      });

      return toRegistrationDto(updated, this.tickets);
    });
    await this.reservationJobs.cancelExpiry(registrationId);
    return dto;
  }

  async confirmFree(userId: string, registrationId: string) {
    try {
      const dto = await this.prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM registrations
          WHERE id = ${registrationId}::uuid AND user_id = ${userId}::uuid
          FOR UPDATE
        `;
        if (!locked[0]) {
          throw new NotFoundException('Registration not found');
        }

        const row = await tx.registration.findFirst({
          where: { id: registrationId, userId },
          include: registrationInclude,
        });
        if (!row) {
          throw new NotFoundException('Registration not found');
        }

        if (row.registrationStatus === RegistrationStatus.confirmed) {
          if (!row.ticketQrToken) {
            const issued = this.tickets.issueHash(row.id);
            const patched = await tx.registration.update({
              where: { id: row.id },
              data: { ticketQrToken: issued.hash },
              include: registrationInclude,
            });
            return toRegistrationDto(patched, this.tickets);
          }
          return toRegistrationDto(row, this.tickets);
        }
        if (row.registrationStatus !== RegistrationStatus.pending_payment) {
          throw new BadRequestException('Only pending holds can be confirmed');
        }
        if (row.totalAmountMinor !== 0) {
          throw new BadRequestException('Paid entries cannot use free confirm');
        }

        await tx.$queryRaw`
          SELECT id FROM event_categories WHERE id = ${row.categoryId}::uuid FOR UPDATE
        `;

        const issued = this.tickets.issueHash(row.id);

        const updated = await tx.registration.update({
          where: { id: row.id },
          data: {
            registrationStatus: RegistrationStatus.confirmed,
            paymentStatus: RegistrationPaymentStatus.not_started,
            reservationExpiresAt: null,
            confirmedAt: new Date(),
            ticketQrToken: issued.hash,
          },
          include: registrationInclude,
        });

        await tx.eventCategory.update({
          where: { id: row.categoryId },
          data: {
            reservedCount: { decrement: 1 },
            confirmedCount: { increment: 1 },
          },
        });

        return toRegistrationDto(updated, this.tickets);
      });
      await this.reservationJobs.cancelExpiry(registrationId);
      return dto;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw error;
    }
  }

  private async allocateRegistrationCode(): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = `CY-${randomBytes(3).toString('hex').toUpperCase()}`;
      const existing = await this.prisma.registration.findUnique({
        where: { registrationCode: code },
      });
      if (!existing) {
        return code;
      }
    }
    throw new ConflictException('Could not allocate registration code');
  }
}

function normalizeParticipants(
  input: CreateRegistrationParticipantInput[],
  profile: { userId: string; name: string; dancerName: string | null },
): Array<{
  userId?: string;
  displayName: string;
  dancerName?: string | null;
  email?: string;
  phoneNumber?: string;
  isTeamCaptain: boolean;
}> {
  if (!input.length) {
    return [
      {
        userId: profile.userId,
        displayName: profile.dancerName?.trim() || profile.name,
        dancerName: profile.dancerName,
        isTeamCaptain: true,
      },
    ];
  }
  return input.map((p, index) => ({
    userId: p.userId,
    displayName: p.displayName.trim(),
    dancerName: p.dancerName?.trim(),
    email: p.email?.trim(),
    phoneNumber: p.phoneNumber?.trim(),
    isTeamCaptain: p.isTeamCaptain ?? index === 0,
  }));
}

function validateTeamSize(min: number, max: number, count: number) {
  if (count < min || count > max) {
    throw new BadRequestException(`This category requires ${min === max ? min : `${min}-${max}`} participants`);
  }
}

type RegistrationRecord = Prisma.RegistrationGetPayload<{ include: typeof registrationInclude }>;

export function toRegistrationDto(row: RegistrationRecord, tickets?: TicketsService) {
  const confirmed = row.registrationStatus === RegistrationStatus.confirmed;
  const ticketQrPayload =
    confirmed && tickets ? tickets.buildPayload(row.id) : null;

  return {
    id: row.id,
    eventId: row.eventId,
    categoryId: row.categoryId,
    entryName: row.entryName,
    registrationStatus: row.registrationStatus,
    paymentStatus: row.paymentStatus,
    reservationExpiresAt: row.reservationExpiresAt?.toISOString() ?? null,
    totalAmountMinor: row.totalAmountMinor,
    currency: row.currency,
    registrationCode: row.registrationCode,
    ticketQrPayload,
    hasTicket: Boolean(row.ticketQrToken) || Boolean(ticketQrPayload),
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    event: {
      id: row.event.id,
      slug: row.event.slug,
      title: row.event.title,
      city: row.event.city,
      startTime: row.event.startTime.toISOString(),
      organizerName: row.event.organizer.orgName,
    },
    category: {
      id: row.category.id,
      name: row.category.name,
      entryType: row.category.entryType,
      minTeamSize: row.category.minTeamSize,
      maxTeamSize: row.category.maxTeamSize,
      priceMinor: row.category.priceMinor,
    },
    participants: row.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      dancerName: p.dancerName,
      isTeamCaptain: p.isTeamCaptain,
    })),
  };
}
