# Dagna (ዳኛ) Deterministic Codeforces Elo Rating System

## 1. Mathematical Formulation

### 1.1 Probability Model
For participants $A$ and $B$ with current ratings $R_A$ and $R_B$, the expected probability that $B$ outperforms $A$ is modeled by the standard logistic function with scaling parameter 400:
$$P(B > A) = \frac{1}{1 + 10^{(R_A - R_B) / 400}}$$

### 1.2 Seed Calculation
The expected rank (seed) for participant $i$ against all contest competitors is:
$$\text{Seed}_i = 1 + \sum_{j \neq i} \frac{1}{1 + 10^{(R_i - R_j) / 400}}$$

### 1.3 Geometric Mean Target Rank
Given the actual final standing rank $\text{Rank}_i$, compute the target geometric mean rank:
$$M_i = \sqrt{\text{Rank}_i \times \text{Seed}_i}$$

### 1.4 Binary Search (Bisection)
Using bisection over the interval $[-500, 5000]$ with exactly 60 iterations, find the rating $R_i^*$ such that:
$$\text{calcSeed}(R_i^*) = M_i$$

The unadjusted rating change is:
$$\Delta_i = \lfloor \frac{R_i^* - R_i}{2} \rfloor$$

### 1.5 Zero-Sum Average Correction
To conserve average community rating:
$$\text{adj}_1 = - \lfloor \frac{\sum_{i=1}^N \Delta_i}{N} \rfloor - 1$$
$$\Delta_i \leftarrow \Delta_i + \text{adj}_1$$

### 1.6 Top-Tier Deflation Protection
To prevent top-rated grandmasters from suffering rating deflation:
$$K = \min(N, \lfloor 4 \sqrt{N} \rfloor)$$
$$\text{adj}_2 = - \min(0, \lfloor \frac{\sum_{i=1}^K \Delta_{\text{top}_i}}{K} \rfloor)$$
$$\Delta_i \leftarrow \Delta_i + \text{adj}_2$$

### 1.7 Final Rating Update
$$R_i^{\text{new}} = R_i + \Delta_i$$

## 2. Rating Invariants (Verified via Property Tests)
1. **Monotonicity:** For two participants with identical initial ratings, the one with a strictly superior rank will receive $\Delta_A \ge \Delta_B$.
2. **Deterministic Recompute:** Running `recomputeAllRatings()` from contest #1 to current reproduces exact historical ratings.
3. **Bounded Drift:** Total community rating drift $|\sum \Delta_i| \le N$.
