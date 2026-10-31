import mongoose from 'mongoose';
import { Contest } from '../models/Contest.js';
import { Submission } from '../models/Submission.js';
import { Standing, IStanding, IStandingCell } from '../models/Standing.js';
import {
  calculateICPCRankKey,
  compareICPC,
  calculateOIRankKey,
  compareOI,
  VERDICTS,
} from '@dagna/shared';
import { getRedisClient } from '../config/redis.js';

export class StandingsService {
  /**
   * Recalculates standing cell and participant totals from source submissions
   */
  static async updateStanding(
    contestId: string,
    userId: string,
    problemId: string
  ): Promise<IStanding | null> {
    const contest = await Contest.findById(contestId);
    if (!contest) return null;

    // Find problem label in contest (e.g., 'A', 'B')
    const problemRef = contest.problems.find((p) => p.problemId.toString() === problemId);
    const label = problemRef?.label || 'A';

    // Fetch all submissions by this user for this problem in contest duration
    const submissions = await Submission.find({
      contestId,
      userId,
      problemId,
      receivedAt: { $gte: contest.startAt, $lte: contest.endAt },
      state: 'judged',
    }).sort({ receivedAt: 1 });

    let standing = await Standing.findOne({ contestId, userId });
    if (!standing) {
      standing = new Standing({
        contestId: new mongoose.Types.ObjectId(contestId),
        userId: new mongoose.Types.ObjectId(userId),
        cells: new Map<string, IStandingCell>(),
        totalSolved: 0,
        totalPenalty: 0,
        totalPoints: 0,
        lastAcceptedAtSeconds: 0,
        lastImprovementAtSeconds: 0,
        rankKey: '0',
        rank: 1,
      });
    }

    if (contest.mode === 'icpc') {
      let attempts = 0;
      let solved = false;
      let acceptedAtSeconds = 0;
      let penaltyMinutes = 0;

      for (const sub of submissions) {
        if (sub.verdict === VERDICTS.AC) {
          solved = true;
          acceptedAtSeconds = Math.max(0, Math.floor((sub.receivedAt.getTime() - contest.startAt.getTime()) / 1000));
          const elapsedMinutes = Math.floor(acceptedAtSeconds / 60);
          penaltyMinutes = elapsedMinutes + attempts * contest.penaltyMinutes;
          break; // ICPC stops after first AC
        } else if (
          sub.verdict === VERDICTS.WA ||
          sub.verdict === VERDICTS.TLE ||
          sub.verdict === VERDICTS.MLE ||
          sub.verdict === VERDICTS.RE ||
          sub.verdict === VERDICTS.OLE
        ) {
          attempts++;
        }
      }

      const cell: IStandingCell = {
        problemLabel: label,
        attempts,
        solved,
        acceptedAtSeconds: solved ? acceptedAtSeconds : undefined,
        penaltyMinutes: solved ? penaltyMinutes : 0,
        bestScore: solved ? 100 : 0,
        isPending: false,
      };

      standing.cells.set(label, cell);
    } else {
      // OI Mode
      let bestScore = 0;
      let lastImprovementSeconds = 0;

      for (const sub of submissions) {
        if (sub.score > bestScore) {
          bestScore = sub.score;
          lastImprovementSeconds = Math.max(0, Math.floor((sub.receivedAt.getTime() - contest.startAt.getTime()) / 1000));
        }
      }

      const cell: IStandingCell = {
        problemLabel: label,
        attempts: submissions.length,
        solved: bestScore === 100,
        bestScore,
        penaltyMinutes: 0,
        lastImprovementAtSeconds: lastImprovementSeconds,
        isPending: false,
      };

      standing.cells.set(label, cell);
    }

    // Recalculate participant aggregates
    let totalSolved = 0;
    let totalPenalty = 0;
    let totalPoints = 0;
    let maxAcceptedSeconds = 0;
    let maxImprovementSeconds = 0;

    for (const [, c] of standing.cells.entries()) {
      if (c.solved) {
        totalSolved++;
        totalPenalty += c.penaltyMinutes;
        maxAcceptedSeconds = Math.max(maxAcceptedSeconds, c.acceptedAtSeconds || 0);
      }
      totalPoints += c.bestScore;
      maxImprovementSeconds = Math.max(maxImprovementSeconds, c.lastImprovementAtSeconds || 0);
    }

    standing.totalSolved = totalSolved;
    standing.totalPenalty = totalPenalty;
    standing.totalPoints = totalPoints;
    standing.lastAcceptedAtSeconds = maxAcceptedSeconds;
    standing.lastImprovementAtSeconds = maxImprovementSeconds;

    if (contest.mode === 'icpc') {
      const key = calculateICPCRankKey({
        solvedCount: totalSolved,
        penaltyMinutes: totalPenalty,
        lastAcceptedAtSeconds: maxAcceptedSeconds,
      });
      standing.rankKey = key.toString();
    } else {
      const key = calculateOIRankKey({
        totalPoints,
        lastImprovementAtSeconds: maxImprovementSeconds,
      });
      standing.rankKey = key.toString();
    }

    await standing.save();

    // Re-rank contest standings and update Redis snapshot
    await this.recalculateRanksAndSnapshot(contestId);

    return standing;
  }

