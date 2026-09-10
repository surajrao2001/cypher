import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CheckInChannel, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class CheckInService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tickets: TicketsService,
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
    if (registration.checkIn) throw new ConflictException('Registration already checked in');

    const channel =
      input.channel === 'SCAN' || input.channel === 'CODE' || input.channel === 'MANUAL'
        ? input.channel
        : input.qrToken
          ? CheckInChannel.SCAN
          : CheckInChannel.CODE;
    try {
      const row = await this.prisma.checkIn.create({
        data: {
          eventId,
          registrationId: registration.id,
          checkedInByUserId: userId,
          channel,
        },
      });
      return this.toDto(row, registration);
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Registration already checked in');
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
          registration: { include: { participants: { orderBy: { createdAt: 'asc' } } } },
        },
        orderBy: { checkedInAt: 'desc' },
        take: 500,
      }),
      this.prisma.registration.count({
        where: { eventId, registrationStatus: RegistrationStatus.confirmed },
      }),
    ]);
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
