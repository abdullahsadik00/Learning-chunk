// ════════════════════════════════════════════════════════
// DSA 03: DYNAMIC PROGRAMMING — FROM SCARED TO CONFIDENT
// Run: npx ts-node 03-dynamic-programming.ts
// ════════════════════════════════════════════════════════
//
// DP is not magic. It is a structured technique for problems
// that have ONE property: overlapping subproblems.
//
// THE CORE INSIGHT:
//   Recursion is beautiful but wasteful — it recomputes the same
//   subproblems exponentially. DP = recursion + a cache.
//   Once you compute a result, store it. Never recompute it.
//
// THREE SIGNALS a problem NEEDS DP:
//   1. "Find the OPTIMAL (min/max)" — maximize profit, minimize cost
//   2. "COUNT the number of ways" — how many paths, how many combinations
//   3. "Is it POSSIBLE?" — can we partition, can we decode
//
// TWO STYLES (same Big-O, different code shape):
//   • Top-down (memoization)  — write the recursion, add a cache
//   • Bottom-up (tabulation)  — build the answer iteratively, no call stack
//
// THE 4-STEP DP FRAMEWORK (apply this to every problem):
//   Step 1: Define what dp[i] MEANS in plain English
//   Step 2: Write the RECURRENCE RELATION (how dp[i] depends on smaller i)
//   Step 3: Set BASE CASES (smallest valid inputs)
//   Step 4: Determine FILL ORDER and return the answer

// ───────────────────────────────────────────────────────────────
// 1. WHAT DP ACTUALLY IS — Fibonacci as proof of concept
// ───────────────────────────────────────────────────────────────

console.log("=== 1. What DP Actually Is — Fibonacci ===\n");

// Naive recursion — O(2^n). For n=40 this makes 2^40 calls.
function fibNaive(n: number): number {
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}

// Top-down DP (memoization) — O(n) time, O(n) space
// Same logic as naive, but results are cached in a Map.
function fibMemo(n: number, memo: Map<number, number> = new Map()): number {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n)!; // cache hit — skip recomputation
  const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, result);
  return result;
}

// Bottom-up DP (tabulation) — O(n) time, O(n) space
// Build the table from the smallest case upward.
// Step 1: dp[i] = the i-th Fibonacci number
// Step 2: dp[i] = dp[i-1] + dp[i-2]
// Step 3: dp[0] = 0, dp[1] = 1
// Step 4: fill left to right, return dp[n]
function fibTabulation(n: number): number {
  if (n <= 1) return n;
  const dp: number[] = new Array(n + 1).fill(0);
  dp[0] = 0;
  dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}

