import crypto from 'crypto';
import { env } from '../config/env.js';
import { Payment, IPayment, PaymentPurpose } from '../models/Payment.js';
import { AppError } from '../middleware/errorHandler.js';

const CHAPA_API_URL = 'https://api.chapa.co/v1';

export interface InitializePaymentParams {
  userId: string;
  email: string;
  amount: number;
  currency?: string;
  firstName?: string;
  lastName?: string;
  title: string;
  description?: string;
  purpose?: PaymentPurpose;
  contestId?: string;
  callbackUrl?: string;
  returnUrl?: string;
}

export class ChapaService {
  public static isConfigured(): boolean {
    return Boolean(env.CHAPA_SECRET_KEY && env.CHAPA_SECRET_KEY.trim().length > 0);
  }

  public static async initializePayment(params: InitializePaymentParams): Promise<{ checkoutUrl: string; txRef: string; payment: IPayment }> {
    if (!this.isConfigured()) {
      throw new AppError('Chapa payment integration is not configured on this server', 503);
    }

    const txRef = `DAGNA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const currency = (params.currency || 'ETB').toUpperCase();

    const bodyPayload: Record<string, any> = {
      amount: params.amount.toString(),
      currency,
      email: params.email,
      tx_ref: txRef,
      customization: {
        title: params.title,
        description: params.description || `Payment for ${params.title}`,
      },
    };

    if (params.firstName) bodyPayload.first_name = params.firstName;
    if (params.lastName) bodyPayload.last_name = params.lastName;
    if (params.callbackUrl) bodyPayload.callback_url = params.callbackUrl;
    if (params.returnUrl) bodyPayload.return_url = params.returnUrl;

    const response = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok || data.status !== 'success' || !data.data?.checkout_url) {
      const errDetail = data.message || `Chapa initialization failed with HTTP ${response.status}`;
      throw new AppError(`Payment initialization failed: ${errDetail}`, 502);
    }

    const checkoutUrl = data.data.checkout_url;

    const payment = await Payment.create({
      txRef,
      userId: params.userId,
      amount: params.amount,
      currency,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      title: params.title,
      description: params.description,
      purpose: params.purpose || 'contest_fee',
      contestId: params.contestId || undefined,
      status: 'pending',
      chapaCheckoutUrl: checkoutUrl,
    });

    return { checkoutUrl, txRef, payment };
  }

  public static async verifyPayment(txRef: string): Promise<IPayment> {
    if (!this.isConfigured()) {
      throw new AppError('Chapa payment integration is not configured on this server', 503);
    }

    const payment = await Payment.findOne({ txRef });
    if (!payment) {
      throw new AppError('Payment transaction not found', 404);
    }

    if (payment.status === 'success') {
      return payment;
    }

    const response = await fetch(`${CHAPA_API_URL}/transaction/verify/${encodeURIComponent(txRef)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
      },
    });

    const data: any = await response.json().catch(() => ({}));

    if (response.ok && data.status === 'success') {
      payment.status = 'success';
      payment.chapaReference = data.data?.reference || txRef;
      payment.paymentMethod = data.data?.method || 'chapa';
      await payment.save();
    } else {
      if (data.status === 'failed') {
        payment.status = 'failed';
        await payment.save();
      }
    }

    return payment;
  }

  public static verifyWebhookSignature(signature: string | undefined, rawPayload: string): boolean {
    if (!env.CHAPA_WEBHOOK_SECRET) {
      return true; // If no secret configured, bypass HMAC check in non-strict mode
    }
    if (!signature) {
      return false;
    }

    const expectedHash = crypto
      .createHmac('sha256', env.CHAPA_WEBHOOK_SECRET)
      .update(rawPayload)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHash));
  }
}
