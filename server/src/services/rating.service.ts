import mongoose from 'mongoose';
import { Contest } from '../models/Contest.js';
import { Standing } from '../models/Standing.js';
import { User } from '../models/User.js';
import { RatingChange, RatingRun } from '../models/Rating.js';
import { computeContestRatings, RatedParticipant } from '@dagna/shared';
import { AppError } from '../middleware/errorHandler.js';

export class RatingService {
  /**
   * Calculates and applies ratings for a finalized contest
   */
  static async applyContestRatings(contestId: string): Promise<number> {
    const contest = await Contest.findById(contestId);
    if (!contest) {
      throw new AppError('Contest not found', 404);
    }

    if (!contest.rated) {
      return 0; // Not a rated contest
    }

    const runId = `run-${Date.now()}-${contestId}`;

    // Get finalized standings
    const standings = await Standing.find({ contestId })
      .populate('userId', 'rating')
      .sort({ rank: 1 });

    // Filter to active participants who made at least 1 attempt
    const ratedParticipants: RatedParticipant[] = [];

    for (const s of standings) {
      const u = s.userId as any;
      if (u && (s.totalSolved > 0 || s.totalPenalty > 0 || s.totalPoints > 0)) {
        ratedParticipants.push({
          userId: u._id.toString(),
          rating: u.rating || 1400,
          rank: s.rank,
        });
      }
    }

    if (ratedParticipants.length === 0) {
      return 0;
    }

    // Pure deterministic Codeforces Elo computation
    const ratingChanges = computeContestRatings(ratedParticipants);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Record Rating Changes
      const changeDocs = ratingChanges.map((rc) => ({
        contestId: contest._id,
        userId: new mongoose.Types.ObjectId(rc.userId),
        runId,
        oldRating: rc.oldRating,
        newRating: rc.newRating,
        delta: rc.delta,
        rank: rc.rank,
        seed: rc.seed,
      }));

      await RatingChange.insertMany(changeDocs, { session });

      // 2. Update denormalized User rating
      for (const rc of ratingChanges) {
        await User.findByIdAndUpdate(
          rc.userId,
          { $set: { rating: rc.newRating } },
          { session }
        );
      }

      // 3. Record Rating Run Audit
      const avgRating = Math.round(
        ratingChanges.reduce((acc, r) => acc + r.newRating, 0) / ratingChanges.length
      );

      await RatingRun.create(
        [
          {
            contestId: contest._id,
            runId,
            participantCount: ratingChanges.length,
            averageRating: avgRating,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return ratingChanges.length;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Deterministic full recompute of all historical ratings from scratch
   */
  static async recomputeAllRatings(): Promise<void> {
    const ratedContests = await Contest.find({ rated: true, state: 'finalized' }).sort({ endAt: 1 });

    // Reset all users to baseline 1400 rating
    await User.updateMany({}, { $set: { rating: 1400 } });
    await RatingChange.deleteMany({});
    await RatingRun.deleteMany({});

    for (const contest of ratedContests) {
      await this.applyContestRatings(contest._id.toString());
    }
  }
}
