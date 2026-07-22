// ═══════════════════════════════════════════════════════════
// CHALLENGE C03: DYNAMIC PROGRAMMING
// Run: npm run challenge:03  |  Time target: 40–50 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the classic DP recurrences from
//          03-dynamic-programming.ts — climbing stairs, house
//          robber, coin change, LIS, and 0/1 knapsack.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Run `npm run challenge:03` to check your work.

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// EXERCISE 1 — Climbing Stairs (1D DP)
// ══════════════════════════════════════════════════════════
// n stairs, climb 1 or 2 steps at a time. Count distinct ways to
// reach the top. n=0 → 1, n=1 → 1, n=2 → 2, n=3 → 3, n=5 → 8.
export function climbingStairs(n: number): number {
  // TODO: dp[i] = dp[i-1] + dp[i-2]; base dp[0]=dp[1]=1.
  void n;
  return 0; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 2 — House Robber (1D DP)
// ══════════════════════════════════════════════════════════
// Max sum of non-adjacent elements. Empty array → 0.
// dp[i] = max(dp[i-1], dp[i-2] + nums[i]).
export function houseRobber(nums: number[]): number {
  // TODO: track prev2/prev1 rolling values.
  void nums;
  return 0; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 3 — Coin Change (minimum coins, unbounded knapsack)
// ══════════════════════════════════════════════════════════
// Fewest coins to make `amount`. Unlimited coins. If impossible, -1.
// amount=0 → 0. dp[a] = min(dp[a - coin] + 1) over usable coins.
export function coinChange(coins: number[], amount: number): number {
  // TODO: dp array of size amount+1, fill Infinity, dp[0]=0.
  void coins; void amount;
  return -1; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 4 — Longest Increasing Subsequence (length)
// ══════════════════════════════════════════════════════════
// Length of the longest STRICTLY increasing subsequence.
// Empty array → 0. O(n²) dp is fine: dp[i]=1+max(dp[j]) for nums[j]<nums[i].
export function lengthOfLIS(nums: number[]): number {
  // TODO: dp[i] = longest increasing subsequence ending at i; answer = max(dp).
  void nums;
  return 0; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 5 — 0/1 Knapsack (max value under weight capacity)
// ══════════════════════════════════════════════════════════
// weights[i]/values[i] describe item i, each usable at most ONCE.
// Return the max total value with total weight <= capacity.
// dp[w] over capacity, iterate items outer, capacity DESCENDING inner.
export function knapsack01(weights: number[], values: number[], capacity: number): number {
  // TODO: dp = new Array(capacity+1).fill(0); for each item, for w desc: dp[w]=max(dp[w], dp[w-wt]+val).
  void weights; void values; void capacity;
  return 0; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 6 — Can Partition Equal Subset Sum (0/1 boolean DP)
// ══════════════════════════════════════════════════════════
// Return true if the array can be split into two subsets of equal sum.
export function canPartition(nums: number[]): boolean {
  // TODO: total must be even; then subset-sum to total/2 via boolean dp.
  void nums;
  return false; // placeholder
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C03 Dynamic Programming assertions ──");

// climbingStairs
assert(climbingStairs(2) === 2, "climbingStairs: n=2 → 2");
assert(climbingStairs(3) === 3, "climbingStairs: n=3 → 3");
assert(climbingStairs(5) === 8, "climbingStairs: n=5 → 8");

// houseRobber
assert(houseRobber([1, 2, 3, 1]) === 4, "houseRobber: [1,2,3,1] → 4");
assert(houseRobber([2, 7, 9, 3, 1]) === 12, "houseRobber: [2,7,9,3,1] → 12");
assert(houseRobber([]) === 0, "houseRobber: [] → 0");

// coinChange
assert(coinChange([1, 5, 6, 9], 11) === 2, "coinChange: [1,5,6,9],11 → 2");
assert(coinChange([2], 3) === -1, "coinChange: [2],3 → -1");
assert(coinChange([1, 2, 5], 11) === 3, "coinChange: [1,2,5],11 → 3");
assert(coinChange([1], 0) === 0, "coinChange: amount 0 → 0");

// lengthOfLIS
assert(lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18]) === 4, "lengthOfLIS: → 4");
assert(lengthOfLIS([0, 1, 0, 3, 2, 3]) === 4, "lengthOfLIS: → 4");
assert(lengthOfLIS([]) === 0, "lengthOfLIS: [] → 0");

// knapsack01
assert(knapsack01([1, 3, 4, 5], [1, 4, 5, 7], 7) === 9, "knapsack01: cap 7 → 9");
assert(knapsack01([2, 2, 3], [3, 4, 5], 5) === 9, "knapsack01: cap 5 → 9");
assert(knapsack01([5], [10], 3) === 0, "knapsack01: item too heavy → 0");

// canPartition
assert(canPartition([1, 5, 11, 5]) === true, "canPartition: [1,5,11,5] → true");
assert(canPartition([1, 2, 3, 5]) === false, "canPartition: [1,2,3,5] → false");
assert(canPartition([3, 3, 3, 4, 5]) === true, "canPartition: [3,3,3,4,5] → true");

export {};
