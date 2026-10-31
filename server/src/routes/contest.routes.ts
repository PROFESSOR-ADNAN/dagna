import { Router } from 'express';
import { ContestController } from '../controllers/contest.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '@dagna/shared';

const router = Router();

// Public contest browsing
router.get('/', ContestController.list);
router.get('/:id', ContestController.getById);
router.get('/:id/standings', ContestController.getStandings);

// Authenticated contestant interactions
router.post('/:id/register', requireAuth, ContestController.register);
router.get('/:id/clarifications', requireAuth, ContestController.getClarifications);
router.post('/:id/clarifications', requireAuth, ContestController.createClarification);

// Organizer & Admin controls
router.post('/', requireAuth, requireRole(ROLES.ORGANIZER, ROLES.ADMIN), ContestController.create);
router.post('/:id/rejudge', requireAuth, requireRole(ROLES.ORGANIZER, ROLES.ADMIN), ContestController.rejudgeContest);

export const contestRouter = router;