// Space-optimized — O(n) time, O(1) space
// We only ever look at the last two values, so store just those.
function fibOptimized(n: number): number {
  if (n <= 1) return n;
  let prev2 = 0, prev1 = 1;
  for (let i = 2; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}

console.log("Fibonacci(10):");
console.log("  Naive:      ", fibNaive(10));       // 55
console.log("  Memo:       ", fibMemo(10));         // 55
console.log("  Tabulation: ", fibTabulation(10));   // 55
console.log("  Optimized:  ", fibOptimized(10));    // 55
console.log("  fibNaive(20) vs fibMemo(40):");
console.log("  Naive(20) =", fibNaive(20), " (already slow for large n)");
console.log("  Memo(40)  =", fibMemo(40), " (instant, cached)");

// ───────────────────────────────────────────────────────────────
// 2. 1D DP PATTERNS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. 1D DP Patterns ===\n");

// ── CLIMBING STAIRS ──────────────────────────────────────────
// Problem: n stairs, can climb 1 or 2 steps at a time.
//          How many distinct ways to reach the top?
// LeetCode 70 | Difficulty: Easy
//
// Step 1: dp[i] = number of ways to reach stair i
// Step 2: dp[i] = dp[i-1] + dp[i-2]
//         (from stair i-1, take 1 step) OR (from stair i-2, take 2 steps)
// Step 3: dp[0] = 1 (one way to stand at the bottom: do nothing)
//         dp[1] = 1 (only one way: one single step)
// Step 4: fill left to right, return dp[n]
//
// GOTCHA: Off-by-one kills 80% of solutions. Always dry-run:
//   n=0 → 1 way (do nothing)
//   n=1 → 1 way (step 1)
//   n=2 → 2 ways (1+1 or 2)
//   n=3 → 3 ways (1+1+1, 1+2, 2+1)

function climbingStairs(n: number): number {
  if (n <= 1) return 1;
  let prev2 = 1, prev1 = 1; // dp[0], dp[1]
  for (let i = 2; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}

console.log("Climbing Stairs:");
console.log("  n=1 →", climbingStairs(1), "(expected 1)");
console.log("  n=2 →", climbingStairs(2), "(expected 2)");
console.log("  n=3 →", climbingStairs(3), "(expected 3)");
console.log("  n=5 →", climbingStairs(5), "(expected 8)");

// ── HOUSE ROBBER ─────────────────────────────────────────────
// Problem: Rob houses in a line, can't rob two adjacent houses.
//          Maximize the total amount robbed.
// LeetCode 198 | Difficulty: Medium
//
// Step 1: dp[i] = max money robbing houses 0..i
// Step 2: dp[i] = max(dp[i-1], dp[i-2] + nums[i])
//         Either skip house i (keep dp[i-1])
//         or rob house i (get dp[i-2] + nums[i])
// Step 3: dp[0] = nums[0], dp[1] = max(nums[0], nums[1])
// Step 4: fill left to right, return dp[n-1]

function houseRobber(nums: number[]): number {
  const n = nums.length;
  if (n === 0) return 0;
  if (n === 1) return nums[0];
  let prev2 = nums[0];
  let prev1 = Math.max(nums[0], nums[1]);
  for (let i = 2; i < n; i++) {
    const curr = Math.max(prev1, prev2 + nums[i]);
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}

console.log("\nHouse Robber:");
console.log("  [1,2,3,1] →", houseRobber([1, 2, 3, 1]), "(expected 4)");    // rob 1 and 3
console.log("  [2,7,9,3,1] →", houseRobber([2, 7, 9, 3, 1]), "(expected 12)"); // rob 2, 9, 1

// ── DECODE WAYS ──────────────────────────────────────────────
// Problem: A → 1, B → 2, ..., Z → 26. Given a digit string,
//          count how many ways to decode it.
// LeetCode 91 | Difficulty: Medium
//
// Step 1: dp[i] = number of ways to decode s[0..i-1]
// Step 2: dp[i] = dp[i-1]  if s[i-1] is a valid single digit (1-9)
//               + dp[i-2]  if s[i-2..i-1] is a valid two-digit (10-26)
// Step 3: dp[0] = 1 (empty string: one way — do nothing)
//         dp[1] = s[0] !== '0' ? 1 : 0
// Step 4: fill left to right, return dp[n]

function decodeWays(s: string): number {
  const n = s.length;
  const dp: number[] = new Array(n + 1).fill(0);
  dp[0] = 1;
  dp[1] = s[0] !== "0" ? 1 : 0;
  for (let i = 2; i <= n; i++) {
    const oneDigit = parseInt(s[i - 1]);
    const twoDigit = parseInt(s.substring(i - 2, i));
    if (oneDigit >= 1 && oneDigit <= 9) dp[i] += dp[i - 1];
    if (twoDigit >= 10 && twoDigit <= 26) dp[i] += dp[i - 2];
  }
  return dp[n];
}

console.log("\nDecode Ways:");
console.log("  '12'  →", decodeWays("12"),  "(expected 2)");  // AB or L
console.log("  '226' →", decodeWays("226"), "(expected 3)");  // BZ, VF, BBF
console.log("  '06'  →", decodeWays("06"),  "(expected 0)");  // invalid

// ───────────────────────────────────────────────────────────────
// 3. 2D DP PATTERNS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. 2D DP Patterns ===\n");

// TIP: Before writing code, draw the dp table and fill it by hand
// for a small example. The pattern will reveal itself immediately.

// ── UNIQUE PATHS ─────────────────────────────────────────────
// Problem: m×n grid, start top-left, reach bottom-right.
//          Can only move right or down. Count distinct paths.
// LeetCode 62 | Difficulty: Medium
//
// Step 1: dp[r][c] = number of ways to reach cell (r, c)
// Step 2: dp[r][c] = dp[r-1][c] + dp[r][c-1]  (came from above or left)
// Step 3: dp[0][c] = 1 for all c (top row: only one way, keep going right)
//         dp[r][0] = 1 for all r (left col: only one way, keep going down)
// Step 4: fill row by row left to right, return dp[m-1][n-1]

function uniquePaths(m: number, n: number): number {
  const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(1));
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
    }
  }
  return dp[m - 1][n - 1];
}

