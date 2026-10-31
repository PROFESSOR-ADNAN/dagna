/**
 * Deterministic Codeforces Elo Rating System
 * Formulated from the public Codeforces rating algorithm description:
 * - Expected rank from logistic distribution with scale = 400
 * - Target rank as geometric mean of actual rank and expected rank
 * - Bisection search for rating achieving target seed (60 iterations)
 * - Zero-sum adjustment and top-tier deflation protection
 */

export interface RatedParticipant {
  userId: string;
  rating: number;
  rank: number; // 1-based competition rank
}

export interface RatingChangeResult {
  userId: string;
  oldRating: number;
  newRating: number;
  delta: number;
  rank: number;
  seed: number;
}

/**
 * Calculates win probability of opponent (ratingOpponent) over participant (ratingSelf).
 * P(opponent > self) = 1 / (1 + 10^((ratingSelf - ratingOpponent) / 400))
 */
export function getWinProbability(ratingSelf: number, ratingOpponent: number): number {
  return 1.0 / (1.0 + Math.pow(10.0, (ratingSelf - ratingOpponent) / 400.0));
}

/**
 * Calculates expected rank (seed) of a hypothetical rating against all other participants.
 */
export function getSeed(rating: number, allParticipants: RatedParticipant[], excludeIndex?: number): number {
  let seed = 1.0;
  for (let i = 0; i < allParticipants.length; i++) {
    if (i === excludeIndex) continue;
    seed += getWinProbability(rating, allParticipants[i].rating);
  }
  return seed;
}

/**
 * Binary search (bisection) to find rating yielding target expected rank.
 */
export function bisectionRating(targetSeed: number, allParticipants: RatedParticipant[], excludeIndex: number): number {
  let low = -500.0;
  let high = 5000.0;

  for (let it = 0; it < 60; it++) {
    const mid = (low + high) / 2.0;
    const midSeed = getSeed(mid, allParticipants, excludeIndex);
    if (midSeed < targetSeed) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return (low + high) / 2.0;
}

/**
 * Computes deterministic rating updates for all contest participants.
 */
export function computeContestRatings(participants: RatedParticipant[]): RatingChangeResult[] {
  const n = participants.length;
  if (n === 0) return [];
  if (n === 1) {
    return [{
      userId: participants[0].userId,
      oldRating: participants[0].rating,
      newRating: participants[0].rating,
      delta: 0,
      rank: participants[0].rank,
      seed: 1.0,
    }];
  }

  const initialDeltas: number[] = new Array(n).fill(0);
  const seeds: number[] = new Array(n).fill(0);

  // Step 1: Compute target rank and raw delta for each participant
  for (let i = 0; i < n; i++) {
    const p = participants[i];
    const seed = getSeed(p.rating, participants, i);
    seeds[i] = seed;

    const geometricRank = Math.sqrt(p.rank * seed);
    const targetRating = bisectionRating(geometricRank, participants, i);
    initialDeltas[i] = Math.floor((targetRating - p.rating) / 2.0);
  }

  // Step 2: Zero-sum correction (preserve average community rating)
  const sumDelta = initialDeltas.reduce((acc, d) => acc + d, 0);
  const inc1 = -Math.floor(sumDelta / n) - 1;
  for (let i = 0; i < n; i++) {
    initialDeltas[i] += inc1;
  }

  // Step 3: Top-tier anti-deflation correction
  // Sort participants by initial rating descending to identify top bracket
  const sortedIndices = participants.map((_, i) => i).sort((a, b) => participants[b].rating - participants[a].rating);
  const k = Math.min(n, Math.max(1, Math.floor(4 * Math.sqrt(n))));

  let topDeltaSum = 0;
  for (let i = 0; i < k; i++) {
    topDeltaSum += initialDeltas[sortedIndices[i]];
  }

  const inc2 = -Math.min(0, Math.floor(topDeltaSum / k));
  for (let i = 0; i < n; i++) {
    initialDeltas[i] += inc2;
  }

  // Step 4: Finalize new ratings
  return participants.map((p, i) => {
    const delta = initialDeltas[i];
    return {
      userId: p.userId,
      oldRating: p.rating,
      newRating: p.rating + delta,
      delta,
      rank: p.rank,
      seed: seeds[i],
    };
  });
}
