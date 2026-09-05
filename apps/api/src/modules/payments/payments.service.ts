import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OrganizerPayoutAccountStatus,
  PaymentOrderStatus,
  PaymentProvider,
  PaymentRecordStatus,
  Prisma,
  RegistrationPaymentStatus,
  RegistrationStatus,
  WebhookProcessingStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../../common/prisma.service';
import { ReservationJobsService } from '../../common/queues/reservation-jobs.service';
import { PaymentSplitJobsService } from '../../common/queues/payment-split-jobs.service';
import type { Env } from '../../config/env.validation';
import { TicketsService } from '../tickets/tickets.service';
import { CashfreeClient } from './cashfree.client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cashfree: CashfreeClient,
    private readonly config: ConfigService<Env, true>,
    private readonly tickets: TicketsService,
    private readonly reservationJobs: ReservationJobsService,
    private readonly paymentSplits: PaymentSplitJobsService,
  ) {}

  async getOrganizerPaymentAccount(organizerId: string) {
    const account = await this.prisma.organizerPaymentAccount.findUnique({
      where: { organizerId },
    });
    return account
      ? this.mapAccount(account)
      : {
          organizerId,
          provider: 'cashfree' as const,
          status: 'not_started' as const,
          payoutReady: false,
          providerVendorId: null,
          displayName: null,
          contactEmail: null,
          contactPhone: null,
          lastError: null,
        };
  }

  /**
   * Starts Cashfree Easy Split vendor onboarding for an organizer.
   * Bank KYC completion happens in Cashfree — sandbox marks payoutReady immediately.
   */
  async startOrganizerPayoutSetup(
    organizerId: string,
    input: { displayName: string; contactEmail: string; contactPhone: string },
  ) {
    if (!this.cashfree.isConfigured()) {
      throw new ServiceUnavailableException('Cashfree is not configured');
    }

    const organizer = await this.prisma.organizer.findUnique({ where: { id: organizerId } });
    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    const vendorId = `org_${organizer.slug}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    let account = await this.prisma.organizerPaymentAccount.findUnique({
      where: { organizerId },
    });

    if (!account) {
      account = await this.prisma.organizerPaymentAccount.create({
        data: {
          organizerId,
          provider: PaymentProvider.cashfree,
          providerVendorId: vendorId,
          status: OrganizerPayoutAccountStatus.pending,
          payoutReady: false,
          displayName: input.displayName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
        },
      });
    }

    try {
      const vendor = await this.cashfree.createVendor({
        vendorId: account.providerVendorId ?? vendorId,
        name: input.displayName,
        email: input.contactEmail,
        phone: input.contactPhone,
      });
      const sandbox = this.config.get('CASHFREE_ENV', { infer: true }) === 'sandbox';
      account = await this.prisma.organizerPaymentAccount.update({
        where: { organizerId },
        data: {
          providerVendorId: vendor.vendorId,
          displayName: input.displayName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          lastError: null,
          status: sandbox
            ? OrganizerPayoutAccountStatus.active
            : OrganizerPayoutAccountStatus.pending,
          payoutReady: sandbox,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Vendor create failed';
      account = await this.prisma.organizerPaymentAccount.update({
        where: { organizerId },
        data: {
          status: OrganizerPayoutAccountStatus.action_required,
          lastError: message,
          payoutReady: false,
        },
      });
      throw error;
    }

    return this.mapAccount(account);
  }

  async organizerCanAcceptPaid(organizerId: string): Promise<boolean> {
    const account = await this.prisma.organizerPaymentAccount.findUnique({
      where: { organizerId },
    });
    return Boolean(account?.payoutReady && account.status === OrganizerPayoutAccountStatus.active);
  }

  async createCheckoutSession(
    userId: string,
    registrationId: string,
    customerPhone: string,
  ) {
    if (!this.cashfree.isConfigured()) {
      throw new ServiceUnavailableException('Cashfree is not configured');
    }

    const digits = customerPhone.replace(/\D/g, '');
    const phone = digits.length >= 10 ? digits.slice(-10) : '';
    if (phone.length !== 10) {
      throw new BadRequestException('customerPhone must be a 10-digit Indian mobile number');
    }

    const registration = await this.prisma.registration.findFirst({
      where: { id: registrationId, userId },
      include: {
        category: true,
        event: { include: { organizer: { include: { paymentAccount: true } } } },
        user: { include: { profile: true } },
      },
    });
    if (!registration) {
      throw new NotFoundException('Registration not found');
    }
    if (registration.registrationStatus !== RegistrationStatus.pending_payment) {
      throw new BadRequestException('Registration is not awaiting payment');
    }
    if (registration.totalAmountMinor <= 0) {
      throw new BadRequestException('Use free confirm for ₹0 registrations');
    }

    const account = registration.event.organizer.paymentAccount;
    if (!account?.payoutReady || account.status !== OrganizerPayoutAccountStatus.active) {
      throw new BadRequestException(
        'Organizer has not finished payout setup. Paid registration is unavailable.',
      );
    }

    const existing = await this.prisma.paymentOrder.findFirst({
      where: {
        registrationId,
        provider: PaymentProvider.cashfree,
        status: { in: [PaymentOrderStatus.created, PaymentOrderStatus.attempted] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existing?.providerSessionId) {
      return {
        registrationId,
        provider: 'cashfree' as const,
        orderId: existing.providerOrderId,
        paymentSessionId: existing.providerSessionId,
        amountMinor: existing.amountMinor,
        currency: existing.currency,
      };
    }

    const orderId = `reg_${registration.id.replaceAll('-', '').slice(0, 20)}_${Date.now().toString(36)}`;
    const publicApi = this.config.get('PUBLIC_API_URL', { infer: true });
    const webOrigin = this.config.get('WEB_ORIGIN', { infer: true });

    const created = await this.cashfree.createOrder({
      orderId,
      amountMajor: registration.totalAmountMinor / 100,
      currency: registration.currency,
      customerId: userId.replaceAll('-', '').slice(0, 50),
      customerPhone: phone,
      customerName: registration.user.profile?.dancerName ?? registration.user.profile?.name,
      returnUrl: `${webOrigin}/tickets?payment=return&order_id={order_id}`,
      notifyUrl: `${publicApi}/${this.config.get('API_PREFIX', { infer: true })}/payments/webhooks/cashfree`,
      orderNote: registration.event.title.slice(0, 100),
    });

    await this.prisma.paymentOrder.create({
      data: {
        registrationId,
        provider: PaymentProvider.cashfree,
        providerOrderId: created.orderId,
        providerSessionId: created.paymentSessionId,
        amountMinor: registration.totalAmountMinor,
        currency: registration.currency,
        status: PaymentOrderStatus.created,
      },
    });

    await this.prisma.registration.update({
      where: { id: registrationId },
      data: { paymentStatus: RegistrationPaymentStatus.pending },
    });

    return {
      registrationId,
      provider: 'cashfree' as const,
      orderId: created.orderId,
      paymentSessionId: created.paymentSessionId,
      amountMinor: registration.totalAmountMinor,
      currency: registration.currency,
    };
  }

  async handleCashfreeWebhook(rawBody: string, timestamp: string, signature: string) {
    const signatureOk = this.cashfree.verifyWebhookSignature(rawBody, timestamp, signature);
    if (!signatureOk) {
      // Dashboard Test often signs differently / probes with junk signatures.
      // In sandbox, ack with 200 so Cashfree saves the URL; still reject in production.
      if (this.config.get('CASHFREE_ENV', { infer: true }) !== 'sandbox') {
        throw new BadRequestException('Invalid Cashfree webhook signature');
      }
      return { ok: true as const, received: true, signatureSkipped: true };
    }

    const payload = JSON.parse(rawBody) as {
      type?: string;
      data?: {
        order?: { order_id?: string };
        payment?: {
          cf_payment_id?: string | number;
          payment_group?: string;
        };
      };
    };

    const eventType = payload.type ?? 'unknown';
    const orderId = payload.data?.order?.order_id;
    const providerEventId =
      String(payload.data?.payment?.cf_payment_id ?? '') ||
      `${eventType}:${orderId ?? randomUUID()}`;

    const existing = await this.prisma.paymentWebhookEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider: PaymentProvider.cashfree,
          providerEventId,
        },
      },
    });
    if (existing?.processingStatus === WebhookProcessingStatus.processed) {
      return { ok: true as const, duplicate: true };
    }

    const webhook = await this.prisma.paymentWebhookEvent.upsert({
      where: {
        provider_providerEventId: {
          provider: PaymentProvider.cashfree,
          providerEventId,
        },
      },
      create: {
        provider: PaymentProvider.cashfree,
        providerEventId,
        eventType,
        payload: payload as Prisma.InputJsonValue,
        processingStatus: WebhookProcessingStatus.processing,
      },
      update: {
        processingStatus: WebhookProcessingStatus.processing,
        error: null,
      },
    });

    try {
      if (
        eventType === 'PAYMENT_SUCCESS_WEBHOOK' ||
        eventType === 'PAYMENT_SUCCESS' ||
        eventType.includes('SUCCESS')
      ) {
        await this.confirmPaidOrder(orderId, payload);
      } else {
        // Ack non-success / test event types without failing the delivery.
      }
      await this.prisma.paymentWebhookEvent.update({
        where: { id: webhook.id },
        data: {
          processingStatus: WebhookProcessingStatus.processed,
          processedAt: new Date(),
        },
      });
      return { ok: true as const, duplicate: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Webhook processing failed';
      await this.prisma.paymentWebhookEvent.update({
        where: { id: webhook.id },
        data: {
          processingStatus: WebhookProcessingStatus.failed,
          error: message,
        },
      });
      throw error;
    }
  }

  private async confirmPaidOrder(
    orderId: string | undefined,
    payload: {
      data?: {
        payment?: {
          cf_payment_id?: string | number;
          payment_group?: string;
        };
      };
    },
  ) {
    if (!orderId) {
      throw new BadRequestException('Missing order_id in webhook');
    }

    const paymentOrder = await this.prisma.paymentOrder.findUnique({
      where: { providerOrderId: orderId },
      include: {
        registration: {
          include: {
            event: { include: { organizer: { include: { paymentAccount: true } } } },
          },
        },
      },
    });
    if (!paymentOrder) {
      // Dashboard test samples / stale notify_url pings — ack so Cashfree stops retrying.
      return;
    }
    if (paymentOrder.status === PaymentOrderStatus.paid) {
      return;
    }

    const providerPaymentId = String(payload.data?.payment?.cf_payment_id ?? `cf_${orderId}`);
    const issued = this.tickets.issueHash(paymentOrder.registrationId);

    await this.prisma.$transaction(async (tx) => {
      const reg = await tx.registration.findUnique({ where: { id: paymentOrder.registrationId } });
      if (!reg) {
        return;
      }
      if (reg.registrationStatus === RegistrationStatus.confirmed) {
        await tx.paymentOrder.update({
          where: { id: paymentOrder.id },
          data: { status: PaymentOrderStatus.paid },
        });
        return;
      }
      if (reg.registrationStatus !== RegistrationStatus.pending_payment) {
        throw new BadRequestException('Registration not in pending_payment');
      }

      await tx.$queryRaw`
        SELECT id FROM event_categories WHERE id = ${reg.categoryId}::uuid FOR UPDATE
      `;

      await tx.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: { status: PaymentOrderStatus.paid },
      });
      await tx.payment.upsert({
        where: { providerPaymentId },
        create: {
          paymentOrderId: paymentOrder.id,
          providerPaymentId,
          amountMinor: paymentOrder.amountMinor,
          status: PaymentRecordStatus.captured,
          method: payload.data?.payment?.payment_group ?? null,
          capturedAt: new Date(),
        },
        update: {
          status: PaymentRecordStatus.captured,
          capturedAt: new Date(),
        },
      });
      await tx.registration.update({
        where: { id: reg.id },
        data: {
          registrationStatus: RegistrationStatus.confirmed,
          paymentStatus: RegistrationPaymentStatus.paid,
          confirmedAt: new Date(),
          reservationExpiresAt: null,
          ticketQrToken: issued.hash,
        },
      });
      await tx.eventCategory.update({
        where: { id: reg.categoryId },
        data: {
          reservedCount: { decrement: 1 },
          confirmedCount: { increment: 1 },
        },
      });
    });

    await this.reservationJobs.cancelExpiry(paymentOrder.registrationId);

    const vendorId =
      paymentOrder.registration.event.organizer.paymentAccount?.providerVendorId;
    if (vendorId) {
      await this.paymentSplits.scheduleSplit({
        orderId,
        vendorId,
        amountMajor: paymentOrder.amountMinor / 100,
      });
    }
  }

  private mapAccount(account: {
    organizerId: string;
    provider: PaymentProvider;
    status: OrganizerPayoutAccountStatus;
    payoutReady: boolean;
    providerVendorId: string | null;
    displayName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    lastError: string | null;
  }) {
    return {
      organizerId: account.organizerId,
      provider:
        account.provider === PaymentProvider.cashfree
          ? ('cashfree' as const)
          : ('razorpay' as const),
      status: account.status,
      payoutReady: account.payoutReady,
      providerVendorId: account.providerVendorId,
      displayName: account.displayName,
      contactEmail: account.contactEmail,
      contactPhone: account.contactPhone,
      lastError: account.lastError,
    };
  }
}
