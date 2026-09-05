import { Injectable } from '@nestjs/common';
import { RegistrationStatus } from '@prisma/client';
import { PrismaService } from './prisma.service';

export type ExpireResult = 'expired' | 'skipped';

@Injectable()
export class ReservationExpiryService {
  constructor(private readonly prisma: PrismaService) {}

  async expireOne(registrationId: string, now = new Date()): Promise<ExpireResult> {
    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM registrations WHERE id = ${registrationId}::uuid FOR UPDATE
      `;
      if (!locked[0]) {
        return 'skipped' as const;
      }

      const row = await tx.registration.findUnique({
        where: { id: registrationId },
        select: {
          id: true,
          categoryId: true,
          registrationStatus: true,
          reservationExpiresAt: true,
        },
      });
      if (!row) {
        return 'skipped' as const;
      }
      if (row.registrationStatus !== RegistrationStatus.pending_payment) {
        return 'skipped' as const;
      }
      if (!row.reservationExpiresAt || row.reservationExpiresAt > now) {
        return 'skipped' as const;
      }

      await tx.registration.update({
        where: { id: row.id },
        data: {
          registrationStatus: RegistrationStatus.expired,
          reservationExpiresAt: null,
        },
      });

      await tx.$executeRaw`
        UPDATE event_categories
        SET reserved_count = reserved_count - 1
        WHERE id = ${row.categoryId}::uuid
          AND reserved_count > 0
      `;

      return 'expired' as const;
    });
  }

  async sweepDue(now = new Date(), limit = 100): Promise<{ scanned: number; expired: number }> {
    const due = await this.prisma.registration.findMany({
      where: {
        registrationStatus: RegistrationStatus.pending_payment,
        reservationExpiresAt: { lte: now },
      },
      select: { id: true },
      orderBy: { reservationExpiresAt: 'asc' },
      take: limit,
    });

    let expired = 0;
    for (const row of due) {
      const result = await this.expireOne(row.id, now);
      if (result === 'expired') {
        expired += 1;
      }
    }

    return { scanned: due.length, expired };
  }
}