  /**
   * Assigns dense standard competition ranks (1, 2, 2, 4) and writes versioned Redis snapshot
   */
  static async recalculateRanksAndSnapshot(contestId: string): Promise<any[]> {
    const contest = await Contest.findById(contestId);
    if (!contest) return [];

    const standings = await Standing.find({ contestId }).populate('userId', 'handle displayName rating');

    // Sort using deterministic integer rank keys
    standings.sort((a, b) => {
      if (contest.mode === 'icpc') {
        return compareICPC(
          {
            solvedCount: a.totalSolved,
            penaltyMinutes: a.totalPenalty,
            lastAcceptedAtSeconds: a.lastAcceptedAtSeconds,
          },
          {
            solvedCount: b.totalSolved,
            penaltyMinutes: b.totalPenalty,
            lastAcceptedAtSeconds: b.lastAcceptedAtSeconds,
          }
        );
      } else {
        return compareOI(
          {
            totalPoints: a.totalPoints,
            lastImprovementAtSeconds: a.lastImprovementAtSeconds,
          },
          {
            totalPoints: b.totalPoints,
            lastImprovementAtSeconds: b.lastImprovementAtSeconds,
          }
        );
      }
    });

    // Assign standard competition ranking (1, 2, 2, 4)
    let currentRank = 1;
    for (let i = 0; i < standings.length; i++) {
      if (i > 0) {
        const prev = standings[i - 1];
        const curr = standings[i];
        const isTied = contest.mode === 'icpc'
          ? prev.totalSolved === curr.totalSolved && prev.totalPenalty === curr.totalPenalty && prev.lastAcceptedAtSeconds === curr.lastAcceptedAtSeconds
          : prev.totalPoints === curr.totalPoints && prev.lastImprovementAtSeconds === curr.lastImprovementAtSeconds;

        if (!isTied) {
          currentRank = i + 1;
        }
      }
      standings[i].rank = currentRank;
      await standings[i].save();
    }

    // Cache snapshot in Redis
    try {
      const redis = getRedisClient();
      const snapshotKey = `standings:snapshot:${contestId}`;
      const payload = JSON.stringify(standings);
      await redis.set(snapshotKey, payload, 'EX', 3600); // 1-hour TTL
    } catch {
      // Redis cache failure non-fatal, DB is source of truth
    }

    return standings;
  }

  /**
   * Retrieves standings for a user, applying freeze confidentiality if active
   */
  static async getStandings(contestId: string, currentUserId?: string, isPrivileged = false): Promise<any> {
    const contest = await Contest.findById(contestId);
    if (!contest) return [];

    const isFrozen = contest.isScoreboardFrozen && !isPrivileged;

    // Fetch standings
    const standings = await Standing.find({ contestId })
      .populate('userId', 'handle displayName rating')
      .sort({ rank: 1 });

    if (!isFrozen) {
      return standings;
    }

    // Scoreboard Freeze: Mask cells submitted after freezeAt for other participants
    return standings.map((s) => {
      const obj = s.toObject();
      const isOwner = currentUserId && s.userId._id.toString() === currentUserId;

      if (!isOwner) {
        // Obfuscate post-freeze attempts for other participants
        const cellsObj = Object.fromEntries(s.cells);
        for (const label in cellsObj) {
          const cell = cellsObj[label];
          if (contest.freezeAt && cell.acceptedAtSeconds) {
            const acceptedTime = new Date(contest.startAt.getTime() + cell.acceptedAtSeconds * 1000);
            if (acceptedTime > contest.freezeAt) {
              cellsObj[label] = {
                ...cell,
                solved: false,
                isPending: true, // Marked pending
              };
            }
          }
        }
        obj.cells = cellsObj as any;
      }
      return obj;
    });
  }
}