console.log("Unique Paths:");
console.log("  3×7 →", uniquePaths(3, 7), "(expected 28)");
console.log("  3×2 →", uniquePaths(3, 2), "(expected 3)");

// ── MINIMUM PATH SUM ─────────────────────────────────────────
// Problem: m×n grid of non-negative integers. Find path from
//          top-left to bottom-right that minimizes the sum of numbers.
//          Can only move right or down.
// LeetCode 64 | Difficulty: Medium
//
// Step 1: dp[r][c] = minimum cost to reach cell (r, c)
// Step 2: dp[r][c] = grid[r][c] + min(dp[r-1][c], dp[r][c-1])
// Step 3: dp[0][0] = grid[0][0]
//         First row: dp[0][c] = dp[0][c-1] + grid[0][c] (only from left)
//         First col: dp[r][0] = dp[r-1][0] + grid[r][0] (only from above)
// Step 4: fill row by row, return dp[m-1][n-1]

function minPathSum(grid: number[][]): number {
  const m = grid.length, n = grid[0].length;
  const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  dp[0][0] = grid[0][0];
  for (let c = 1; c < n; c++) dp[0][c] = dp[0][c - 1] + grid[0][c];
  for (let r = 1; r < m; r++) dp[r][0] = dp[r - 1][0] + grid[r][0];
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      dp[r][c] = grid[r][c] + Math.min(dp[r - 1][c], dp[r][c - 1]);
    }
  }
  return dp[m - 1][n - 1];
}

console.log("\nMinimum Path Sum:");
console.log(
  "  [[1,3,1],[1,5,1],[4,2,1]] →",
  minPathSum([[1, 3, 1], [1, 5, 1], [4, 2, 1]]),
  "(expected 7)"  // 1→3→1→1→1
);

// ── LONGEST COMMON SUBSEQUENCE ───────────────────────────────
// Problem: Given two strings, find the length of their longest
//          common subsequence (characters need not be contiguous).
// LeetCode 1143 | Difficulty: Medium | VERY frequently asked
//
// Step 1: dp[i][j] = LCS of text1[0..i-1] and text2[0..j-1]
// Step 2: if text1[i-1] === text2[j-1]:
//           dp[i][j] = dp[i-1][j-1] + 1   (characters match, extend)
//         else:
//           dp[i][j] = max(dp[i-1][j], dp[i][j-1])  (skip one char)
// Step 3: dp[0][j] = 0, dp[i][0] = 0 (empty string has LCS 0)
// Step 4: fill row by row, return dp[m][n]
//
// Dry run for "ace" and "abcde":
//      ""  a  b  c  d  e
//  ""   0  0  0  0  0  0
//   a   0  1  1  1  1  1
//   c   0  1  1  2  2  2
//   e   0  1  1  2  2  3   ← answer is 3

function longestCommonSubsequence(text1: string, text2: string): number {
  const m = text1.length, n = text2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}

console.log("\nLongest Common Subsequence:");
console.log("  'abcde','ace' →", longestCommonSubsequence("abcde", "ace"), "(expected 3)");
console.log("  'abc','abc'   →", longestCommonSubsequence("abc", "abc"),   "(expected 3)");
console.log("  'abc','def'   →", longestCommonSubsequence("abc", "def"),   "(expected 0)");

// ───────────────────────────────────────────────────────────────
// 4. STRING DP
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. String DP ===\n");

// GOTCHA: "Substring" = contiguous characters ("abc" in "xabcx")
//         "Subsequence" = characters in order, gaps allowed ("ac" in "abc")
//         These are COMPLETELY different DP formulations.

// ── EDIT DISTANCE (Levenshtein) ──────────────────────────────
// Problem: Given word1 and word2, return the minimum number of
//          operations to convert word1 to word2.
//          Operations: Insert a character, Delete a character, Replace a character.
// LeetCode 72 | Difficulty: Hard | Classic interview problem
//
// Step 1: dp[i][j] = min operations to convert word1[0..i-1] to word2[0..j-1]
// Step 2: if word1[i-1] === word2[j-1]:
//           dp[i][j] = dp[i-1][j-1]  (no operation needed, characters match)
//         else:
//           dp[i][j] = 1 + min(
//             dp[i-1][j],    // delete from word1
//             dp[i][j-1],    // insert into word1 (match word2[j-1])
//             dp[i-1][j-1]   // replace word1[i-1] with word2[j-1]
//           )
// Step 3: dp[i][0] = i  (delete all i chars from word1 to get empty string)
//         dp[0][j] = j  (insert all j chars to build word2 from empty)
// Step 4: fill row by row, return dp[m][n]

