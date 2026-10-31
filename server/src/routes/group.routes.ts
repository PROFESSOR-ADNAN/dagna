import { Router } from 'express';
import { GroupController } from '../controllers/group.controller.js';
import { requireAuth, requireGroupRole } from '../middleware/auth.js';
import { GROUP_ROLES } from '@dagna/shared';

const router = Router();

router.use(requireAuth);

router.post('/', GroupController.create);
router.get('/', GroupController.list);
router.get('/:id', GroupController.getById);
router.post('/join', GroupController.join);
router.get('/:id/members', GroupController.getMembers);
router.post('/:id/invites', requireGroupRole(GROUP_ROLES.OWNER, GROUP_ROLES.COORDINATOR), GroupController.createInvite);

export const groupRouter = router;
