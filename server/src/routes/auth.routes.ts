import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Strict rate limits on login/register to prevent brute force
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  keyPrefix: 'auth',
  failClosed: true,
});

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// Authenticated user self routes
router.get('/me', requireAuth, AuthController.me);
router.post('/mfa/setup', requireAuth, AuthController.setupMfa);
router.post('/mfa/verify', requireAuth, AuthController.verifyMfa);

export const authRouter = router;
