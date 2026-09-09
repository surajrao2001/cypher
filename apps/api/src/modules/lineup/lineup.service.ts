import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventUpdateKind, LineupRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class LineupService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, organizerId: string, eventId: string) {
    await this.requireAccess(userId, organizerId, eventId);
    return {
      items: (
        await this.prisma.eventLineupPerson.findMany({
          where: { eventId },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        })
      ).map(toLineupDto),
    };
  }

  async replace(
    userId: string,
    organizerId: string,
    eventId: string,
    input: {
      people: Array<{
        name: string;
        role: string;
        categoryId?: string | null;
        instagram?: string | null;
        photoUrl?: string | null;
        blurb?: string | null;
        sortOrder?: number;
      }>;
      announce?: boolean;
    },
  ) {
    const event = await this.requireAccess(userId, organizerId, eventId);
    const categoryIds = new Set(
      (await this.prisma.eventCategory.findMany({ where: { eventId }, select: { id: true } })).map(
        (row) => row.id,
      ),
    );
    if (input.people.some((person) => person.categoryId && !categoryIds.has(person.categoryId))) {
      throw new BadRequestException('Lineup category does not belong to this event');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.eventLineupPerson.deleteMany({ where: { eventId } });
      if (input.people.length) {
        await tx.eventLineupPerson.createMany({
          data: input.people.map((person, index) => ({
            eventId,
            name: person.name.trim(),
            role: person.role as LineupRole,
            categoryId: person.categoryId || null,
            instagram: person.instagram?.replace(/^@/, '').trim() || null,
            photoUrl: person.photoUrl?.trim() || null,
            blurb: person.blurb?.trim() || null,
            sortOrder: person.sortOrder ?? index,
          })),
        });
      }
      if (input.announce) {
        const names = input.people.map((person) => `${person.name} (${person.role})`).join(', ');
        await tx.eventUpdate.create({
          data: {
            eventId,
            authorUserId: userId,
            kind: EventUpdateKind.LINEUP,
            title: 'Lineup update',
            body: names || `The lineup for ${event.title} has been updated.`,
          },
        });
      }
    });
    return this.list(userId, organizerId, eventId);
  }

  private async requireAccess(userId: string, organizerId: string, eventId: string) {
    const membership = await this.prisma.organizerMember.findUnique({
      where: { organizerId_userId: { organizerId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not an organizer member');
    const event = await this.prisma.event.findFirst({ where: { id: eventId, organizerId } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }
}

function toLineupDto(row: {
  id: string;
  eventId: string;
  name: string;
  role: LineupRole;
  categoryId: string | null;
  instagram: string | null;
  photoUrl: string | null;
  blurb: string | null;
  sortOrder: number;
}) {
  return {
    id: row.id,
    eventId: row.eventId,
    name: row.name,
    role: row.role,
    categoryId: row.categoryId,
    instagram: row.instagram,
    photoUrl: row.photoUrl,
    blurb: row.blurb,
    sortOrder: row.sortOrder,
  };
}