function editDistance(word1: string, word2: string): number {
  const m = word1.length, n = word2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]; // characters match, free
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

console.log("Edit Distance:");
console.log("  'horse','ros' →", editDistance("horse", "ros"), "(expected 3)");
console.log("  'intention','execution' →", editDistance("intention", "execution"), "(expected 5)");
console.log("  '','a' →", editDistance("", "a"), "(expected 1)");

// ── LONGEST PALINDROMIC SUBSEQUENCE ──────────────────────────
// Problem: Find the length of the longest palindromic subsequence in s.
// LeetCode 516 | Difficulty: Medium
//
// KEY INSIGHT: LPS(s) = LCS(s, reverse(s))
// If a palindromic subsequence reads the same forwards and backwards,
// it must appear in both s and its reverse as a common subsequence.

function longestPalindromicSubsequence(s: string): number {
  return longestCommonSubsequence(s, s.split("").reverse().join(""));
}

console.log("\nLongest Palindromic Subsequence:");
console.log("  'bbbab' →", longestPalindromicSubsequence("bbbab"), "(expected 4)"); // 'bbbb'
console.log("  'cbbd'  →", longestPalindromicSubsequence("cbbd"),  "(expected 2)"); // 'bb'

// ── COUNT PALINDROMIC SUBSTRINGS ─────────────────────────────
// Problem: Count how many substrings of s are palindromes.
// LeetCode 647 | Difficulty: Medium
//
// APPROACH: Expand around each center. A palindrome has a center
// (single char for odd-length, gap for even-length). Expand outward
// as long as characters match.
//
// Note: dp[i][j] = is s[i..j] a palindrome would also work (O(n²) space),
// but the expand-around-center approach is O(1) space and equally O(n²) time.

function countPalindromicSubstrings(s: string): number {
  let count = 0;
  function expandAroundCenter(left: number, right: number): void {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      count++;
      left--;
      right++;
    }
  }
  for (let i = 0; i < s.length; i++) {
    expandAroundCenter(i, i);     // odd-length palindromes (center at i)
    expandAroundCenter(i, i + 1); // even-length palindromes (center between i and i+1)
  }
  return count;
}

console.log("\nPalindromic Substrings Count:");
console.log("  'abc'  →", countPalindromicSubstrings("abc"),  "(expected 3)"); // a,b,c
console.log("  'aaa'  →", countPalindromicSubstrings("aaa"),  "(expected 6)"); // a,a,a,aa,aa,aaa
console.log("  'abba' →", countPalindromicSubstrings("abba"), "(expected 6)"); // a,b,b,a,bb,abba

// ───────────────────────────────────────────────────────────────
// 5. KNAPSACK PATTERNS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Knapsack Patterns ===\n");

// Two fundamental variants:
//   0/1 Knapsack   — each item used AT MOST ONCE
//                    Loop items outer, loop capacity inner (descending)
//   Unbounded Knapsack — each item used ANY NUMBER OF TIMES
//                    Loop capacity inner (ascending), same item can be reused

// ── COIN CHANGE (Unbounded Knapsack) ─────────────────────────
// Problem: Given coin denominations, find the MINIMUM number of
//          coins needed to make up a given amount.
// LeetCode 322 | Difficulty: Medium
//
// UNBOUNDED: Same coin can be used multiple times.
//
// Step 1: dp[a] = minimum coins needed to make amount a
// Step 2: dp[a] = min over all coins c where c <= a: dp[a - c] + 1
// Step 3: dp[0] = 0 (zero coins needed for amount 0)
//         dp[a] = Infinity initially (amount not yet reachable)
// Step 4: fill amounts 1..amount, return dp[amount]

function coinChange(coins: number[], amount: number): number {
  const dp: number[] = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a && dp[a - coin] !== Infinity) {
        dp[a] = Math.min(dp[a], dp[a - coin] + 1);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}

