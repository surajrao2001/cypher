import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { WorkerEnv } from './config/env';
import type { PaymentSplitJobPayload } from './jobs/payloads';

@Injectable()
export class PaymentSplitService {
  constructor(private readonly config: ConfigService<WorkerEnv, true>) {}

  async splitAfterPayment(payload: PaymentSplitJobPayload): Promise<void> {
    const appId = this.config.get('CASHFREE_APP_ID', { infer: true });
    const secret = this.config.get('CASHFREE_SECRET_KEY', { infer: true });
    if (!appId || !secret) {
      throw new Error('Cashfree is not configured on the worker');
    }

    const base =
      this.config.get('CASHFREE_ENV', { infer: true }) === 'production'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';
    const apiVersion = this.config.get('CASHFREE_API_VERSION', { infer: true }) ?? '2025-01-01';

    const response = await fetch(
      `${base}/easy-split/orders/${encodeURIComponent(payload.orderId)}/split`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': appId,
          'x-client-secret': secret,
          'x-api-version': apiVersion,
        },
        body: JSON.stringify({
          split: [{ vendor_id: payload.vendorId, amount: payload.amountMajor }],
          disable_split: true,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Cashfree split failed (${String(response.status)}): ${text.slice(0, 400)}`);
    }
  }
}
