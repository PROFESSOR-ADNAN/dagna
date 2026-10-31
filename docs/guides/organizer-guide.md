# Dagna (ዳኛ) Contest Organizer & Coach Guide

## 1. Organizing a Contest
1. Navigate to **Contests -> Create Contest**.
2. Select Scoring Mode:
   - **ICPC Mode:** Ranked by solved count descending, then total penalty minutes ascending.
   - **OI Mode:** Ranked by total subtask points descending, ties broken by earlier improvement time.
3. Set Contest Window: `startAt` and `endAt` (stored in UTC, displayed in `Africa/Addis_Ababa`).
4. Set Scoreboard Freeze: Default is 60 minutes before contest conclusion (`freezeAt`).

## 2. Managing Live Contests
- **Clarifications:** Answer participant questions privately or broadcast them publicly to all contestants.
- **Scoreboard Freeze:** During the freeze, public viewers see frozen standings while each authenticated contestant sees their real status with "Pending" marks visible to others.
- **Post-Contest Finalization:** Click **Finalize Contest** to publish the unfreeze scoreboard and trigger automated Codeforces Elo rating recalculation.
