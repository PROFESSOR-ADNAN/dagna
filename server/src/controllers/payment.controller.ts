import { Request, Response, NextFunction } from 'express';
import { ChapaService } from '../services/chapa.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { env } from '../config/env.js';

export class PaymentController {
  static async getStatus(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      enabled: ChapaService.isConfigured(),
      publicKey: env.CHAPA_PUBLIC_KEY || null,
      currency: 'ETB',
    });
  }

  static async initialize(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, title, description, purpose, contestId, callbackUrl, returnUrl } = req.body;
      const user = req.user!;

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ success: false, message: 'Valid positive amount in ETB is required' });
        return;
      }

      const result = await ChapaService.initializePayment({
        userId: user._id.toString(),
        email: user.email,
        amount,
        firstName: user.displayName || user.handle,
        title: title || 'Dagna Contest Registration',
        description,
        purpose,
        contestId,
        callbackUrl,
        returnUrl,
      });

      res.status(201).json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          checkoutUrl: result.checkoutUrl,
          txRef: result.txRef,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { txRef } = req.params;
      if (!txRef) {
        res.status(400).json({ success: false, message: 'Transaction reference is required' });
        return;
      }

      const payment = await ChapaService.verifyPayment(txRef);

      res.status(200).json({
        success: true,
        payment: {
          txRef: payment.txRef,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          purpose: payment.purpose,
          paymentMethod: payment.paymentMethod,
          updatedAt: payment.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = (req.headers['x-chapa-signature'] || req.headers['chapa-signature']) as string | undefined;
      const rawPayload = (req as any).rawBody || JSON.stringify(req.body);

      if ((env.CHAPA_WEBHOOK_SECRET || env.CHAPA_SECRET_KEY) && !ChapaService.verifyWebhookSignature(signature, rawPayload)) {
        res.status(401).json({ success: false, message: 'Invalid webhook signature' });
        return;
      }

      const txRef = req.body?.tx_ref || req.body?.reference || req.body?.trx_ref;
      if (txRef) {
        await ChapaService.verifyPayment(txRef);
      }

      res.status(200).json({ success: true, message: 'Webhook received and processed' });
    } catch (err) {
      next(err);
    }
  }
}
