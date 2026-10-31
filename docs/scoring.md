# Dagna (ዳኛ) Scoring Specification & Rank Key Architecture

## 1. Scoring Modes

### 1.1 ICPC Mode
- **Problem Solved:** A problem is solved upon the first submission that achieves verdict `AC` within the official contest duration (`receivedAt <= endAt`).
- **Penalty Calculation:**
  $$\text{Penalty}_{\text{problem}} = \lfloor \frac{\text{receivedAt} - \text{contestStart}}{60 \text{ sec}} \rfloor + (\text{penaltyMinutes} \times \text{rejectedAttempts})$$
  - Default `penaltyMinutes` is 20.
  - Rejected attempts include: `WA`, `TLE`, `MLE`, `RE`, `OLE`.
  - Non-penalized submissions: `CE` (Compile Error), `SE` (System Error), and duplicate identical submissions.
  - Submissions submitted after the first AC on that problem are ignored.
- **Participant Total:**
  $$\text{Total Solved} = \sum [Solved_p], \quad \text{Total Penalty} = \sum \text{Penalty}_p$$

### 1.2 OI (Olympiad in Informatics) Mode
- **Subtask / Group Points:** A problem has $K$ test groups with points $W_1, \dots, W_K$.
- A test group scores $W_k$ points if and only if **all test cases** within group $k$ pass with `AC`.
- If a prerequisite group fails, dependent subtasks are marked `SKIPPED` with 0 points.
- The score for a problem is the maximum score achieved across all submissions by that participant during the contest.
- Ties break by earliest `lastImprovementAtSeconds`.

## 2. Deterministic Integer Rank Keys

Float comparisons for scoreboard sorting are strictly forbidden to eliminate floating-point representation bugs.

### 2.1 ICPC Integer Rank Key
Each participant's standing is assigned a 64-bit integer sort key:
$$\text{RankKey}_{\text{ICPC}} = (\text{BigInt}(\text{solvedCount}) \ll 32\text{n}) - \text{BigInt}(\text{penaltyMinutesTotal})$$

- Participants with higher `RankKey` rank higher.
- Tie-breaker: If `RankKey` is equal, ties break by ascending `lastAcceptedAtSeconds` (earlier AC wins).
- If both are equal, participants share a standard competition rank (1, 2, 2, 4).

### 2.2 OI Integer Rank Key
$$\text{RankKey}_{\text{OI}} = (\text{BigInt}(\text{totalPoints}) \ll 32\text{n}) - \text{BigInt}(\text{lastImprovementAtSeconds})$$
- Participants with higher `totalPoints` rank higher; ties break by earlier improvement time.
