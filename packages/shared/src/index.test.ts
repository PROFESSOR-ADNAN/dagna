import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateICPCRankKey,
  compareICPC,
  calculateOIRankKey,
  compareOI,
  computeContestRatings,
} from './index.js';

test('ICPC Rank Key: participant with more solves ranks higher', () => {
  const p1 = { solvedCount: 5, penaltyMinutes: 120, lastAcceptedAtSeconds: 3600 };
  const p2 = { solvedCount: 4, penaltyMinutes: 60, lastAcceptedAtSeconds: 1800 };

  const key1 = calculateICPCRankKey(p1);
  const key2 = calculateICPCRankKey(p2);

  assert.ok(key1 > key2, '5 solves must produce higher rank key than 4 solves');
  assert.equal(compareICPC(p1, p2), -1, 'p1 must rank higher than p2');
});

test('ICPC Rank Key: equal solves tie-broken by penalty', () => {
  const p1 = { solvedCount: 4, penaltyMinutes: 90, lastAcceptedAtSeconds: 3000 };
  const p2 = { solvedCount: 4, penaltyMinutes: 120, lastAcceptedAtSeconds: 3200 };

  assert.equal(compareICPC(p1, p2), -1, 'Lower penalty must rank higher');
});

test('OI Rank Key: higher points rank higher', () => {
  const p1 = { totalPoints: 240, lastImprovementAtSeconds: 5000 };
  const p2 = { totalPoints: 200, lastImprovementAtSeconds: 3000 };

  assert.equal(compareOI(p1, p2), -1, '240 points must rank higher than 200 points');
});

test('Rating Engine: Codeforces Elo determinism and monotonicity', () => {
  const participants = [
    { userId: 'u1', rating: 1500, rank: 1 },
    { userId: 'u2', rating: 1500, rank: 2 },
    { userId: 'u3', rating: 1500, rank: 3 },
  ];

  const results = computeContestRatings(participants);

  assert.equal(results.length, 3);
  assert.ok(results[0].delta > results[1].delta, 'Rank 1 must get higher delta than Rank 2');
  assert.ok(results[1].delta > results[2].delta, 'Rank 2 must get higher delta than Rank 3');

  // Verify community zero-sum drift bound
  const sumDelta = results.reduce((acc, r) => acc + r.delta, 0);
  assert.ok(Math.abs(sumDelta) <= participants.length, 'Total rating delta must be within N');
});
