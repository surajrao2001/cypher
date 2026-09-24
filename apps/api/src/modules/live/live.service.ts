import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryEntryType, EventStatus, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { EventDayService } from '../event-day/event-day.service';
import { ProgressionService } from '../progression/progression.service';

/** Same dancer-facing visibility as public event detail. */
const LIVE_EVENT_STATUSES: EventStatus[] = [
  EventStatus.published,
  EventStatus.registration_closed,
  EventStatus.completed,
];

/** Bounded Live announcement slice (newest-first). EventUpdate has no private flag today. */
export const LIVE_ANNOUNCEMENT_LIMIT = 10;

@Injectable()
export class LiveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventDay: EventDayService,
    private readonly progression: ProgressionService,
  ) {}

  /**
   * Authenticated dancer Live projection. Read-only — never mutates config/check-in/XP/updates.
   */
  async getMyEventLive(userId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, status: { in: LIVE_EVENT_STATUSES } },
      select: { id: true },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const [dayConfig, myRegistrations, announcements, progression] = await Promise.all([
      this.eventDay.getEffectiveConfig(eventId),
      this.prisma.registration.findMany({
        where: {
          eventId,
          registrationStatus: RegistrationStatus.confirmed,
          OR: [
            // Competitor (and typical viewer) identity: linked participant
            { participants: { some: { userId } } },
            // Audience ownership: Registration.userId purchaser for viewer passes
            { userId, category: { entryType: CategoryEntryType.viewer } },
          ],
        },
        select: {
          id: true,
          category: { select: { id: true, name: true, entryType: true } },
          checkIn: { select: { checkedInAt: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.eventUpdate.findMany({
        where: { eventId },
        orderBy: { publishedAt: 'desc' },
        take: LIVE_ANNOUNCEMENT_LIMIT,
      }),
      this.progression.getEventDayProgression(this.prisma, eventId, userId),
    ]);

    const myEntries = myRegistrations.map((reg) => {
      const checkedIn = Boolean(reg.checkIn);
      return {
        registrationId: reg.id,
        categoryId: reg.category.id,
        categoryName: reg.category.name,
        entryType: reg.category.entryType,
        checkedIn,
        checkedInAt: reg.checkIn?.checkedInAt.toISOString() ?? null,
      };
    });

    const attendanceVerified = myEntries.some(
      (entry) =>
        (entry.entryType === CategoryEntryType.solo || entry.entryType === CategoryEntryType.team) &&
        entry.checkedIn,
    );

    return {
      eventId,
      ops: {
        status: dayConfig.opsStatus,
        timezone: dayConfig.timezone,
      },
      checkIn: {
        opensAt: dayConfig.checkInOpensAt?.toISOString() ?? null,
        earlyEndsAt: dayConfig.earlyCheckInEndsAt?.toISOString() ?? null,
        closesAt: dayConfig.checkInClosesAt?.toISOString() ?? null,
        attendanceVerified,
        earlyCheckInEarned: progression.earlyCheckInXp > 0,
        myEntries,
      },
      progression,
      announcements: announcements.map(toAnnouncementDto),
    };
  }
}

function toAnnouncementDto(row: {
  id: string;
  eventId: string;
  authorUserId: string;
  kind: string;
  title: string | null;
  body: string;
  posterUrl: string | null;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    eventId: row.eventId,
    authorUserId: row.authorUserId,
    kind: row.kind,
    title: row.title,
    body: row.body,
    posterUrl: row.posterUrl,
    publishedAt: row.publishedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
