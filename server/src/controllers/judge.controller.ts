import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { JudgeJob } from '../models/JudgeJob.js';
import { Submission } from '../models/Submission.js';
import { ProblemVersion } from '../models/ProblemVersion.js';
import { Judgment } from '../models/Judgment.js';
import { TestResult } from '../models/TestResult.js';
import { Outbox } from '../models/Outbox.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  JobClaimSchema,
  JobHeartbeatSchema,
  JobCompleteSchema,
  DEFAULT_LIMITS,
  SUBMISSION_STATES,
} from '@dagna/shared';
import { env } from '../config/env.js';
import { sseManager } from '../services/sse.service.js';

export class JudgeGatewayController {
  /**
   * Middleware to verify Judge Node authorization token
   */
  static verifyJudgeToken(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['x-judge-token'] || req.headers.authorization;
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token || token !== env.JUDGE_NODE_TOKEN) {
      next(new AppError('Unauthorized: invalid judge node credentials', 401));
      return;
    }
    next();
  }

  /**
   * Long-polling job claim endpoint (up to 25s timeout)
   */
  static async claimJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nodeId } = JobClaimSchema.parse(req.body);
      const pollStart = Date.now();
      const maxPollTimeMs = 24000; // 24 seconds

      while (Date.now() - pollStart < maxPollTimeMs) {
        // Atomic lease claim using findOneAndUpdate with generation increment
        const job = await JudgeJob.findOneAndUpdate(
          {
            state: 'queued',
            readyAt: { $lte: new Date() },
          },
          {
            $set: {
              state: 'leased',
              leaseOwner: nodeId,
              leaseExpiresAt: new Date(Date.now() + DEFAULT_LIMITS.LEASE_DURATION_SECONDS * 1000),
            },
            $inc: { generation: 1 },
          },
          {
            sort: { priority: 1, readyAt: 1 },
            new: true,
          }
        );

        if (job) {
          // Fetch submission details
          const submission = await Submission.findById(job.refId);
          if (!submission) {
            job.state = 'failed';
            await job.save();
            continue;
          }

          const problemVersion = await ProblemVersion.findById(submission.problemVersionId);

          res.status(200).json({
            success: true,
            job: {
              jobId: job._id,
              generation: job.generation,
              type: job.type,
              submissionId: submission._id,
              language: submission.language,
              source: submission.source,
              limits: problemVersion?.limits || {
                cpuTimeMs: 1000,
                memoryLimitMB: 256,
              },
              scoring: problemVersion?.scoring || { mode: 'icpc' },
              tests: problemVersion?.tests || [],
              checker: problemVersion?.checker || { type: 'tokens' },
            },
          });
          return;
        }

        // Sleep 1 second before re-checking queue
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // No jobs available within long-poll timeout
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }

  /**
   * Extends active lease; returns 409 Conflict if generation token is stale
   */
  static async heartbeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;
      const { generation } = JobHeartbeatSchema.parse(req.body);

      const job = await JudgeJob.findOne({ _id: jobId });
      if (!job) {
        throw new AppError('Job not found', 404);
      }

      // Fencing check: Monotonic generation verification
      if (job.generation !== generation) {
        res.status(409).json({
          success: false,
          message: `Fencing violation: active generation is ${job.generation}, but heartbeat provided stale generation ${generation}. Aborting job.`,
        });
        return;
      }

      job.leaseExpiresAt = new Date(Date.now() + DEFAULT_LIMITS.LEASE_DURATION_SECONDS * 1000);
      await job.save();

      res.status(200).json({ success: true, message: 'Lease extended' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Finalizes judging attempt in a single atomic MongoDB transaction
   */
  static async completeJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { jobId } = req.params;
      const data = JobCompleteSchema.parse(req.body);

      const job = await JudgeJob.findOne({ _id: jobId }).session(session);
      if (!job) {
        throw new AppError('Job not found', 404);
      }

      // Monotonic fencing token validation: Reject zombie or stale completions
      if (job.generation !== data.generation) {
        await session.abortTransaction();
        res.status(409).json({
          success: false,
          message: `Fencing conflict: job was re-leased with generation ${job.generation}. Your attempt ${data.generation} is obsolete.`,
        });
        return;
      }

      const submission = await Submission.findById(job.refId).session(session);
      if (!submission) {
        throw new AppError('Associated submission not found', 404);
      }

      // 1. Create Judgment Record
      const judgment = new Judgment({
        submissionId: submission._id,
        jobId: job._id,
        generation: data.generation,
        nodeId: data.nodeId,
        compile: {
          ok: data.verdict !== 'CE',
          output: data.compileOutput.slice(0, 4096),
        },
        verdict: data.verdict,
        score: data.score,
        maxTimeMs: data.timeMs,
        maxMemoryKB: data.memoryKB,
        failedTest: data.failedTest,
        isCurrent: true,
      });
      await judgment.save({ session });

      // 2. Insert Test Results
      if (data.testResults && data.testResults.length > 0) {
        const testDocs = data.testResults.map((t) => ({
          judgmentId: judgment._id,
          testIndex: t.testIndex,
          verdict: t.verdict,
          timeMs: t.timeMs,
          memoryKB: t.memoryKB,
          checkerMessage: t.checkerMessage.slice(0, 512),
        }));
        await TestResult.insertMany(testDocs, { session });
      }

      // 3. Update Submission State
      submission.state = SUBMISSION_STATES.JUDGED;
      submission.latestJudgmentId = judgment._id as any;
      submission.verdict = data.verdict;
      submission.score = data.score;
      submission.timeMs = data.timeMs;
      submission.memoryKB = data.memoryKB;
      submission.failedTest = data.failedTest;
      await submission.save({ session });

      // 4. Mark Job Done
      job.state = 'done';
      await job.save({ session });

      // 5. Append Outbox Event for Scoreboards and Ratings
      const eventId = `evt-${Date.now()}-${submission._id}`;
      await Outbox.create(
        [
          {
            eventId,
            eventType: 'judgment.final',
            payload: {
              submissionId: submission._id.toString(),
              judgmentId: judgment._id.toString(),
              contestId: submission.contestId?.toString(),
              userId: submission.userId.toString(),
              verdict: data.verdict,
              score: data.score,
            },
            relayed: false,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      // Emit live SSE update to submission owner
      sseManager.sendToUser(submission.userId.toString(), {
        type: 'submission.update',
        submissionId: submission._id,
        state: submission.state,
        verdict: submission.verdict,
        score: submission.score,
        timeMs: submission.timeMs,
        memoryKB: submission.memoryKB,
      });

      res.status(200).json({ success: true, message: 'Judgment committed successfully' });
    } catch (err) {
      await session.abortTransaction();
      next(err);
    } finally {
      session.endSession();
    }
  }
}
