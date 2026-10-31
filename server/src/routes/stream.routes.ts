import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { sseManager } from '../services/sse.service.js';

const router = Router();

router.get('/stream', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Critical for Nginx unbuffered streaming
  });

  res.write(': heartbeat\n\n');

  if (req.userId) {
    sseManager.addClient(req.userId, res);
  }

  // Periodic keepalive every 15s to prevent intermediate proxy timeout
  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAliveInterval);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
  });
});

export const streamRouter = router;
