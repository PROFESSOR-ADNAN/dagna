import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const paymentRouter = Router();

// Public check for payment enablement & Chapa public key
paymentRouter.get('/status', PaymentController.getStatus);

// Initialize a payment session (requires login)
paymentRouter.post('/initialize', requireAuth, PaymentController.initialize);

// Verify a transaction by tx_ref
paymentRouter.get('/verify/:txRef', PaymentController.verify);

// Chapa Webhook callback
paymentRouter.post('/webhook', PaymentController.webhook);
