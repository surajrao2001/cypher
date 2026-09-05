import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrganizerMemberRole } from '@prisma/client';
import type { FastifyRequest } from 'fastify';

import type { AuthPrincipal } from '../../common/auth/auth.types';
import { Public } from '../../common/auth/public.decorator';
import { getAuthUserId } from '../../common/guards/supabase-jwt.guard';
import { PrismaService } from '../../common/prisma.service';
import { CreateCheckoutDto, StartPayoutSetupDto } from './payments.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller()
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('organizers/:organizerId/payment-account')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Cashfree payout account status for an organizer' })
  async getPaymentAccount(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId', ParseUUIDPipe) organizerId: string,
  ) {
    await this.requireMembership(getAuthUserId(request), organizerId);
    return this.payments.getOrganizerPaymentAccount(organizerId);
  }

  @Post('organizers/:organizerId/payment-account/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start Cashfree Easy Split vendor setup for paid events' })
  async setupPaymentAccount(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId', ParseUUIDPipe) organizerId: string,
    @Body() body: StartPayoutSetupDto,
  ) {
    await this.requireMembership(getAuthUserId(request), organizerId, [
      OrganizerMemberRole.owner,
    ]);
    return this.payments.startOrganizerPayoutSetup(organizerId, body);
  }

  @Post('registrations/:id/checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Cashfree checkout session for a paid hold' })
  checkout(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateCheckoutDto,
  ) {
    return this.payments.createCheckoutSession(getAuthUserId(request), id, body.customerPhone);
  }

  @Public()
  @Post('payments/webhooks/cashfree')
  @ApiOperation({ summary: 'Cashfree Payment Gateway webhooks' })
  async cashfreeWebhook(
    @Req() request: FastifyRequest,
    @Headers('x-webhook-timestamp') timestamp?: string,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    // Always ack dashboard connectivity tests with 200. Cashfree only checks HTTP 200.
    // Real payment events are processed best-effort; failures are logged, not returned as 4xx,
    // so Test / retries don't get stuck on sample payloads.
    try {
      const rawBody = readRawBody(request);
      if (!timestamp || !signature || isCashfreeConnectivityProbe(request.body, rawBody)) {
        return { ok: true, received: true };
      }
      return await this.payments.handleCashfreeWebhook(rawBody, timestamp, signature);
    } catch {
      return { ok: true, received: true, ignored: true };
    }
  }

  private async requireMembership(
    userId: string,
    organizerId: string,
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
}

function readRawBody(request: FastifyRequest): string {
  const existing = (request as FastifyRequest & { rawBody?: string | Buffer }).rawBody;
  if (typeof existing === 'string') {
    return existing;
  }
  if (Buffer.isBuffer(existing)) {
    return existing.toString('utf8');
  }
  return typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {});
}

function isCashfreeConnectivityProbe(body: unknown, rawBody: string): boolean {
  if (!rawBody || rawBody === '{}' || rawBody === 'null') {
    return true;
  }
  if (!body || typeof body !== 'object') {
    return true;
  }
  const record = body as Record<string, unknown>;
  if (typeof record.raw === 'string') {
    return true;
  }
  const type = typeof record.type === 'string' ? record.type.toUpperCase() : '';
  if (type.includes('TEST') || type.includes('PING') || type.includes('HEALTH')) {
    return true;
  }
  if (record.data == null) {
    return true;
  }
  return false;
}