console.log("Coin Change (minimum coins):");
console.log("  coins=[1,5,6,9], amount=11 →", coinChange([1, 5, 6, 9], 11), "(expected 2)"); // 5+6
console.log("  coins=[2], amount=3        →", coinChange([2], 3),           "(expected -1)");
console.log("  coins=[1,2,5], amount=11   →", coinChange([1, 2, 5], 11),    "(expected 3)"); // 5+5+1

// ── COIN CHANGE II (Count Ways, Unbounded) ───────────────────
// Problem: Count the number of COMBINATIONS that make up the amount.
// LeetCode 518 | Difficulty: Medium
//
// KEY DIFFERENCE vs Coin Change I: count ways, not minimum coins.
// Loop coins in outer loop, amounts in inner — this naturally counts
// combinations (not permutations). If you loop amount outer, you get
// permutations (different orderings counted separately).
//
// GOTCHA: The loop order matters critically here.
//   Outer=coins, inner=amounts → combinations (order doesn't matter)
//   Outer=amounts, inner=coins → permutations (order matters)

function coinChangeII(amount: number, coins: number[]): number {
  const dp: number[] = new Array(amount + 1).fill(0);
  dp[0] = 1; // one way to make amount 0: use no coins
  for (const coin of coins) {         // outer: each coin
    for (let a = coin; a <= amount; a++) { // inner: each amount this coin can contribute to
      dp[a] += dp[a - coin];
    }
  }
  return dp[amount];
}

console.log("\nCoin Change II (number of combinations):");
console.log("  amount=5, coins=[1,2,5] →", coinChangeII(5, [1, 2, 5]), "(expected 4)");
console.log("  amount=3, coins=[2]     →", coinChangeII(3, [2]),        "(expected 0)");
console.log("  amount=10, coins=[10]   →", coinChangeII(10, [10]),       "(expected 1)");

// ── PARTITION EQUAL SUBSET SUM (0/1 Knapsack) ────────────────
// Problem: Can we partition an array into two subsets with equal sum?
// LeetCode 416 | Difficulty: Medium
//
// KEY INSIGHT: Total sum must be even. Then: can we pick a subset
//              that sums to total/2? This is a 0/1 knapsack (each
//              element used at most once).
//
// Step 1: dp[s] = true if we can form sum s using elements seen so far
// Step 2: dp[s] = dp[s] OR dp[s - num]  (include or exclude num)
// Step 3: dp[0] = true (sum 0 always achievable: pick nothing)
// Step 4: iterate elements outer, iterate sums DESCENDING inner
//         (descending prevents using the same element twice — 0/1 knapsack trick)

function canPartition(nums: number[]): boolean {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2 !== 0) return false;
  const target = total / 2;
  const dp: boolean[] = new Array(target + 1).fill(false);
  dp[0] = true;
  for (const num of nums) {
    // Iterate DESCENDING to ensure each num is used at most once
    for (let s = target; s >= num; s--) {
      dp[s] = dp[s] || dp[s - num];
    }
  }
  return dp[target];
}

console.log("\nPartition Equal Subset Sum:");
console.log("  [1,5,11,5]  →", canPartition([1, 5, 11, 5]),  "(expected true)");  // [1,5,5] and [11]
console.log("  [1,2,3,5]   →", canPartition([1, 2, 3, 5]),   "(expected false)");
console.log("  [3,3,3,4,5] →", canPartition([3, 3, 3, 4, 5]), "(expected true)");  // [3,3,3] and [4,5]

// ───────────────────────────────────────────────────────────────
// 6. DECISION MAKING UNDER CONSTRAINTS — Stock Trading
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Stock Trading (Decision Making) ===\n");

// GOTCHA: State machine is the cleanest mental model.
// Track states: are we holding a stock or not? How many transactions remain?
// dp[day][holding][txns_left] → max profit

// ── BEST TIME TO BUY AND SELL STOCK (1 transaction) ──────────
// LeetCode 121 | Difficulty: Easy
//
// KEY INSIGHT: No DP needed. Track the minimum price seen so far.
// At each day, profit = current price − minimum price so far.
// This is O(n) time, O(1) space — greedy.

function maxProfit1(prices: number[]): number {
  let minPrice = Infinity, maxProfitSoFar = 0;
  for (const price of prices) {
    minPrice = Math.min(minPrice, price);
    maxProfitSoFar = Math.max(maxProfitSoFar, price - minPrice);
  }
  return maxProfitSoFar;
}

