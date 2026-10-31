import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public user profiles & global leaderboard
router.get('/leaderboard', UserController.getLeaderboard);
router.get('/:handle', UserController.getProfile);

// Authenticated user export & delete
router.get('/account/export', requireAuth, UserController.exportData);
router.delete('/account', requireAuth, UserController.deleteAccount);

export const userRouter = router;
