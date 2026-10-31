# ADR 0015: Deterministic Codeforces Elo Rating Recalculation Engine

## Status
Accepted

## Context
Online rating updates must be fair, deterministic, and prevent rating inflation over time. Recomputing ratings from the first contest to the current date must yield identical results to incremental runs.

## Decision
We implement the documented **Codeforces Elo variant**:
1. **Initial Rating:** New users start with a base rating of 1400.
2. **Eligibility:** Participants must have registered before the contest start and submitted at least one solution during the contest window.
3. **Seed Calculation:**
   For each participant $i$ with rating $R_i$:
   $$\text{Seed}_i = 1 + \sum_{j \neq i} \frac{1}{1 + 10^{(R_j - R_i) / 400}}$$
4. **Geometric Mean Rank:**
   Calculate target rank $M_i = \sqrt{\text{Rank}_i \times \text{Seed}_i}$.
5. **Binary Search Bisection:**
   Perform binary search (bisection) with a fixed 60 iterations to find the rating $R_i^*$ whose seed equals $M_i$.
   The preliminary delta is:
   $$\Delta_i = \lfloor \frac{R_i^* - R_i}{2} \rfloor$$
6. **Zero-Sum & Anti-Inflation Corrections:**
   - **Step A:** To preserve average rating, compute sum adjustment:
     $$\text{adj}_1 = - \lfloor \frac{\sum \Delta_i}{N} \rfloor - 1$$
     Apply $\Delta_i \leftarrow \Delta_i + \text{adj}_1$.
   - **Step B:** Prevent top-tier deflation by computing adjustment over the top $\min(N, 4 \sqrt{N})$ participants:
     $$\text{adj}_2 = - \min(0, \lfloor \frac{\sum_{\text{top}} \Delta_i}{\min(N, 4\sqrt{N})} \rfloor)$$
     Apply $\Delta_i \leftarrow \Delta_i + \text{adj}_2$.
7. **Idempotency & Deterministic Rounding:**
   Rating calculations use deterministic floor rounding. An admin recompute operation replays all finalized rated contests sequentially and asserts exact equality against historic rating snapshots.
