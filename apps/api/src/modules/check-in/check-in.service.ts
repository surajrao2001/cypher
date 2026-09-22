import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryEntryType,
  CheckInChannel,
  RegistrationStatus,
  type CheckIn,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { EventDayService } from '../event-day/event-day.service';
import { ProgressionService } from '../progression/progression.service';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class CheckInService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tickets: TicketsService,
    private readonly eventDay: EventDayService,
    private readonly progression: ProgressionService,
  ) {}

  async create(
    userId: string,
    organizerId: string,
    eventId: string,
    input: { qrToken?: string; registrationCode?: string; channel?: string },
  ) {
    await this.requireEventMember(userId, organizerId, eventId);
    if (!input.qrToken && !input.registrationCode) {
      throw new BadRequestException('Provide qrToken or registrationCode');
    }

    const registrationId = input.qrToken ? this.tickets.verifyPayload(input.qrToken) : null;
    if (input.qrToken && !registrationId) {
      throw new BadRequestException('Invalid ticket QR');
    }

    const registration = await this.prisma.registration.findFirst({
      where: registrationId
        ? { id: registrationId }
        : { registrationCode: input.registrationCode?.trim() },
      include: {
        participants: { orderBy: { createdAt: 'asc' } },
        checkIn: true,
        category: { select: { id: true, name: true, entryType: true } },
      },
    });
    if (!registration) throw new NotFoundException('Registration not found');
    if (registration.eventId !== eventId) {
      throw new BadRequestException('Ticket belongs to another event');
    }
    if (registration.registrationStatus !== RegistrationStatus.confirmed) {
      throw new BadRequestException('Only confirmed registrations can check in');
    }
    if (input.qrToken && this.tickets.hashPayload(input.qrToken) !== registration.ticketQrToken) {
      throw new BadRequestException('Ticket is no longer valid');
    }

    const channel =
      input.channel === 'SCAN' || input.channel === 'CODE' || input.channel === 'MANUAL'
        ? input.channel
        : input.qrToken
          ? CheckInChannel.SCAN
          : CheckInChannel.CODE;

    // Existing CheckIn: idempotent return — no XP backfill for historical/pre-G1 rows.
    if (registration.checkIn) {
      return this.toDtoWithProgression(registration.checkIn, registration);
    }

    // Early window uses side-effect-free effective config (never creates EventDayConfig).
    const dayConfig = await this.eventDay.getEffectiveConfig(eventId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const locked = await tx.registration.findFirst({
          where: { id: registration.id },
          include: {
            participants: { orderBy: { createdAt: 'asc' } },
            checkIn: true,
            category: { select: { id: true, name: true, entryType: true } },
          },
        });
        if (!locked) throw new NotFoundException('Registration not found');
        if (locked.checkIn) {
          // Race: another request created CheckIn — no XP backfill.
          return this.toDtoWithProgression(locked.checkIn, locked, tx);
        }

        let row: CheckIn;
        const canSavepoint = typeof tx.$executeRawUnsafe === 'function';
        try {
          // Isolate unique(registration_id) race behind a SAVEPOINT so the outer
          // interactive transaction stays usable after P2002.
          if (canSavepoint) {
            await tx.$executeRawUnsafe(`SAVEPOINT g1_checkin_insert`);
          }
          row = await tx.checkIn.create({
            data: {
              eventId,
              registrationId: locked.id,
              checkedInByUserId: userId,
              channel,
            },
          });
          if (canSavepoint) {
            await tx.$executeRawUnsafe(`RELEASE SAVEPOINT g1_checkin_insert`);
          }
        } catch (error) {
          if (canSavepoint) {
            try {
              await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT g1_checkin_insert`);
            } catch {
              // ignore
            }
          }
          if (isCheckInRegistrationConflict(error)) {
            const existing = await tx.checkIn.findUnique({
              where: { registrationId: locked.id },
            });
            if (existing) {
              return this.toDtoWithProgression(existing, locked, tx);
            }
          }
          throw error;
        }

        const eligibleUserIds = resolveEligibleCompetitorUserIds(locked);
        const earlyEligible = isEarlyCheckInEligible(dayConfig, row.checkedInAt);

        if (eligibleUserIds.length > 0) {
          await this.progression.ensureG1CheckInRewards(tx, {
            eventId,
            checkInId: row.id,
            eligibleUserIds,
            earlyEligible,
          });
        }

        return this.toDtoWithProgression(row, locked, tx);
      });
    } catch (error) {
      if (isCheckInRegistrationConflict(error)) {
        const existing = await this.prisma.checkIn.findUnique({
          where: { registrationId: registration.id },
        });
        if (existing) {
          return this.toDtoWithProgression(existing, registration);
        }
      }
      throw error;
    }
  }

  async list(userId: string, organizerId: string, eventId: string) {
    await this.requireEventMember(userId, organizerId, eventId);
    const [items, confirmed] = await Promise.all([
      this.prisma.checkIn.findMany({
        where: { eventId },
        include: {
          registration: {
            include: {
              participants: { orderBy: { createdAt: 'asc' } },
              category: { select: { id: true, name: true, entryType: true } },
            },
          },
        },
        orderBy: { checkedInAt: 'desc' },
        take: 500,
      }),
      this.prisma.registration.count({
        where: { eventId, registrationStatus: RegistrationStatus.confirmed },
      }),
    ]);
    // List stays registration-centric; omit multi-user progression ambiguity.
    return {
      items: items.map((row) => this.toDto(row, row.registration)),
      totals: { checkedIn: items.length, confirmed },
    };
  }

  private async requireEventMember(userId: string, organizerId: string, eventId: string) {
    const membership = await this.prisma.organizerMember.findUnique({
      where: { organizerId_userId: { organizerId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not an organizer member');
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizerId } });
    if (!event) throw new NotFoundException('Event not found');
  }

  private async toDtoWithProgression(
    row: {
      id: string;
      eventId: string;
      registrationId: string;
      checkedInAt: Date;
      checkedInByUserId: string;
      channel: CheckInChannel;
    },
    registration: {
      registrationCode: string;
      entryName: string | null;
      participants: Array<{
        userId: string | null;
        dancerName: string | null;
        displayName: string;
      }>;
      category: { entryType: CategoryEntryType };
    },
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    eventId: string;
    registrationId: string;
    checkedInAt: string;
    checkedInByUserId: string;
    channel: CheckInChannel;
    registrationCode: string;
    entryName: string | null;
    dancerName: string | null;
    progression?: {
      attendanceXp: number;
      earlyCheckInXp: number;
      totalEventDayXp: number;
    };
  }> {
    const base = this.toDto(row, registration);
    const eligible = resolveEligibleCompetitorUserIds(registration);
    // Organizer CheckInDto is registration-centric: only attach progression when
    // exactly one linked competitor (solo or single-linked team). Multi-recipient
    // team XP is authoritative in the ledger / dancer Live — not flattened here.
    if (eligible.length !== 1) {
      return base;
    }
    const summary = await this.progression.getEventDayProgression(
      tx ?? this.prisma,
      row.eventId,
      eligible[0]!,
    );
    return { ...base, progression: summary };
  }

  private toDto(
    row: {
      id: string;
      eventId: string;
      registrationId: string;
      checkedInAt: Date;
      checkedInByUserId: string;
      channel: CheckInChannel;
    },
    registration: {
      registrationCode: string;
      entryName: string | null;
      participants: Array<{ dancerName: string | null; displayName: string }>;
    },
  ) {
    const first = registration.participants[0];
    return {
      id: row.id,
      eventId: row.eventId,
      registrationId: row.registrationId,
      checkedInAt: row.checkedInAt.toISOString(),
      checkedInByUserId: row.checkedInByUserId,
      channel: row.channel,
      registrationCode: registration.registrationCode,
      entryName: registration.entryName,
      dancerName: first?.dancerName ?? first?.displayName ?? null,
    };
  }
}

/** Linked RegistrationParticipant.userId values for solo/team; viewers → none. */
export function resolveEligibleCompetitorUserIds(registration: {
  category: { entryType: CategoryEntryType };
  participants: Array<{ userId: string | null }>;
}): string[] {
  const entryType = registration.category.entryType;
  if (entryType !== CategoryEntryType.solo && entryType !== CategoryEntryType.team) {
    return [];
  }
  const ids = registration.participants
    .map((p) => p.userId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  return [...new Set(ids)];
}

/** [checkInOpensAt, earlyCheckInEndsAt) — both bounds required. */
export function isEarlyCheckInEligible(
  config: { checkInOpensAt: Date | null; earlyCheckInEndsAt: Date | null },
  checkedInAt: Date,
): boolean {
  if (!config.checkInOpensAt || !config.earlyCheckInEndsAt) {
    return false;
  }
  const t = checkedInAt.getTime();
  return t >= config.checkInOpensAt.getTime() && t < config.earlyCheckInEndsAt.getTime();
}

function isCheckInRegistrationConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }
  if ((error as { code?: string }).code !== 'P2002') {
    return false;
  }
  const target = (error as { meta?: { target?: string | string[] } }).meta?.target;
  const fields = Array.isArray(target) ? target : target ? [target] : [];
  return fields.some(
    (f) =>
      f === 'registration_id' ||
      f === 'registrationId' ||
      f.includes('registration'),
  );
}
