import { Router } from 'express';
import { JudgeGatewayController } from '../controllers/judge.controller.js';

const router = Router();

// Private Judge Gateway routes authenticated via Judge Node Token
router.use(JudgeGatewayController.verifyJudgeToken);

router.post('/jobs/claim', JudgeGatewayController.claimJob);
router.post('/jobs/:jobId/heartbeat', JudgeGatewayController.heartbeat);
router.post('/jobs/:jobId/complete', JudgeGatewayController.completeJob);

export const judgeRouter = router;
