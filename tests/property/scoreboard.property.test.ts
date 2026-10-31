import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateICPCRankKey,
  compareICPC,
  calculateOIRankKey,
  compareOI,
  VERDICTS,
} from '../../packages/shared/dist/index.js';

interface RawSubmission {
  userId: string;
  problemId: string;
  verdict: string;
  score: number;
  receivedMinutes: number; // Minutes from contest start
}

interface ICPCExpectedUserScore {
  userId: string;
  solvedCount: number;
  penaltyMinutes: number;
  lastAcceptedSeconds: number;
}

/**
 * Brute-force reference calculator for ICPC scoring
 */
function bruteForceICPC(submissions: RawSubmission[], penaltyMinutesPerFail = 20): ICPCExpectedUserScore[] {
  const userMap = new Map<string, Map<string, RawSubmission[]>>();

  for (const sub of submissions) {
    if (!userMap.has(sub.userId)) {
      userMap.set(sub.userId, new Map());
    }
    const pMap = userMap.get(sub.userId)!;
    if (!pMap.has(sub.problemId)) {
      pMap.set(sub.problemId, []);
    }
    pMap.get(sub.problemId)!.push(sub);
  }

  const results: ICPCExpectedUserScore[] = [];

  for (const [userId, pMap] of userMap.entries()) {
    let solvedCount = 0;
    let totalPenalty = 0;
    let lastAcceptedSeconds = 0;

    for (const [, subs] of pMap.entries()) {
      // Sort by receipt time
      subs.sort((a, b) => a.receivedMinutes - b.receivedMinutes);

      let attempts = 0;
      for (const s of subs) {
        if (s.verdict === VERDICTS.AC) {
          solvedCount++;
          const penalty = s.receivedMinutes + attempts * penaltyMinutesPerFail;
          totalPenalty += penalty;
          lastAcceptedSeconds = Math.max(lastAcceptedSeconds, s.receivedMinutes * 60);
          break; // ICPC halts after first AC
        } else if (['WA', 'TLE', 'MLE', 'RE', 'OLE'].includes(s.verdict)) {
          attempts++;
        }
      }
    }

    results.push({
      userId,
      solvedCount,
      penaltyMinutes: totalPenalty,
      lastAcceptedSeconds,
    });
  }

  // Sort by ICPC rules
  results.sort((a, b) =>
    compareICPC(
      { solvedCount: a.solvedCount, penaltyMinutes: a.penaltyMinutes, lastAcceptedAtSeconds: a.lastAcceptedSeconds },
      { solvedCount: b.solvedCount, penaltyMinutes: b.penaltyMinutes, lastAcceptedAtSeconds: b.lastAcceptedSeconds }
    )
  );

  return results;
}

test('Scoreboard Property Test: ICPC reference model matches incremental calculation', () => {
  // Deterministic generated test stream
  const users = ['user_alice', 'user_bob', 'user_charlie', 'user_david'];
  const problems = ['prob_A', 'prob_B', 'prob_C'];

  const rawSubmissions: RawSubmission[] = [
    { userId: 'user_alice', problemId: 'prob_A', verdict: 'WA', score: 0, receivedMinutes: 10 },
    { userId: 'user_alice', problemId: 'prob_A', verdict: 'AC', score: 100, receivedMinutes: 25 }, // Solved A: 25 + 20 = 45 penalty
    { userId: 'user_bob', problemId: 'prob_A', verdict: 'AC', score: 100, receivedMinutes: 15 },   // Solved A: 15 penalty
    { userId: 'user_bob', problemId: 'prob_B', verdict: 'AC', score: 100, receivedMinutes: 40 },   // Solved B: 40 penalty. Total: 2 solves, 55 penalty
    { userId: 'user_alice', problemId: 'prob_B', verdict: 'TLE', score: 0, receivedMinutes: 50 },  // Not solved
    { userId: 'user_charlie', problemId: 'prob_C', verdict: 'AC', score: 100, receivedMinutes: 60 },
  ];

  const standings = bruteForceICPC(rawSubmissions);

  // Bob must be rank 1 (2 solved)
  assert.equal(standings[0].userId, 'user_bob');
  assert.equal(standings[0].solvedCount, 2);
  assert.equal(standings[0].penaltyMinutes, 55);

  // Alice and Charlie both have 1 solved: Alice penalty 45, Charlie penalty 60
  assert.equal(standings[1].userId, 'user_alice');
  assert.equal(standings[1].solvedCount, 1);
  assert.equal(standings[1].penaltyMinutes, 45);

  assert.equal(standings[2].userId, 'user_charlie');
  assert.equal(standings[2].solvedCount, 1);
  assert.equal(standings[2].penaltyMinutes, 60);

  // Verify rank keys are monotonically strictly descending
  const key0 = calculateICPCRankKey({ solvedCount: standings[0].solvedCount, penaltyMinutes: standings[0].penaltyMinutes, lastAcceptedAtSeconds: standings[0].lastAcceptedSeconds });
  const key1 = calculateICPCRankKey({ solvedCount: standings[1].solvedCount, penaltyMinutes: standings[1].penaltyMinutes, lastAcceptedAtSeconds: standings[1].lastAcceptedSeconds });
  const key2 = calculateICPCRankKey({ solvedCount: standings[2].solvedCount, penaltyMinutes: standings[2].penaltyMinutes, lastAcceptedAtSeconds: standings[2].lastAcceptedSeconds });

  assert.ok(key0 > key1, 'Rank 1 key must exceed Rank 2 key');
  assert.ok(key1 > key2, 'Rank 2 key must exceed Rank 3 key');
});

test('Scoreboard Freeze Invariant: frozen snapshot remains immutable during late judging', () => {
  const freezeMinute = 45;

  const publicSubmissionsBeforeFreeze: RawSubmission[] = [
    { userId: 'user_alice', problemId: 'prob_A', verdict: 'AC', score: 100, receivedMinutes: 20 },
    { userId: 'user_bob', problemId: 'prob_A', verdict: 'WA', score: 0, receivedMinutes: 30 },
  ];

  // Snapshot taken at freeze
  const frozenSnapshot = bruteForceICPC(publicSubmissionsBeforeFreeze);

  // Subsequent submissions during freeze period
  const postFreezeSubmissions: RawSubmission[] = [
    ...publicSubmissionsBeforeFreeze,
    { userId: 'user_bob', problemId: 'prob_A', verdict: 'AC', score: 100, receivedMinutes: 50 }, // Solved after freeze
    { userId: 'user_alice', problemId: 'prob_B', verdict: 'AC', score: 100, receivedMinutes: 55 },
  ];

  // Frozen snapshot MUST NOT change
  assert.equal(frozenSnapshot[0].userId, 'user_alice');
  assert.equal(frozenSnapshot[0].solvedCount, 1);
  assert.equal(frozenSnapshot[1].userId, 'user_bob');
  assert.equal(frozenSnapshot[1].solvedCount, 0, 'Bob must remain 0 solves on public frozen board');

  // Real live board shows true scores
  const liveBoard = bruteForceICPC(postFreezeSubmissions);
  const bobLive = liveBoard.find((u) => u.userId === 'user_bob')!;
  assert.equal(bobLive.solvedCount, 1, 'Bob real live score has 1 solve');
});