console.log("Best Time to Buy/Sell (1 transaction):");
console.log("  [7,1,5,3,6,4] →", maxProfit1([7, 1, 5, 3, 6, 4]), "(expected 5)");
console.log("  [7,6,4,3,1]   →", maxProfit1([7, 6, 4, 3, 1]),     "(expected 0)");

// ── BEST TIME... II (unlimited transactions) ──────────────────
// LeetCode 122 | Difficulty: Medium
//
// KEY INSIGHT: Unlimited transactions = capture EVERY upward move.
// If tomorrow is higher than today, buy today, sell tomorrow.
// Greedy: sum all positive day-to-day differences.

function maxProfit2(prices: number[]): number {
  let profit = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      profit += prices[i] - prices[i - 1]; // capture every gain
    }
  }
  return profit;
}

console.log("\nBest Time to Buy/Sell II (unlimited transactions):");
console.log("  [7,1,5,3,6,4] →", maxProfit2([7, 1, 5, 3, 6, 4]), "(expected 7)");
console.log("  [1,2,3,4,5]   →", maxProfit2([1, 2, 3, 4, 5]),     "(expected 4)");

// ── BEST TIME... III (at most 2 transactions) ─────────────────
// LeetCode 123 | Difficulty: Hard
//
// STATE MACHINE: Track 4 states across prices:
//   buy1:  best profit after first buy (buying costs money → subtract price)
//   sell1: best profit after first sell
//   buy2:  best profit after second buy (can use profit from sell1)
//   sell2: best profit after second sell
//
// Transitions:
//   buy1  = max(buy1,  -price)               — buy as cheap as possible
//   sell1 = max(sell1, buy1 + price)         — sell as high as possible
//   buy2  = max(buy2,  sell1 - price)        — use first sale profit for second buy
//   sell2 = max(sell2, buy2 + price)         — maximize final profit

function maxProfit3(prices: number[]): number {
  let buy1 = -Infinity, sell1 = 0, buy2 = -Infinity, sell2 = 0;
  for (const price of prices) {
    buy1  = Math.max(buy1,  -price);
    sell1 = Math.max(sell1, buy1 + price);
    buy2  = Math.max(buy2,  sell1 - price);
    sell2 = Math.max(sell2, buy2 + price);
  }
  return sell2;
}

console.log("\nBest Time to Buy/Sell III (at most 2 transactions):");
console.log("  [3,3,5,0,0,3,1,4] →", maxProfit3([3, 3, 5, 0, 0, 3, 1, 4]), "(expected 6)");
console.log("  [1,2,3,4,5]       →", maxProfit3([1, 2, 3, 4, 5]),           "(expected 4)");
console.log("  [7,6,4,3,1]       →", maxProfit3([7, 6, 4, 3, 1]),           "(expected 0)");

// ───────────────────────────────────────────────────────────────
// 7. INTERVAL AND SUBSEQUENCE DP
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Subsequence and Interval DP ===\n");

// ── LONGEST INCREASING SUBSEQUENCE (O(n²)) ───────────────────
// Problem: Find the length of the longest strictly increasing subsequence.
// LeetCode 300 | Difficulty: Medium | Very commonly asked
//
// Step 1: dp[i] = length of LIS ending at index i
// Step 2: dp[i] = max(dp[j] + 1) for all j < i where nums[j] < nums[i]
// Step 3: dp[i] = 1 for all i (each element is a subsequence of length 1)
// Step 4: answer = max(dp)

function lisQuadratic(nums: number[]): number {
  const n = nums.length;
  const dp: number[] = new Array(n).fill(1);
  let best = 1;
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    best = Math.max(best, dp[i]);
  }
  return best;
}

// ── LONGEST INCREASING SUBSEQUENCE (O(n log n)) ──────────────
// PATIENCE SORTING — interview-level knowledge worth knowing.
//
// Maintain an array `tails` where tails[i] = smallest tail of all
// increasing subsequences of length i+1.
// For each number: binary search for the leftmost position in tails
// where tails[pos] >= num, then replace tails[pos] = num.
// If num > all tails, append it (length increases).
//
// The LENGTH of tails at the end = length of LIS.
// (Note: tails is NOT the actual LIS, just a structure for counting.)

