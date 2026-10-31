import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(requireAuth);

const submissionRateLimiter = createRateLimiter({
  windowMs: 5000, // 5 seconds
  maxRequests: 1, // 1 per 5 seconds
  keyPrefix: 'submission_burst',
});

router.post('/', submissionRateLimiter, SubmissionController.create);
router.get('/mine', SubmissionController.listMine);
router.get('/:id', SubmissionController.getById);

export const submissionRouter = router;
