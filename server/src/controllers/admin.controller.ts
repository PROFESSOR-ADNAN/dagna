import { Response, NextFunction } from 'express';
import { JudgeNode } from '../models/JudgeNode.js';
import { JudgeJob } from '../models/JudgeJob.js';
import { AuditLog } from '../models/AuditLog.js';
import { RatingService } from '../services/rating.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export class AdminController {
  static async listNodes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const nodes = await JudgeNode.find().sort({ lastHeartbeat: -1 });
      res.status(200).json({ success: true, nodes });
    } catch (err) {
      next(err);
    }
  }

  static async setNodeState(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nodeId } = req.params;
      const { state } = req.body; // 'active' | 'draining' | 'quarantined' | 'revoked'

      if (!['active', 'draining', 'quarantined', 'revoked'].includes(state)) {
        throw new AppError('Invalid judge node state', 400);
      }

      const node = await JudgeNode.findOneAndUpdate(
        { nodeId },
        { $set: { state } },
        { new: true, upsert: true }
      );

      await AuditLog.create({
        action: 'judge.state_changed',
        actorId: req.userId,
        actorRole: req.userRole,
        resourceType: 'JudgeNode',
        resourceId: nodeId,
        details: { newState: state },
      });

      res.status(200).json({ success: true, node });
    } catch (err) {
      next(err);
    }
  }

  static async getQueueStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const queuedCount = await JudgeJob.countDocuments({ state: 'queued' });
      const leasedCount = await JudgeJob.countDocuments({ state: 'leased' });

      res.status(200).json({
        success: true,
        queue: {
          queuedCount,
          leasedCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async triggerRatingRecompute(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await RatingService.recomputeAllRatings();

      await AuditLog.create({
        action: 'ratings.recomputed_all',
        actorId: req.userId,
        actorRole: req.userRole,
        resourceType: 'Rating',
      });

      res.status(200).json({ success: true, message: 'All historical ratings recalculated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await AuditLog.find()
        .populate('actorId', 'handle displayName')
        .sort({ createdAt: -1 })
        .limit(100);

      res.status(200).json({ success: true, logs });
    } catch (err) {
      next(err);
    }
  }
}