function lisNLogN(nums: number[]): number {
  const tails: number[] = [];
  for (const num of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < num) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = num; // replace or extend
  }
  return tails.length;
}

console.log("Longest Increasing Subsequence:");
const lisInput = [10, 9, 2, 5, 3, 7, 101, 18];
console.log("  [10,9,2,5,3,7,101,18] O(n²)     →", lisQuadratic(lisInput), "(expected 4)"); // 2,3,7,101
console.log("  [10,9,2,5,3,7,101,18] O(n log n) →", lisNLogN(lisInput),    "(expected 4)");

// ── MAXIMUM PRODUCT SUBARRAY ─────────────────────────────────
// Problem: Find the contiguous subarray with the largest product.
// LeetCode 152 | Difficulty: Medium
//
// TWIST: Negatives flip min/max. Track BOTH max and min product
// ending at current position, because min×negative = new max.

function maxProductSubarray(nums: number[]): number {
  let maxSoFar = nums[0], minSoFar = nums[0], result = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const n = nums[i];
    const tempMax = Math.max(n, maxSoFar * n, minSoFar * n);
    const tempMin = Math.min(n, maxSoFar * n, minSoFar * n);
    maxSoFar = tempMax;
    minSoFar = tempMin;
    result = Math.max(result, maxSoFar);
  }
  return result;
}

console.log("\nMaximum Product Subarray:");
console.log("  [2,3,-2,4]    →", maxProductSubarray([2, 3, -2, 4]),    "(expected 6)");
console.log("  [-2,0,-1]     →", maxProductSubarray([-2, 0, -1]),       "(expected 0)");
console.log("  [-2,3,-4]     →", maxProductSubarray([-2, 3, -4]),       "(expected 24)");

// ── WORD BREAK ───────────────────────────────────────────────
// Problem: Given string s and a dictionary of words, return true
//          if s can be segmented into dictionary words.
// LeetCode 139 | Difficulty: Medium
//
// Step 1: dp[i] = true if s[0..i-1] can be segmented using the dictionary
// Step 2: dp[i] = OR over all j < i: dp[j] AND s[j..i-1] in wordDict
// Step 3: dp[0] = true (empty string can always be segmented)
// Step 4: fill left to right, return dp[n]

function wordBreak(s: string, wordDict: string[]): boolean {
  const wordSet = new Set(wordDict);
  const n = s.length;
  const dp: boolean[] = new Array(n + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && wordSet.has(s.substring(j, i))) {
        dp[i] = true;
        break; // found one valid segmentation, no need to check further
      }
    }
  }
  return dp[n];
}

console.log("\nWord Break:");
console.log("  'leetcode', ['leet','code']       →", wordBreak("leetcode", ["leet", "code"]),       "(expected true)");
console.log("  'applepenapple', ['apple','pen']  →", wordBreak("applepenapple", ["apple", "pen"]),   "(expected true)");
console.log("  'catsandog', ['cats','dog','sand'] →", wordBreak("catsandog", ["cats", "dog", "sand"]), "(expected false)");

// ───────────────────────────────────────────────────────────────
// 8. CHEAT SHEET — SIGNAL TO DP TYPE MAPPING
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Cheat Sheet ===\n");

const cheatSheet = `
┌──────────────────────────────────────────────────────────────────────┐
│              PROBLEM SIGNAL → DP TYPE MAPPING                        │
├──────────────────────────┬───────────────────────────────────────────┤
│ Signal in problem         │ DP Pattern                               │
├──────────────────────────┼───────────────────────────────────────────┤
│ "min/max steps/cost"      │ 1D DP (climbing stairs, house robber)    │
│ "count ways to reach"     │ 1D DP (paths, decoding, coin change II)  │
│ "can/is it possible?"     │ 1D boolean DP (word break, partition)    │
│ "grid, move right/down"   │ 2D DP (unique paths, min path sum)       │
│ "two strings, common"     │ 2D DP (LCS, edit distance)               │
│ "two strings, transform"  │ 2D DP (edit distance)                    │
│ "palindrome"              │ Expand-around-center or 2D DP            │
│ "min coins / exact sum"   │ Unbounded knapsack (coin change I)       │
│ "count combinations"      │ Unbounded knapsack (coin change II)      │
│ "each element once"       │ 0/1 knapsack (partition, 0-1 subset sum) │
│ "buy/sell stock"          │ State machine DP (hold/not-hold states)  │
│ "longest subsequence"     │ LCS pattern or LIS pattern               │
│ "longest substring"       │ Sliding window (not DP!) — common trap   │
├──────────────────────────┼───────────────────────────────────────────┤
│             KEY GOTCHAS SUMMARY                                       │
├──────────────────────────┬───────────────────────────────────────────┤
│ Off-by-one in base cases  │ Always dry-run n=0,1,2 before coding     │
│ Substring vs subsequence  │ Totally different DP — check the problem │
│ Coin change loop order    │ Outer=items for combinations, outer=amt  │
│                           │ for permutations — know the difference   │
│ 0/1 vs unbounded          │ 0/1: inner loop descending               │
│                           │ Unbounded: inner loop ascending          │
│ LIS O(n²) vs O(n log n)  │ Both acceptable in interview; log n is   │
│                           │ better and worth knowing                 │
│ Stocks state machine       │ Track (holding/not-holding) × txns left  │
└──────────────────────────┴───────────────────────────────────────────┘
`;

