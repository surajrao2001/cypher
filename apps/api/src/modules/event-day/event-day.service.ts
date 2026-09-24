import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventOpsStatus,
  OrganizerMemberRole,
  type Prisma,
} from '@prisma/client';
import {
  assertEventDayWindows,
  assertIanaTimezone,
  patchEventDayConfigBodySchema,
  setEventOpsStatusBodySchema,
  type PatchEventDayConfigBodyInput,
} from '@cypher/validation';
import { PrismaService } from '../../common/prisma.service';
import { canTransitionOpsStatus } from './event-day.transitions';

const DEFAULT_TIMEZONE = 'Asia/Kolkata';
const DEFAULT_OPS_STATUS: EventOpsStatus = EventOpsStatus.scheduled;

type EffectiveConfig = {
  eventId: string;
  timezone: string;
  checkInOpensAt: Date | null;
  earlyCheckInEndsAt: Date | null;
  checkInClosesAt: Date | null;
  opsStatus: EventOpsStatus;
  persisted: boolean;
};

@Injectable()
export class EventDayService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Side-effect free effective config for an event.
   * Missing row → defaults. Never inserts.
   */
  async getEffectiveConfig(eventId: string): Promise<EffectiveConfig> {
    const row = await this.prisma.eventDayConfig.findUnique({ where: { eventId } });
    if (!row) {
      return {
        eventId,
        timezone: DEFAULT_TIMEZONE,
        checkInOpensAt: null,
        earlyCheckInEndsAt: null,
        checkInClosesAt: null,
        opsStatus: DEFAULT_OPS_STATUS,
        persisted: false,
      };
    }
    return {
      eventId: row.eventId,
      timezone: row.timezone,
      checkInOpensAt: row.checkInOpensAt,
      earlyCheckInEndsAt: row.earlyCheckInEndsAt,
      checkInClosesAt: row.checkInClosesAt,
      opsStatus: row.opsStatus,
      persisted: true,
    };
  }

  async getDayConfig(userId: string, organizerId: string, eventId: string) {
    await this.requireEventAccess(userId, organizerId, eventId);
    const effective = await this.getEffectiveConfig(eventId);
    return toDto(effective);
  }

  async patchDayConfig(
    userId: string,
    organizerId: string,
    eventId: string,
    body: PatchEventDayConfigBodyInput,
  ) {
    await this.requireEventAccess(userId, organizerId, eventId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
      OrganizerMemberRole.editor,
    ]);

    const parsed = patchEventDayConfigBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Invalid day-config patch');
    }
    const patch = parsed.data;

    const current = await this.getEffectiveConfig(eventId);
    const merged = mergePatch(current, patch);

    try {
      assertIanaTimezone(merged.timezone);
      assertEventDayWindows(merged);
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'Invalid day-config');
    }

    const data: Prisma.EventDayConfigUncheckedCreateInput = {
      eventId,
      timezone: merged.timezone,
      checkInOpensAt: merged.checkInOpensAt,
      earlyCheckInEndsAt: merged.earlyCheckInEndsAt,
      checkInClosesAt: merged.checkInClosesAt,
      opsStatus: merged.opsStatus,
    };

    const row = await this.prisma.eventDayConfig.upsert({
      where: { eventId },
      create: data,
      update: {
        timezone: data.timezone,
        checkInOpensAt: data.checkInOpensAt,
        earlyCheckInEndsAt: data.earlyCheckInEndsAt,
        checkInClosesAt: data.checkInClosesAt,
        // opsStatus is not part of PATCH — preserve existing
        opsStatus: current.opsStatus,
      },
    });

    return toDto(row);
  }

  async setOpsStatus(
    userId: string,
    organizerId: string,
    eventId: string,
    body: { opsStatus: string },
  ) {
    await this.requireEventAccess(userId, organizerId, eventId, [
      OrganizerMemberRole.owner,
      OrganizerMemberRole.manager,
    ]);

    const parsed = setEventOpsStatusBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Invalid ops status');
    }
    const next = parsed.data.opsStatus as EventOpsStatus;

    const current = await this.getEffectiveConfig(eventId);
    if (!canTransitionOpsStatus(current.opsStatus, next)) {
      throw new BadRequestException(
        `Cannot transition ops status from ${current.opsStatus} to ${next}`,
      );
    }

    const row = await this.prisma.eventDayConfig.upsert({
      where: { eventId },
      create: {
        eventId,
        timezone: current.timezone,
        checkInOpensAt: current.checkInOpensAt,
        earlyCheckInEndsAt: current.earlyCheckInEndsAt,
        checkInClosesAt: current.checkInClosesAt,
        opsStatus: next,
      },
      update: { opsStatus: next },
    });

    return toDto(row);
  }

  private async requireEventAccess(
    userId: string,
    organizerId: string,
    eventId: string,
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
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizerId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }
}

function mergePatch(
  current: EffectiveConfig,
  patch: {
    timezone?: string;
    checkInOpensAt?: string | null;
    earlyCheckInEndsAt?: string | null;
    checkInClosesAt?: string | null;
  },
): EffectiveConfig {
  return {
    eventId: current.eventId,
    timezone: patch.timezone !== undefined ? patch.timezone.trim() : current.timezone,
    checkInOpensAt:
      patch.checkInOpensAt === undefined
        ? current.checkInOpensAt
        : patch.checkInOpensAt === null
          ? null
          : new Date(patch.checkInOpensAt),
    earlyCheckInEndsAt:
      patch.earlyCheckInEndsAt === undefined
        ? current.earlyCheckInEndsAt
        : patch.earlyCheckInEndsAt === null
          ? null
          : new Date(patch.earlyCheckInEndsAt),
    checkInClosesAt:
      patch.checkInClosesAt === undefined
        ? current.checkInClosesAt
        : patch.checkInClosesAt === null
          ? null
          : new Date(patch.checkInClosesAt),
    opsStatus: current.opsStatus,
    persisted: current.persisted,
  };
}

function toDto(row: {
  eventId: string;
  timezone: string;
  checkInOpensAt: Date | null;
  earlyCheckInEndsAt: Date | null;
  checkInClosesAt: Date | null;
  opsStatus: EventOpsStatus;
}) {
  return {
    eventId: row.eventId,
    timezone: row.timezone,
    checkInOpensAt: row.checkInOpensAt ? row.checkInOpensAt.toISOString() : null,
    earlyCheckInEndsAt: row.earlyCheckInEndsAt ? row.earlyCheckInEndsAt.toISOString() : null,
    checkInClosesAt: row.checkInClosesAt ? row.checkInClosesAt.toISOString() : null,
    opsStatus: row.opsStatus,
  };
}
