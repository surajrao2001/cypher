import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventUpdateKind, type Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class EventUpdatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, organizerId: string, eventId: string) {
    await this.requireAccess(userId, organizerId, eventId);
    const rows = await this.prisma.eventUpdate.findMany({
      where: { eventId },
      orderBy: { publishedAt: 'desc' },
    });
    return { items: rows.map(toDto) };
  }

  async create(
    userId: string,
    organizerId: string,
    eventId: string,
    input: { kind?: string; title?: string | null; body: string; posterUrl?: string | null },
  ) {
    await this.requireAccess(userId, organizerId, eventId);
    const row = await this.prisma.eventUpdate.create({
      data: {
        eventId,
        authorUserId: userId,
        kind: resolveKind(input.kind),
        title: input.title?.trim() || null,
        body: input.body.trim(),
        posterUrl: input.posterUrl?.trim() || null,
      },
    });
    return toDto(row);
  }

  async update(
    userId: string,
    organizerId: string,
    eventId: string,
    updateId: string,
    input: { kind?: string; title?: string | null; body?: string; posterUrl?: string | null },
  ) {
    await this.requireAccess(userId, organizerId, eventId);
    const existing = await this.prisma.eventUpdate.findFirst({ where: { id: updateId, eventId } });
    if (!existing) throw new NotFoundException('Event update not found');
    const row = await this.prisma.eventUpdate.update({
      where: { id: updateId },
      data: {
        kind: input.kind === undefined ? undefined : resolveKind(input.kind),
        title: input.title === undefined ? undefined : input.title?.trim() || null,
        body: input.body === undefined ? undefined : input.body.trim(),
        posterUrl:
          input.posterUrl === undefined ? undefined : input.posterUrl?.trim() || null,
      },
    });
    return toDto(row);
  }

  async remove(userId: string, organizerId: string, eventId: string, updateId: string) {
    await this.requireAccess(userId, organizerId, eventId);
    const deleted = await this.prisma.eventUpdate.deleteMany({ where: { id: updateId, eventId } });
    if (!deleted.count) throw new NotFoundException('Event update not found');
    return { ok: true };
  }

  private async requireAccess(userId: string, organizerId: string, eventId: string) {
    const membership = await this.prisma.organizerMember.findUnique({
      where: { organizerId_userId: { organizerId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not an organizer member');
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizerId } });
    if (!event) throw new NotFoundException('Event not found');
  }
}

function resolveKind(value?: string): EventUpdateKind {
  return value && (Object.values(EventUpdateKind) as string[]).includes(value)
    ? (value as EventUpdateKind)
    : EventUpdateKind.GENERAL;
}

function toDto(row: Prisma.EventUpdateGetPayload<object>) {
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
