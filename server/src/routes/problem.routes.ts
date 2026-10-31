import { Router } from 'express';
import { ProblemController } from '../controllers/problem.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '@dagna/shared';

const router = Router();

// Public archive browsing
router.get('/', ProblemController.list);
router.get('/:slug', ProblemController.getBySlug);

// Problem Setter routes
router.post('/', requireAuth, requireRole(ROLES.SETTER, ROLES.ADMIN), ProblemController.create);

export const problemRouter = router;
