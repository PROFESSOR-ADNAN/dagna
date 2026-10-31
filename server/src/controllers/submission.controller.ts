import { Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Submission } from '../models/Submission.js';
import { Problem } from '../models/Problem.js';
import { JudgeJob } from '../models/JudgeJob.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { SubmissionCreateSchema, SUBMISSION_STATES } from '@dagna/shared';

export class SubmissionController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const validated = SubmissionCreateSchema.parse(req.body);
      const userId = req.userId!;

      // 1. Idempotency Check: if clientSubmissionId already exists for this user, return existing record
      const existing = await Submission.findOne({
        userId,
        clientSubmissionId: validated.clientSubmissionId,
      }).session(session);

      if (existing) {
        await session.commitTransaction();
        res.status(200).json({ success: true, submission: existing, isRetry: true });
        return;
      }

      // 2. Problem existence & visibility check
      const problem = await Problem.findById(validated.problemId).session(session);
      if (!problem) {
        throw new AppError('Problem does not exist', 404);
      }

      if (problem.visibility === 'draft' && req.userRole !== 'setter' && req.userRole !== 'admin') {
        throw new AppError('Problem is not publicly visible', 403);
      }

      if (!problem.currentVersionId) {
        throw new AppError('Problem has no published version available for judging', 400);
      }

      // 3. Duplicate Submission Rule: reject identical source hash within 120 seconds
      const sourceHash = crypto.createHash('sha256').update(validated.source).digest('hex');
      const twoMinutesAgo = new Date(Date.now() - 120 * 1000);

      const recentDuplicate = await Submission.findOne({
        userId,
        problemId: problem._id,
        sourceHash,
        receivedAt: { $gte: twoMinutesAgo },
      }).session(session);

      if (recentDuplicate) {
        throw new AppError('Duplicate submission: identical code submitted within the last 2 minutes', 400);
      }

      // 4. Create Submission with Server Time
      const serverReceiptTime = new Date();
      const priority = validated.contestId ? 0 : 1; // 0 for contest, 1 for practice

      const submission = new Submission({
        userId,
        problemId: problem._id,
        problemVersionId: problem.currentVersionId,
        contestId: validated.contestId,
        language: validated.language,
        source: validated.source,
        sourceHash,
        clientSubmissionId: validated.clientSubmissionId,
        receivedAt: serverReceiptTime,
        state: SUBMISSION_STATES.QUEUED,
        score: 0,
        timeMs: 0,
        memoryKB: 0,
      });
      await submission.save({ session });

      // 5. Create Durable Judge Job
      const job = new JudgeJob({
        type: 'submission',
        refId: submission._id,
        priority,
        state: 'queued',
        readyAt: serverReceiptTime,
      });
      await job.save({ session });

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        submission: {
          id: submission._id,
          problemId: submission.problemId,
          language: submission.language,
          state: submission.state,
          receivedAt: submission.receivedAt,
        },
      });
    } catch (err: any) {
      await session.abortTransaction();
      // Handle MongoDB E11000 duplicate key race gracefully
      if (err.code === 11000 && err.keyPattern?.clientSubmissionId) {
        const sub = await Submission.findOne({
          userId: req.userId,
          clientSubmissionId: req.body.clientSubmissionId,
        });
        res.status(200).json({ success: true, submission: sub, isRetry: true });
        return;
      }
      next(err);
    } finally {
      session.endSession();
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const submission = await Submission.findById(id)
        .populate('problemId', 'title slug difficulty')
        .populate('userId', 'handle displayName');

      if (!submission) {
        throw new AppError('Submission not found', 404);
      }

      // Information control: participants only see full test breakdowns on their own submissions or practice
      const isOwner = req.userId && submission.userId._id.toString() === req.userId;
      const isPrivileged = req.userRole === 'admin' || req.userRole === 'setter';

      res.status(200).json({
        success: true,
        submission: {
          ...submission.toObject(),
          source: isOwner || isPrivileged ? submission.source : undefined,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async listMine(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const submissions = await Submission.find({ userId: req.userId })
        .populate('problemId', 'title slug')
        .sort({ receivedAt: -1 })
        .limit(50);

      res.status(200).json({ success: true, submissions });
    } catch (err) {
      next(err);
    }
  }
}
