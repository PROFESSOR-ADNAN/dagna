import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '@dagna/shared';

const router = Router();

// Strict admin role guard
router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get('/nodes', AdminController.listNodes);
router.post('/nodes/:nodeId/state', AdminController.setNodeState);
router.get('/queue', AdminController.getQueueStatus);
router.post('/ratings/recompute', AdminController.triggerRatingRecompute);
router.get('/audit-logs', AdminController.getAuditLogs);

export const adminRouter = router;
