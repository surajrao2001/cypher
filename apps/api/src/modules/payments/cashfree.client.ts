import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.validation';
import { writeLog } from '../../common/logger';

export type CashfreeCreateOrderInput = {
  orderId: string;
  amountMajor: number;
  currency: string;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  customerName?: string;
  returnUrl: string;
  notifyUrl: string;
  orderNote?: string;
};

export type CashfreeCreateOrderResult = {
  orderId: string;
  cfOrderId: string;
  paymentSessionId: string;
  orderStatus: string;
};

export type CashfreeCreateVendorInput = {
  vendorId: string;
  name: string;
  email: string;
  phone: string;
};

export type CashfreeCreateVendorResult = {
  vendorId: string;
  status: string;
};

@Injectable()
export class CashfreeClient {
  constructor(private readonly config: ConfigService<Env, true>) {}

  isConfigured(): boolean {
    return Boolean(this.appId() && this.secretKey());
  }

  baseUrl(): string {
    return this.config.get('CASHFREE_ENV', { infer: true }) === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  /**
   * Verifies Cashfree PG webhook signature header `x-webhook-signature`
   * using timestamp `x-webhook-timestamp` and raw body.
   * @see https://www.cashfree.com/docs/payments/online/webhooks/signature-verification
   */
  verifyWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
    // Cashfree docs: HMAC uses the PG client secret (same as x-client-secret).
    // CASHFREE_WEBHOOK_SECRET is optional override if you rotate a dedicated webhook key later.
    const secret =
      this.config.get('CASHFREE_WEBHOOK_SECRET', { infer: true }) ??
      this.config.get('CASHFREE_SECRET_KEY', { infer: true });
    if (!secret || !timestamp || !signature) {
      return false;
    }
    const signedPayload = `${timestamp}${rawBody}`;
    const expected = createHmac('sha256', secret).update(signedPayload).digest('base64');
    try {
      const a = Buffer.from(expected);
      const b = Buffer.from(signature);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  async createOrder(input: CashfreeCreateOrderInput): Promise<CashfreeCreateOrderResult> {
    const body = {
      order_id: input.orderId,
      order_amount: input.amountMajor,
      order_currency: input.currency,
      customer_details: {
        customer_id: input.customerId,
        customer_phone: input.customerPhone,
        ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
        ...(input.customerName ? { customer_name: input.customerName } : {}),
      },
      order_meta: {
        return_url: input.returnUrl,
        notify_url: input.notifyUrl,
      },
      ...(input.orderNote ? { order_note: input.orderNote } : {}),
    };

    const data = await this.request<Record<string, unknown>>('POST', '/orders', body);
    const orderId = String(data.order_id ?? input.orderId);
    const cfOrderId = String(data.cf_order_id ?? '');
    const paymentSessionId = String(data.payment_session_id ?? '');
    if (!paymentSessionId) {
      throw new BadGatewayException('Cashfree did not return payment_session_id');
    }
    return {
      orderId,
      cfOrderId,
      paymentSessionId,
      orderStatus: String(data.order_status ?? 'ACTIVE'),
    };
  }

  async createVendor(input: CashfreeCreateVendorInput): Promise<CashfreeCreateVendorResult> {
    const body = {
      vendor_id: input.vendorId,
      status: 'ACTIVE',
      name: input.name,
      email: input.email,
      phone: input.phone,
      verify_account: false,
    };
    const data = await this.request<Record<string, unknown>>('POST', '/easy-split/vendors', body);
    return {
      vendorId: String(data.vendor_id ?? input.vendorId),
      status: String(data.status ?? 'ACTIVE'),
    };
  }

  async splitAfterPayment(orderId: string, vendorId: string, amountMajor: number): Promise<void> {
    await this.request('POST', `/easy-split/orders/${encodeURIComponent(orderId)}/split`, {
      split: [{ vendor_id: vendorId, amount: amountMajor }],
      disable_split: true,
    });
  }

  private appId(): string | undefined {
    return this.config.get('CASHFREE_APP_ID', { infer: true });
  }

  private secretKey(): string | undefined {
    return this.config.get('CASHFREE_SECRET_KEY', { infer: true });
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const appId = this.appId();
    const secret = this.secretKey();
    if (!appId || !secret) {
      throw new ServiceUnavailableException(
        'Cashfree is not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.',
      );
    }

    const apiVersion = this.config.get('CASHFREE_API_VERSION', { infer: true }) ?? '2025-01-01';
    const url = `${this.baseUrl()}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secret,
        'x-api-version': apiVersion,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = { raw: text };
      }
    }

    if (!response.ok) {
      writeLog({
        level: 'error',
        message: 'Cashfree API error',
        method,
        path,
        status: response.status,
        body: parsed,
      });
      const message =
        typeof parsed === 'object' &&
        parsed &&
        'message' in parsed &&
        typeof (parsed as { message: unknown }).message === 'string'
          ? (parsed as { message: string }).message
          : `Cashfree request failed (${String(response.status)})`;
      throw new BadGatewayException(message);
    }

    return parsed as T;
  }
}