console.log(cheatSheet);

// ───────────────────────────────────────────────────────────────
// 9. SELF-ASSESSMENT — 15 QUESTIONS
// ───────────────────────────────────────────────────────────────

console.log("=== 9. Self-Assessment (15 Questions) ===\n");

const questions = `
CONCEPTUAL (answer without coding)
  1. What are the THREE signals that a problem likely needs DP?
  2. What is the difference between memoization and tabulation?
     Which has better constants in practice? Why?
  3. Why does the 0/1 knapsack iterate the capacity loop in DESCENDING order?
     What happens if you iterate ascending?
  4. In Coin Change II, why does iterating coins (outer) then amounts (inner)
     give combinations, while the reverse gives permutations?
  5. Edit distance has 3 operations: insert, delete, replace. In the recurrence,
     which dp cell does each operation map to?

TRACE (dry-run by hand)
  6. Trace climbingStairs(4). What is dp[0], dp[1], dp[2], dp[3], dp[4]?
  7. Trace houseRobber([2, 1, 1, 2]). Walk through each step.
  8. Trace coinChange([1, 3, 4], 6). What is dp[0] through dp[6]?
  9. For LCS("abcd", "acd"), draw the full dp table and identify the answer.
 10. Run patience sorting (LIS O(n log n)) on [3, 1, 4, 1, 5, 9, 2, 6].
     What does the tails array look like after each element?

CODING (implement from scratch, no reference)
 11. Implement "Jump Game" (LeetCode 55): given nums where nums[i] is the
     max jump from i, return true if you can reach the last index.
 12. Implement "Minimum Cost Climbing Stairs" (LeetCode 746): cost[i] is the
     cost to step on stair i. You can start from 0 or 1. Minimize total cost.
 13. Implement "Triangle" (LeetCode 120): find the minimum path sum from top
     to bottom in a triangular array. Each step moves to an adjacent index below.
 14. Implement "Longest Turbulent Subarray" (LeetCode 978): return the length
     of the longest turbulent subarray (alternating comparisons).
 15. Implement "Distinct Subsequences" (LeetCode 115): count distinct ways
     to form string t as a subsequence of string s.

SCORING:
  0–4  correct → Re-study the file. Focus on the 4-step framework.
  5–9  correct → Progressing. Practice sections you got wrong.
 10–12 correct → Solid. Work on timing yourself.
 13–15 correct → Interview-ready on DP. Move to harder variants (k transactions, etc.)
`;

console.log(questions);

// ───────────────────────────────────────────────────────────────
// runDemo() — orchestrates all examples above
// ───────────────────────────────────────────────────────────────

function runDemo(): void {
  // All examples are already executed inline above as each section loads.
  // This function serves as a reference entry point if you want to
  // isolate and re-run any section programmatically.
  console.log("All demos have already run inline above.");
  console.log("To isolate a function, call it directly, e.g.:");
  console.log("  coinChange([1,5,6,9], 11)  →", coinChange([1, 5, 6, 9], 11));
  console.log("  lisNLogN([0,1,0,3,2,3])    →", lisNLogN([0, 1, 0, 3, 2, 3]));
  console.log("  editDistance('kitten','sitting') →", editDistance("kitten", "sitting"));
}

runDemo();
