import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { Submission } from '../models/Submission.js';
import { RatingChange } from '../models/Rating.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { handle } = req.params;
      const user = await User.findOne({ handle: handle.toLowerCase() });

      if (!user) {
        throw new AppError('User profile not found', 404);
      }

      // Fetch rating history graph points
      const ratingHistory = await RatingChange.find({ userId: user._id })
        .populate('contestId', 'title endAt')
        .sort({ createdAt: 1 });

      // Fetch recent submissions
      const recentSubmissions = await Submission.find({ userId: user._id })
        .populate('problemId', 'title slug')
        .sort({ receivedAt: -1 })
        .limit(10);

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          handle: user.handle,
          displayName: user.displayName,
          rating: user.rating,
          solvedCount: user.solvedCount,
          submissionCount: user.submissionCount,
          createdAt: user.createdAt,
          ratingHistory: ratingHistory.map((rh) => ({
            contestTitle: (rh.contestId as any)?.title || 'Contest',
            newRating: rh.newRating,
            delta: rh.delta,
            rank: rh.rank,
            date: rh.createdAt,
          })),
          recentSubmissions,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cursor, limit = 50 } = req.query;
      const pageSize = Math.min(Number(limit), 100);

      const query: Record<string, unknown> = {};
      if (cursor) {
        query._id = { $gt: cursor };
      }

      const users = await User.find(query)
        .sort({ rating: -1, solvedCount: -1, _id: 1 })
        .limit(pageSize + 1);

      const hasMore = users.length > pageSize;
      const results = hasMore ? users.slice(0, pageSize) : users;
      const nextCursor = hasMore ? results[results.length - 1]._id : null;

      res.status(200).json({
        success: true,
        leaderboard: results.map((u, idx) => ({
          rank: idx + 1,
          handle: u.handle,
          displayName: u.displayName,
          rating: u.rating,
          solvedCount: u.solvedCount,
        })),
        nextCursor,
      });
    } catch (err) {
      next(err);
    }
  }

  static async exportData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.userId);
      if (!user) throw new AppError('User not found', 404);

      const submissions = await Submission.find({ userId: user._id });
      const ratingHistory = await RatingChange.find({ userId: user._id });

      res.status(200).json({
        exportDate: new Date(),
        profile: {
          handle: user.handle,
          email: user.email,
          displayName: user.displayName,
          rating: user.rating,
        },
        submissions,
        ratingHistory,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.userId);
      if (!user) throw new AppError('User not found', 404);

      // Anonymize user record so standings row persists as "deleted user" without shifting ranks
      user.displayName = 'Deleted User';
      user.email = `deleted_${user._id}@dagna.internal`;
      user.handle = `deleted_${user._id}`;
      user.passwordHash = 'DELETED';
      user.isEmailVerified = false;
      await user.save();

      // Delete raw source code submissions
      await Submission.deleteMany({ userId: user._id });

      res.status(200).json({ success: true, message: 'Account successfully deleted and personal data scrubbed.' });
    } catch (err) {
      next(err);
    }
  }
}
