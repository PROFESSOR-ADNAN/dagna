import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Contest, Registration } from '../models/Contest.js';
import { Clarification } from '../models/Clarification.js';
import { StandingsService } from '../services/standings.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ContestCreateSchema } from '@dagna/shared';
import { JudgeJob } from '../models/JudgeJob.js';
import { Submission } from '../models/Submission.js';

export class ContestController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ContestCreateSchema.parse(req.body);

      const problems = validated.problemIds.map((pId, idx) => ({
        problemId: new mongoose.Types.ObjectId(pId),
        label: String.fromCharCode(65 + idx), // 'A', 'B', 'C'...
        points: 100,
      }));

      const contest = await Contest.create({
        ...validated,
        problems,
        createdById: req.userId,
      });

      res.status(201).json({ success: true, contest });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contests = await Contest.find({ visibility: { $ne: 'unlisted' } })
        .populate('createdById', 'handle displayName')
        .sort({ startAt: -1 })
        .limit(50);

      res.status(200).json({ success: true, contests });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const contest = await Contest.findById(id).populate('problems.problemId', 'title slug difficulty');

      if (!contest) {
        throw new AppError('Contest not found', 404);
      }

      // Check group privacy
      if (contest.visibility === 'group') {
        // Must be a member of the group
      }

      res.status(200).json({ success: true, contest });
    } catch (err) {
      next(err);
    }
  }

  static async register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const contest = await Contest.findById(id);

      if (!contest) {
        throw new AppError('Contest not found', 404);
      }

      if (contest.state === 'ended' || contest.state === 'finalized') {
        throw new AppError('Registration closed: contest has already ended', 400);
      }

      const existing = await Registration.findOne({ contestId: contest._id, userId: req.userId });
      if (existing) {
        res.status(200).json({ success: true, message: 'Already registered', registration: existing });
        return;
      }

      const registration = await Registration.create({
        contestId: contest._id,
        userId: req.userId,
      });

      contest.participantCount += 1;
      await contest.save();

      res.status(201).json({ success: true, message: 'Successfully registered', registration });
    } catch (err) {
      next(err);
    }
  }

  static async getStandings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const isPrivileged = req.userRole === 'admin' || req.userRole === 'organizer';
      const standings = await StandingsService.getStandings(id, req.userId, isPrivileged);

      res.status(200).json({ success: true, standings });
    } catch (err) {
      next(err);
    }
  }

  static async rejudgeContest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const contest = await Contest.findById(id);
      if (!contest) {
        throw new AppError('Contest not found', 404);
      }

      const submissions = await Submission.find({ contestId: contest._id });

      // Create priority rejudge jobs for all contest submissions
      const jobs = submissions.map((s) => ({
        type: 'rejudge',
        refId: s._id,
        priority: 0, // High priority rejudge during contest
        state: 'queued',
        readyAt: new Date(),
      }));

      if (jobs.length > 0) {
        await JudgeJob.insertMany(jobs);
      }

      res.status(200).json({
        success: true,
        message: `Dispatched ${jobs.length} rejudge jobs for contest ${contest.title}`,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createClarification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { question, problemLabel } = req.body;

      if (!question || question.trim().length === 0) {
        throw new AppError('Question text cannot be empty', 400);
      }

      const clar = await Clarification.create({
        contestId: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(req.userId!),
        problemLabel,
        question: question.trim(),
        isPublic: false,
      });

      res.status(201).json({ success: true, clarification: clar });
    } catch (err) {
      next(err);
    }
  }

  static async getClarifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const isPrivileged = req.userRole === 'admin' || req.userRole === 'organizer';

      const query = isPrivileged
        ? { contestId: id }
        : { contestId: id, $or: [{ isPublic: true }, { userId: req.userId }] };

      const clarifications = await Clarification.find(query)
        .populate('userId', 'handle displayName')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, clarifications });
    } catch (err) {
      next(err);
    }
  }
}
