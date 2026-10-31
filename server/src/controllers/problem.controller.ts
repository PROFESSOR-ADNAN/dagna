import { Request, Response, NextFunction } from 'express';
import { Problem } from '../models/Problem.js';
import { ProblemVersion } from '../models/ProblemVersion.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ProblemCreateSchema } from '@dagna/shared';

export class ProblemController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tag, difficulty, search, cursor, limit = 20 } = req.query;

      const query: Record<string, unknown> = {
        visibility: 'public',
      };

      if (tag) {
        query.tags = tag;
      }

      if (difficulty) {
        query.difficulty = Number(difficulty);
      }

      if (search) {
        query.title = { $regex: String(search), $options: 'i' };
      }

      if (cursor) {
        query._id = { $gt: cursor };
      }

      const pageSize = Math.min(Number(limit), 100);
      const problems = await Problem.find(query)
        .populate('authorId', 'handle displayName')
        .sort({ _id: 1 })
        .limit(pageSize + 1);

      const hasMore = problems.length > pageSize;
      const results = hasMore ? problems.slice(0, pageSize) : problems;
      const nextCursor = hasMore ? results[results.length - 1]._id : null;

      res.status(200).json({
        success: true,
        problems: results,
        nextCursor,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const problem = await Problem.findOne({ slug }).populate('authorId', 'handle displayName');

      if (!problem) {
        throw new AppError('Problem not found', 404);
      }

      let version = null;
      if (problem.currentVersionId) {
        version = await ProblemVersion.findById(problem.currentVersionId);
      }

      // Security check: NEVER return tests array or hidden input/answer hashes to browser!
      res.status(200).json({
        success: true,
        problem: {
          id: problem._id,
          slug: problem.slug,
          title: problem.title,
          tags: problem.tags,
          difficulty: problem.difficulty,
          author: problem.authorId,
          source: problem.source,
          license: problem.license,
          statements: version?.statements || {},
          samples: version?.samples || [],
          limits: version?.limits || { cpuTimeMs: 1000, memoryLimitMB: 256 },
          scoringMode: version?.scoring?.mode || 'icpc',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ProblemCreateSchema.parse(req.body);

      const problem = await Problem.create({
        ...validated,
        authorId: req.userId,
      });

      res.status(201).json({ success: true, problem });
    } catch (err) {
      next(err);
    }
  }
}
