import test from 'node:test';
import assert from 'node:assert/strict';
import { computeContestRatings } from '../../packages/shared/dist/index.js';

interface RatedParticipant {
  userId: string;
  rating: number;
  rank: number;
}

test('Rating Property Test: Monotonicity - superior rank yields >= delta at equal rating', () => {
  const participants: RatedParticipant[] = [
    { userId: 'u1', rating: 1600, rank: 1 },
    { userId: 'u2', rating: 1600, rank: 2 },
    { userId: 'u3', rating: 1600, rank: 3 },
    { userId: 'u4', rating: 1600, rank: 4 },
  ];

  const results = computeContestRatings(participants);

  for (let i = 0; i < results.length - 1; i++) {
    assert.ok(
      results[i].delta >= results[i + 1].delta,
      `Rank ${i + 1} delta (${results[i].delta}) must be >= Rank ${i + 2} delta (${results[i + 1].delta})`
    );
  }
});

test('Rating Property Test: Bit-for-bit determinism across repeated executions', () => {
  const participants: RatedParticipant[] = [
    { userId: 'p1', rating: 1400, rank: 3 },
    { userId: 'p2', rating: 1850, rank: 1 },
    { userId: 'p3', rating: 1620, rank: 2 },
    { userId: 'p4', rating: 1210, rank: 4 },
  ];

  const run1 = computeContestRatings(participants);
  const run2 = computeContestRatings(participants);

  assert.deepEqual(run1, run2, 'Repeated rating calculations must yield bit-for-bit identical numbers');
});

test('Rating Property Test: Zero-Sum preservation bound', () => {
  const participants: RatedParticipant[] = [];
  for (let i = 0; i < 50; i++) {
    participants.push({
      userId: `user_${i}`,
      rating: 1200 + (i * 20),
      rank: 50 - i, // Inverse ranking
    });
  }

  const results = computeContestRatings(participants);
  const sumDelta = results.reduce((acc, r) => acc + r.delta, 0);

  // Total rating change across all participants must stay bounded within N
  assert.ok(
    Math.abs(sumDelta) <= participants.length,
    `Total rating sum delta (${sumDelta}) must be bounded within participant count (${participants.length})`
  );
});
