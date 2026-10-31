/**
 * Pure integer rank key calculation for ICPC and OI scoreboards.
 * Completely eliminates floating point rounding and sorting discrepancies.
 */

export interface ICPCParticipantScore {
  solvedCount: number;
  penaltyMinutes: number;
  lastAcceptedAtSeconds: number; // Monotonic seconds from contest start
}

export interface OIParticipantScore {
  totalPoints: number;
  lastImprovementAtSeconds: number;
}

/**
 * Encodes an ICPC score into a 64-bit integer sort key.
 * Solved count occupies the higher 32 bits, and negative penalty occupies lower 32 bits.
 */
export function calculateICPCRankKey(score: ICPCParticipantScore): bigint {
  const solved = BigInt(Math.max(0, score.solvedCount));
  const penalty = BigInt(Math.max(0, score.penaltyMinutes));
  // (solved << 32) - penalty
  return (solved << 32n) - penalty;
}

/**
 * Compares two ICPC participants.
 * Returns negative if A ranks higher than B, positive if B ranks higher than A, 0 if tied.
 */
export function compareICPC(a: ICPCParticipantScore, b: ICPCParticipantScore): number {
  const keyA = calculateICPCRankKey(a);
  const keyB = calculateICPCRankKey(b);
  if (keyA > keyB) return -1;
  if (keyA < keyB) return 1;

  // Tie-breaker: earlier last accepted submission wins
  if (a.lastAcceptedAtSeconds < b.lastAcceptedAtSeconds) return -1;
  if (a.lastAcceptedAtSeconds > b.lastAcceptedAtSeconds) return 1;

  return 0; // True tie (share rank)
}

/**
 * Encodes an OI score into a 64-bit integer sort key.
 */
export function calculateOIRankKey(score: OIParticipantScore): bigint {
  const points = BigInt(Math.max(0, score.totalPoints));
  const time = BigInt(Math.max(0, score.lastImprovementAtSeconds));
  return (points << 32n) - time;
}

/**
 * Compares two OI participants.
 */
export function compareOI(a: OIParticipantScore, b: OIParticipantScore): number {
  const keyA = calculateOIRankKey(a);
  const keyB = calculateOIRankKey(b);
  if (keyA > keyB) return -1;
  if (keyA < keyB) return 1;
  return 0;
}
