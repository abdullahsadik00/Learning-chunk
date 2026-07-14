# Practice Problem Bank (SDE-1 / Junior)

142 interview-style problems — **106 DSA** + **36 machine coding** (Frontend / Backend / Full-Stack) — organized by category and difficulty (Easy → Medium → Hard).

## How to use this bank (attempt-first)

This is deliberately **solution-free**. The workflow:

1. **Pick a problem**, read the full spec (requirements, constraints, edge cases, evaluation criteria).
2. **Solve it yourself first** — write real code, in a file or editor, and test it against the sample and the listed edge cases. Time yourself (DSA: ~20–30 min; machine coding: 45–90 min).
3. **Bring me your attempt** (paste your code or describe your approach). I will:
   - review correctness and complexity,
   - point out bugs, missed edge cases, and style issues,
   - suggest concrete improvements,
   - and only *then* walk you through an optimal solution.
4. Only look up an answer after you've genuinely tried — struggling productively is what builds interview skill.

**Suggested order:** follow the DSA handbook's per-topic practice order; do the matching problems here right after studying each topic. For machine coding, do one Frontend + one Backend easy problem first, then work up to Full-Stack.

> Hints (where present) are one-line nudges — read them only after you're stuck for 10+ minutes.

---


# DSA Practice Bank

## Arrays

### Easy

### 1. Running Maximum Difference  —  Easy
- **Topic / Pattern:** Arrays / Single-pass scan
- **Requirements:** Given an integer array, return the maximum value of `nums[j] - nums[i]` where `j > i`. Return `0` if no positive difference exists.
- **Constraints:** `1 <= nums.length <= 1e5`, `-1e9 <= nums[i] <= 1e9`. Time O(n), space O(1).
- **Expected features / API / signature:** `function maxDifference(nums: number[]): number`
- **Sample Input / Output:** Input `[7, 1, 5, 3, 6, 4]` → Output `5`. Input `[9, 8, 7]` → Output `0`.
- **Edge cases to handle:** Single element; strictly decreasing array; all equal values; negative numbers.
- **Evaluation criteria:** Correctness, single pass with O(1) space, handling of the "no valid pair" case.

### 2. Rotate Array In Place  —  Easy
- **Topic / Pattern:** Arrays / Reversal trick
- **Requirements:** Rotate an array to the right by `k` steps, modifying it in place.
- **Constraints:** `1 <= nums.length <= 1e5`, `0 <= k <= 1e9`. Time O(n), space O(1).
- **Expected features / API / signature:** `function rotate(nums: number[], k: number): void`
- **Sample Input / Output:** Input `nums = [1,2,3,4,5,6,7], k = 3` → `nums` becomes `[5,6,7,1,2,3,4]`.
- **Edge cases to handle:** `k` larger than length; `k = 0`; single-element array; `k` equal to length.
- **Evaluation criteria:** In-place mutation (no extra array), correct handling of `k > n`, O(1) auxiliary space.
- **Hint (optional):** Consider what reversing sub-ranges does to ordering.

### Medium

### 3. Product of Array Except Self  —  Medium
- **Topic / Pattern:** Arrays / Prefix-suffix products
- **Requirements:** Return an array where each element is the product of all other elements, without using division.
- **Constraints:** `2 <= nums.length <= 1e5`; product fits in 32-bit. Time O(n), space O(1) excluding output.
- **Expected features / API / signature:** `function productExceptSelf(nums: number[]): number[]`
- **Sample Input / Output:** Input `[1,2,3,4]` → Output `[24,12,8,6]`.
- **Edge cases to handle:** Presence of zeros (single vs multiple); negative numbers; two-element input.
- **Evaluation criteria:** No division, O(n) time, O(1) extra space besides output, correct zero handling.
- **Hint (optional):** Two directional passes can accumulate what you need.

### 4. Merge Overlapping Intervals  —  Medium
- **Topic / Pattern:** Arrays / Sort + sweep
- **Requirements:** Given a list of `[start, end]` intervals, merge all overlapping intervals and return the merged list.
- **Constraints:** `1 <= intervals.length <= 1e4`, `0 <= start <= end <= 1e9`. Time O(n log n), space O(n).
- **Expected features / API / signature:** `function merge(intervals: number[][]): number[][]`
- **Sample Input / Output:** Input `[[1,3],[2,6],[8,10],[15,18]]` → Output `[[1,6],[8,10],[15,18]]`.
- **Edge cases to handle:** Touching intervals (`[1,4],[4,5]`); fully contained intervals; single interval; unsorted input.
- **Evaluation criteria:** Correct merge boundaries, sorted output, O(n log n) complexity.

### Hard

### 5. First Missing Positive  —  Hard
- **Topic / Pattern:** Arrays / Index-as-hash
- **Requirements:** Given an unsorted integer array, return the smallest positive integer that is missing.
- **Constraints:** `1 <= nums.length <= 1e5`, values may be any 32-bit int. Time O(n), space O(1).
- **Expected features / API / signature:** `function firstMissingPositive(nums: number[]): number`
- **Sample Input / Output:** Input `[3,4,-1,1]` → Output `2`. Input `[7,8,9,11,12]` → Output `1`.
- **Edge cases to handle:** All negatives; contains duplicates; contains values larger than n; single element.
- **Evaluation criteria:** True O(1) extra space (array reuse), O(n) time, correctness on adversarial inputs.
- **Hint (optional):** The answer is always within `1..n+1`; use the array itself as a lookup table.

## Strings

### Easy

### 6. Valid Palindrome (Alphanumeric)  —  Easy
- **Topic / Pattern:** Strings / Two-pointer scan
- **Requirements:** Determine whether a string is a palindrome considering only alphanumeric characters and ignoring case.
- **Constraints:** `0 <= s.length <= 2e5`. Time O(n), space O(1).
- **Expected features / API / signature:** `function isPalindrome(s: string): boolean`
- **Sample Input / Output:** Input `"A man, a plan, a canal: Panama"` → Output `true`. Input `"race a car"` → Output `false`.
- **Edge cases to handle:** Empty string; only punctuation; mixed case; single character.
- **Evaluation criteria:** O(1) space (no filtered copy), correct alphanumeric filtering.

### 7. Reverse Words in a String  —  Easy
- **Topic / Pattern:** Strings / Tokenization
- **Requirements:** Given a sentence, return the words in reverse order with single spaces and no leading/trailing spaces.
- **Constraints:** `1 <= s.length <= 1e4`. Time O(n).
- **Expected features / API / signature:** `function reverseWords(s: string): string`
- **Sample Input / Output:** Input `"  the sky  is blue  "` → Output `"blue is sky the"`.
- **Edge cases to handle:** Multiple spaces between words; leading/trailing spaces; single word.
- **Evaluation criteria:** Correct whitespace normalization, O(n) time.

### Medium

### 8. Longest Palindromic Substring  —  Medium
- **Topic / Pattern:** Strings / Expand around center
- **Requirements:** Return the longest contiguous substring of `s` that is a palindrome.
- **Constraints:** `1 <= s.length <= 1000`. Time O(n^2), space O(1).
- **Expected features / API / signature:** `function longestPalindrome(s: string): string`
- **Sample Input / Output:** Input `"babad"` → Output `"bab"` (or `"aba"`). Input `"cbbd"` → Output `"bb"`.
- **Edge cases to handle:** All identical characters; no palindrome longer than 1; even vs odd length centers.
- **Evaluation criteria:** Correctness, O(n^2) time with O(1) space, handling both center parities.

### 9. Group Anagrams  —  Medium
- **Topic / Pattern:** Strings / Hashing by signature
- **Requirements:** Group a list of strings such that anagrams are in the same group. Return the groups in any order.
- **Constraints:** `1 <= strs.length <= 1e4`, `0 <= strs[i].length <= 100`, lowercase letters. Time O(n·k) or O(n·k log k).
- **Expected features / API / signature:** `function groupAnagrams(strs: string[]): string[][]`
- **Sample Input / Output:** Input `["eat","tea","tan","ate","nat","bat"]` → Output `[["eat","tea","ate"],["tan","nat"],["bat"]]`.
- **Edge cases to handle:** Empty strings; single string; all identical strings; no anagrams.
- **Evaluation criteria:** Correct grouping, efficient key generation, stated complexity.
- **Hint (optional):** A canonical form of each string can serve as a map key.

### Hard

### 10. Minimum Window Substring  —  Hard
- **Topic / Pattern:** Strings / Sliding window + counts
- **Requirements:** Return the smallest substring of `s` containing all characters of `t` (including multiplicity). Return `""` if none exists.
- **Constraints:** `1 <= s.length, t.length <= 1e5`. Time O(n), space O(charset).
- **Expected features / API / signature:** `function minWindow(s: string, t: string): string`
- **Sample Input / Output:** Input `s = "ADOBECODEBANC", t = "ABC"` → Output `"BANC"`.
- **Edge cases to handle:** `t` longer than `s`; duplicate chars in `t`; no valid window; entire string is the answer.
- **Evaluation criteria:** O(n) time, correct multiplicity handling, minimal window guarantee.
- **Hint (optional):** Track how many required characters remain unsatisfied while expanding and contracting.

## Hashing (Map/Set)

### Easy

### 11. Two Sum  —  Easy
- **Topic / Pattern:** Hashing / Complement lookup
- **Requirements:** Return the indices of the two numbers that add up to a target. Exactly one solution exists.
- **Constraints:** `2 <= nums.length <= 1e4`, `-1e9 <= nums[i], target <= 1e9`. Time O(n), space O(n).
- **Expected features / API / signature:** `function twoSum(nums: number[], target: number): number[]`
- **Sample Input / Output:** Input `nums = [2,7,11,15], target = 9` → Output `[0,1]`.
- **Edge cases to handle:** Duplicate values; negative numbers; the two elements being adjacent.
- **Evaluation criteria:** Single-pass hashing, O(n) time, correct index pair.

### 12. Contains Duplicate Within Distance K  —  Easy
- **Topic / Pattern:** Hashing / Sliding set
- **Requirements:** Return `true` if there exist two indices `i, j` with `nums[i] === nums[j]` and `|i - j| <= k`.
- **Constraints:** `1 <= nums.length <= 1e5`, `0 <= k <= 1e5`. Time O(n), space O(k).
- **Expected features / API / signature:** `function containsNearbyDuplicate(nums: number[], k: number): boolean`
- **Sample Input / Output:** Input `nums = [1,2,3,1], k = 3` → Output `true`. Input `nums = [1,2,3,1], k = 2` → Output `false`.
- **Edge cases to handle:** `k = 0`; no duplicates; duplicates farther than k apart.
- **Evaluation criteria:** Bounded set size, O(n) time.

### Medium

### 13. Longest Consecutive Sequence  —  Medium
- **Topic / Pattern:** Hashing / Set membership
- **Requirements:** Given an unsorted array, return the length of the longest run of consecutive integers.
- **Constraints:** `0 <= nums.length <= 1e5`. Time O(n), space O(n).
- **Expected features / API / signature:** `function longestConsecutive(nums: number[]): number`
- **Sample Input / Output:** Input `[100,4,200,1,3,2]` → Output `4` (sequence `1,2,3,4`).
- **Edge cases to handle:** Empty array; duplicates; negative numbers; single element.
- **Evaluation criteria:** O(n) average time (no sorting), correct handling of duplicates.
- **Hint (optional):** Only start counting a run from a number that has no predecessor in the set.

### 14. Subarray Sum Equals K  —  Medium
- **Topic / Pattern:** Hashing / Prefix-sum counts
- **Requirements:** Return the number of contiguous subarrays whose elements sum to exactly `k`.
- **Constraints:** `1 <= nums.length <= 2e4`, `-1000 <= nums[i] <= 1000`, `-1e7 <= k <= 1e7`. Time O(n), space O(n).
- **Expected features / API / signature:** `function subarraySum(nums: number[], k: number): number`
- **Sample Input / Output:** Input `nums = [1,1,1], k = 2` → Output `2`.
- **Edge cases to handle:** Negative numbers; zeros; `k = 0`; entire array sums to k.
- **Evaluation criteria:** O(n) time via running prefix map, correct count including overlapping subarrays.

### Hard

### 15. Insert, Delete, GetRandom O(1)  —  Hard
- **Topic / Pattern:** Hashing / Map + dynamic array
- **Requirements:** Design a set supporting `insert`, `remove`, and `getRandom` (uniform among current elements) all in average O(1).
- **Constraints:** Up to `2e5` operations; values are 32-bit ints. All operations average O(1).
- **Expected features / API / signature:** `class RandomizedSet { insert(val: number): boolean; remove(val: number): boolean; getRandom(): number }`
- **Sample Input / Output:** `insert(1)`→true; `remove(2)`→false; `insert(2)`→true; `getRandom()`→ `1` or `2`; `remove(1)`→true; `getRandom()`→ `2`.
- **Edge cases to handle:** Removing the last element; duplicate insert; getRandom after removals; single element.
- **Evaluation criteria:** True average O(1) for all ops, correct uniform randomness, correct swap-and-pop removal.
- **Hint (optional):** Pair a value→index map with an array; removal can swap with the last slot.

## Two Pointers

### Easy

### 16. Merge Two Sorted Arrays In Place  —  Easy
- **Topic / Pattern:** Two Pointers / Back-to-front fill
- **Requirements:** Merge `nums2` into `nums1` (which has trailing space of length `n`) so `nums1` is sorted. Modify in place.
- **Constraints:** `nums1.length = m + n`, `0 <= m, n <= 200`. Time O(m+n), space O(1).
- **Expected features / API / signature:** `function merge(nums1: number[], m: number, nums2: number[], n: number): void`
- **Sample Input / Output:** Input `nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3` → `nums1 = [1,2,2,3,5,6]`.
- **Edge cases to handle:** `m = 0`; `n = 0`; all of nums2 smaller than nums1; duplicates.
- **Evaluation criteria:** In-place, O(1) space, correct ordering when filling from the back.

### 17. Move Zeroes  —  Easy
- **Topic / Pattern:** Two Pointers / Slow-fast write
- **Requirements:** Move all zeros to the end of the array while preserving the relative order of non-zero elements. In place.
- **Constraints:** `1 <= nums.length <= 1e4`. Time O(n), space O(1).
- **Expected features / API / signature:** `function moveZeroes(nums: number[]): void`
- **Sample Input / Output:** Input `[0,1,0,3,12]` → `[1,3,12,0,0]`.
- **Edge cases to handle:** All zeros; no zeros; single element; leading zeros.
- **Evaluation criteria:** Stable order of non-zeros, O(1) space, minimal writes.

### Medium

### 18. 3Sum  —  Medium
- **Topic / Pattern:** Two Pointers / Sort + converge
- **Requirements:** Return all unique triplets `[a,b,c]` from the array that sum to zero.
- **Constraints:** `3 <= nums.length <= 3000`, `-1e5 <= nums[i] <= 1e5`. Time O(n^2), space O(1) excluding output.
- **Expected features / API / signature:** `function threeSum(nums: number[]): number[][]`
- **Sample Input / Output:** Input `[-1,0,1,2,-1,-4]` → Output `[[-1,-1,2],[-1,0,1]]`.
- **Edge cases to handle:** Duplicate triplets; all zeros; no valid triplet; fewer than 3 distinct values.
- **Evaluation criteria:** Deduplication without a hash set on output, O(n^2) time, correct pointer convergence.
- **Hint (optional):** Fix one element, then two-pointer over the sorted remainder; skip duplicates.

### 19. Container With Most Water  —  Medium
- **Topic / Pattern:** Two Pointers / Shrinking window
- **Requirements:** Given heights, find two lines that with the x-axis form a container holding the most water. Return the max area.
- **Constraints:** `2 <= height.length <= 1e5`, `0 <= height[i] <= 1e4`. Time O(n), space O(1).
- **Expected features / API / signature:** `function maxArea(height: number[]): number`
- **Sample Input / Output:** Input `[1,8,6,2,5,4,8,3,7]` → Output `49`.
- **Edge cases to handle:** Two elements; all equal heights; zeros present.
- **Evaluation criteria:** O(n) single pass, correct decision on which pointer to move.

### Hard

### 20. Trapping Rain Water  —  Hard
- **Topic / Pattern:** Two Pointers / Left-right max
- **Requirements:** Given an elevation map, compute how much water it can trap after raining.
- **Constraints:** `1 <= height.length <= 2e4`, `0 <= height[i] <= 1e5`. Time O(n), space O(1).
- **Expected features / API / signature:** `function trap(height: number[]): number`
- **Sample Input / Output:** Input `[0,1,0,2,1,0,1,3,2,1,2,1]` → Output `6`.
- **Edge cases to handle:** Monotonic arrays (no trapping); single peak; flat plateaus; length < 3.
- **Evaluation criteria:** O(1) space two-pointer solution, correctness on plateaus and edges.
- **Hint (optional):** Water above a bar depends on the smaller of the tallest bars to its left and right.

## Sliding Window

### Easy

### 21. Maximum Average Subarray of Size K  —  Easy
- **Topic / Pattern:** Sliding Window / Fixed size
- **Requirements:** Find the contiguous subarray of length `k` with the maximum average and return that average.
- **Constraints:** `1 <= k <= nums.length <= 1e5`. Time O(n), space O(1).
- **Expected features / API / signature:** `function findMaxAverage(nums: number[], k: number): number`
- **Sample Input / Output:** Input `nums = [1,12,-5,-6,50,3], k = 4` → Output `12.75`.
- **Edge cases to handle:** `k = n`; `k = 1`; all negative values.
- **Evaluation criteria:** O(n) time by reusing the window sum, correct floating result.

### 22. Longest Substring Without Repeating Characters  —  Easy
- **Topic / Pattern:** Sliding Window / Variable size + set
- **Requirements:** Return the length of the longest substring with all distinct characters.
- **Constraints:** `0 <= s.length <= 5e4`. Time O(n), space O(charset).
- **Expected features / API / signature:** `function lengthOfLongestSubstring(s: string): number`
- **Sample Input / Output:** Input `"abcabcbb"` → Output `3`. Input `"bbbbb"` → Output `1`.
- **Edge cases to handle:** Empty string; all identical chars; all distinct chars; spaces/symbols.
- **Evaluation criteria:** O(n) single pass, correct window contraction on repeats.

### Medium

### 23. Longest Repeating Character Replacement  —  Medium
- **Topic / Pattern:** Sliding Window / Frequency + budget
- **Requirements:** Find the length of the longest substring containing a single repeated letter after replacing at most `k` characters.
- **Constraints:** `1 <= s.length <= 1e5`, uppercase letters, `0 <= k <= s.length`. Time O(n), space O(26).
- **Expected features / API / signature:** `function characterReplacement(s: string, k: number): number`
- **Sample Input / Output:** Input `s = "AABABBA", k = 1` → Output `4`.
- **Edge cases to handle:** `k = 0`; `k >= n`; single char; all identical.
- **Evaluation criteria:** O(n) time, correct window validity condition (window - maxFreq <= k).
- **Hint (optional):** The window is valid when its length minus the most frequent char count stays within k.

### 24. Permutation in String  —  Medium
- **Topic / Pattern:** Sliding Window / Fixed size + counts
- **Requirements:** Return `true` if `s2` contains a permutation of `s1` as a contiguous substring.
- **Constraints:** `1 <= s1.length, s2.length <= 1e4`, lowercase letters. Time O(n), space O(26).
- **Expected features / API / signature:** `function checkInclusion(s1: string, s2: string): boolean`
- **Sample Input / Output:** Input `s1 = "ab", s2 = "eidbaooo"` → Output `true`.
- **Edge cases to handle:** `s1` longer than `s2`; repeated characters; exact match; no match.
- **Evaluation criteria:** O(n) time via fixed-size count comparison, correct multiplicity check.

### Hard

### 25. Sliding Window Maximum  —  Hard
- **Topic / Pattern:** Sliding Window / Monotonic deque
- **Requirements:** Return an array of the maximum in each window of size `k` as it slides across `nums`.
- **Constraints:** `1 <= nums.length <= 1e5`, `1 <= k <= nums.length`. Time O(n), space O(k).
- **Expected features / API / signature:** `function maxSlidingWindow(nums: number[], k: number): number[]`
- **Sample Input / Output:** Input `nums = [1,3,-1,-3,5,3,6,7], k = 3` → Output `[3,3,5,5,6,7]`.
- **Edge cases to handle:** `k = 1`; `k = n`; all decreasing; all increasing; duplicates.
- **Evaluation criteria:** O(n) amortized via deque of indices, correct eviction of out-of-window and dominated elements.
- **Hint (optional):** Maintain indices in a deque so their values stay monotonically decreasing.

## Prefix Sum

### Easy

### 26. Running Sum of 1D Array  —  Easy
- **Topic / Pattern:** Prefix Sum / Cumulative build
- **Requirements:** Return an array where each element is the sum of all previous elements plus itself.
- **Constraints:** `1 <= nums.length <= 1000`. Time O(n), space O(1) excluding output.
- **Expected features / API / signature:** `function runningSum(nums: number[]): number[]`
- **Sample Input / Output:** Input `[1,2,3,4]` → Output `[1,3,6,10]`.
- **Edge cases to handle:** Single element; negatives; zeros.
- **Evaluation criteria:** O(n) time, correct accumulation.

### 27. Find Pivot Index  —  Easy
- **Topic / Pattern:** Prefix Sum / Left-right balance
- **Requirements:** Return the leftmost index where the sum of elements to its left equals the sum to its right, or `-1`.
- **Constraints:** `1 <= nums.length <= 1e4`, `-1000 <= nums[i] <= 1000`. Time O(n), space O(1).
- **Expected features / API / signature:** `function pivotIndex(nums: number[]): number`
- **Sample Input / Output:** Input `[1,7,3,6,5,6]` → Output `3`.
- **Edge cases to handle:** Pivot at index 0 or last; no pivot; single element; negatives.
- **Evaluation criteria:** O(n) time O(1) space using total-sum arithmetic.

### Medium

### 28. Range Sum Query 2D (Immutable)  —  Medium
- **Topic / Pattern:** Prefix Sum / 2D cumulative
- **Requirements:** Precompute a matrix so any submatrix sum query `(r1,c1)..(r2,c2)` returns in O(1).
- **Constraints:** `1 <= rows, cols <= 200`, up to `1e4` queries. Build O(m·n), query O(1).
- **Expected features / API / signature:** `class NumMatrix { constructor(matrix: number[][]); sumRegion(r1: number, c1: number, r2: number, c2: number): number }`
- **Sample Input / Output:** For a fixed matrix, `sumRegion(2,1,4,3) = 8`, `sumRegion(1,1,2,2) = 11`.
- **Edge cases to handle:** Single-cell region; full-matrix region; first row/column queries; negatives.
- **Evaluation criteria:** O(1) query via inclusion-exclusion, correct 2D prefix construction.
- **Hint (optional):** Store cumulative sums from the origin and combine four corners per query.

### 29. Contiguous Array (Equal 0s and 1s)  —  Medium
- **Topic / Pattern:** Prefix Sum / +1/-1 mapping + hash
- **Requirements:** Return the length of the longest contiguous subarray with an equal number of 0s and 1s.
- **Constraints:** `1 <= nums.length <= 1e5`, values in `{0,1}`. Time O(n), space O(n).
- **Expected features / API / signature:** `function findMaxLength(nums: number[]): number`
- **Sample Input / Output:** Input `[0,1,0]` → Output `2`.
- **Edge cases to handle:** All zeros; all ones; no balanced subarray; whole array balanced.
- **Evaluation criteria:** O(n) time via first-occurrence prefix map, correct length computation.

### Hard

### 30. Maximum Sum of Rectangle No Larger Than K  —  Hard
- **Topic / Pattern:** Prefix Sum / Column compression + ordered search
- **Requirements:** In a 2D matrix, find the maximum sum of any rectangle whose sum is no larger than `k`.
- **Constraints:** `1 <= rows, cols <= 100`, `-1e5 <= matrix[i][j] <= 1e5`. Time O(rows·cols^2·log) acceptable.
- **Expected features / API / signature:** `function maxSumSubmatrix(matrix: number[][], k: number): number`
- **Sample Input / Output:** Input `matrix = [[1,0,1],[0,-2,3]], k = 2` → Output `2`.
- **Edge cases to handle:** All values exceed k; single cell; negative-only matrix; k negative.
- **Evaluation criteria:** Correct constraint (≤ k) handling, efficient search over row-prefix sums, stated complexity.
- **Hint (optional):** Fix a pair of columns, reduce to a 1D "max subarray sum ≤ k" problem using an ordered set of prefixes.

## Binary Search

### Easy

### 31. Classic Binary Search  —  Easy
- **Topic / Pattern:** Binary Search / Exact match
- **Requirements:** Return the index of `target` in a sorted ascending array, or `-1` if absent.
- **Constraints:** `1 <= nums.length <= 1e4`, distinct values. Time O(log n), space O(1).
- **Expected features / API / signature:** `function search(nums: number[], target: number): number`
- **Sample Input / Output:** Input `nums = [-1,0,3,5,9,12], target = 9` → Output `4`.
- **Edge cases to handle:** Target absent; target at ends; single element; empty array.
- **Evaluation criteria:** Correct midpoint arithmetic (no overflow), O(log n), correct loop termination.

### 32. First Bad Version  —  Easy
- **Topic / Pattern:** Binary Search / Predicate boundary
- **Requirements:** Given `n` versions and an `isBadVersion(v)` API, find the first bad version with minimal API calls.
- **Constraints:** `1 <= bad <= n <= 2^31 - 1`. Time O(log n).
- **Expected features / API / signature:** `function firstBadVersion(n: number, isBadVersion: (v: number) => boolean): number`
- **Sample Input / Output:** For `n = 5, bad = 4` → Output `4`.
- **Edge cases to handle:** First version bad; last version bad; `n = 1`; potential integer overflow in midpoint.
- **Evaluation criteria:** Minimal API calls, overflow-safe midpoint, correct boundary.

### Medium

### 33. Search in Rotated Sorted Array  —  Medium
- **Topic / Pattern:** Binary Search / Half-sorted decision
- **Requirements:** Search `target` in a rotated ascending array of distinct values; return its index or `-1`.
- **Constraints:** `1 <= nums.length <= 5000`, distinct. Time O(log n), space O(1).
- **Expected features / API / signature:** `function search(nums: number[], target: number): number`
- **Sample Input / Output:** Input `nums = [4,5,6,7,0,1,2], target = 0` → Output `4`.
- **Edge cases to handle:** No rotation; target at pivot; single element; target absent.
- **Evaluation criteria:** O(log n), correct identification of the sorted half each step.
- **Hint (optional):** At each step one half is sorted; decide whether the target lies within it.

### 34. Find Minimum in Rotated Sorted Array  —  Medium
- **Topic / Pattern:** Binary Search / Pivot detection
- **Requirements:** Return the minimum element of a rotated ascending array of distinct values.
- **Constraints:** `1 <= nums.length <= 5000`, distinct. Time O(log n), space O(1).
- **Expected features / API / signature:** `function findMin(nums: number[]): number`
- **Sample Input / Output:** Input `[3,4,5,1,2]` → Output `1`.
- **Edge cases to handle:** No rotation; two elements; single element; minimum at index 0.
- **Evaluation criteria:** O(log n), correct comparison against the rightmost element.

### Hard

### 35. Median of Two Sorted Arrays  —  Hard
- **Topic / Pattern:** Binary Search / Partition search
- **Requirements:** Return the median of two sorted arrays in logarithmic time relative to the smaller array.
- **Constraints:** `0 <= m, n <= 1000`, `m + n >= 1`. Time O(log(min(m,n))), space O(1).
- **Expected features / API / signature:** `function findMedianSortedArrays(nums1: number[], nums2: number[]): number`
- **Sample Input / Output:** Input `nums1 = [1,3], nums2 = [2]` → Output `2.0`. Input `[1,2],[3,4]` → Output `2.5`.
- **Edge cases to handle:** One empty array; even vs odd total length; all elements of one array smaller.
- **Evaluation criteria:** Logarithmic complexity (not merge), correct partition boundaries, even/odd handling.
- **Hint (optional):** Binary-search a partition of the smaller array so left halves have the correct count and ordering.

## Sorting

### Easy

### 36. Sort Colors (Dutch National Flag)  —  Easy
- **Topic / Pattern:** Sorting / Three-way partition
- **Requirements:** Sort an array of `0`, `1`, `2` in place in a single pass.
- **Constraints:** `1 <= nums.length <= 300`, values in `{0,1,2}`. Time O(n), space O(1).
- **Expected features / API / signature:** `function sortColors(nums: number[]): void`
- **Sample Input / Output:** Input `[2,0,2,1,1,0]` → `[0,0,1,1,2,2]`.
- **Edge cases to handle:** Already sorted; all same value; single element; no 1s.
- **Evaluation criteria:** Single pass, O(1) space, no library sort.
- **Hint (optional):** Maintain three regions with low/mid/high pointers.

### 37. Merge and Sort by Frequency  —  Easy
- **Topic / Pattern:** Sorting / Custom comparator
- **Requirements:** Sort integers in increasing order of frequency; ties broken by decreasing value.
- **Constraints:** `1 <= nums.length <= 100`, `-100 <= nums[i] <= 100`. Time O(n log n).
- **Expected features / API / signature:** `function frequencySort(nums: number[]): number[]`
- **Sample Input / Output:** Input `[1,1,2,2,2,3]` → Output `[3,1,1,2,2,2]`.
- **Edge cases to handle:** All unique; all identical; negative values; ties on frequency.
- **Evaluation criteria:** Correct multi-key comparator, stable outcome per rules.

### Medium

### 38. Sort a Nearly Sorted (K-Sorted) Array  —  Medium
- **Topic / Pattern:** Sorting / Heap-assisted
- **Requirements:** Sort an array where each element is at most `k` positions from its sorted position.
- **Constraints:** `1 <= nums.length <= 1e5`, `0 <= k <= nums.length`. Time O(n log k), space O(k).
- **Expected features / API / signature:** `function sortKSortedArray(nums: number[], k: number): number[]`
- **Sample Input / Output:** Input `nums = [6,5,3,2,8,10,9], k = 3` → Output `[2,3,5,6,8,9,10]`.
- **Edge cases to handle:** `k = 0` (already sorted); `k >= n`; duplicates; single element.
- **Evaluation criteria:** O(n log k) using a size-k structure rather than a full O(n log n) sort.
- **Hint (optional):** A min-heap of size `k+1` yields the next element to output.

### 39. Kth Largest Element in an Array  —  Medium
- **Topic / Pattern:** Sorting / Quickselect
- **Requirements:** Return the `k`th largest element without fully sorting when possible.
- **Constraints:** `1 <= k <= nums.length <= 1e5`. Average time O(n), space O(1).
- **Expected features / API / signature:** `function findKthLargest(nums: number[], k: number): number`
- **Sample Input / Output:** Input `nums = [3,2,1,5,6,4], k = 2` → Output `5`.
- **Edge cases to handle:** `k = 1`; `k = n`; duplicates; already sorted.
- **Evaluation criteria:** Average O(n) via partition-based selection, correct pivot handling, in-place preferred.

### Hard

### 40. Count of Smaller Numbers After Self  —  Hard
- **Topic / Pattern:** Sorting / Merge sort with index tracking
- **Requirements:** For each element, count how many elements to its right are strictly smaller. Return the counts array.
- **Constraints:** `1 <= nums.length <= 1e5`, `-1e4 <= nums[i] <= 1e4`. Time O(n log n), space O(n).
- **Expected features / API / signature:** `function countSmaller(nums: number[]): number[]`
- **Sample Input / Output:** Input `[5,2,6,1]` → Output `[2,1,1,0]`.
- **Edge cases to handle:** Sorted ascending (all zeros); sorted descending; duplicates; single element.
- **Evaluation criteria:** O(n log n) (merge sort or BIT), correct index-to-count mapping.
- **Hint (optional):** During a merge, count how many right-side elements are placed before each left-side element.

## Recursion

### Easy

### 41. Recursive Fibonacci with Memoization  —  Easy
- **Topic / Pattern:** Recursion / Memoized top-down
- **Requirements:** Return the `n`th Fibonacci number using recursion with memoization.
- **Constraints:** `0 <= n <= 90` (fits in a JS safe integer). Time O(n), space O(n).
- **Expected features / API / signature:** `function fib(n: number, memo?: Map<number, number>): number`
- **Sample Input / Output:** Input `n = 10` → Output `55`. Input `n = 0` → Output `0`.
- **Edge cases to handle:** `n = 0` and `n = 1` base cases; large `n` near the safe-integer limit.
- **Evaluation criteria:** Correct memoization avoiding exponential recomputation, correct base cases.

### 42. Power Function (Fast Exponentiation)  —  Easy
- **Topic / Pattern:** Recursion / Divide and conquer
- **Requirements:** Compute `x` raised to integer `n` (which may be negative) in logarithmic time.
- **Constraints:** `-100.0 < x < 100.0`, `-2^31 <= n <= 2^31 - 1`. Time O(log n).
- **Expected features / API / signature:** `function myPow(x: number, n: number): number`
- **Sample Input / Output:** Input `x = 2.0, n = 10` → Output `1024.0`. Input `x = 2.0, n = -2` → Output `0.25`.
- **Edge cases to handle:** `n = 0`; negative `n`; `n = Number.MIN_SAFE`-style extremes; `x = 0` or `x = 1`.
- **Evaluation criteria:** O(log n) recursion depth, correct handling of negative exponents and overflow.
- **Hint (optional):** Halve the exponent each call and reuse the squared result.

### Medium

### 43. Flatten a Nested Array  —  Medium
- **Topic / Pattern:** Recursion / Structural traversal
- **Requirements:** Given an arbitrarily nested array of integers, return a fully flattened array preserving order.
- **Constraints:** Nesting depth up to `1000`; up to `1e4` total integers. Time O(total elements).
- **Expected features / API / signature:** `function flatten(arr: Array<number | any[]>): number[]`
- **Sample Input / Output:** Input `[1,[2,[3,4],5],[6]]` → Output `[1,2,3,4,5,6]`.
- **Edge cases to handle:** Empty arrays at any depth; deeply nested single element; non-nested input.
- **Evaluation criteria:** Correct order preservation, handles arbitrary depth, clean recursion (or explicit stack).

### 44. Tower of Hanoi Move Sequence  —  Medium
- **Topic / Pattern:** Recursion / Classic divide
- **Requirements:** Return the ordered list of `[from, to]` moves to transfer `n` disks from peg `A` to peg `C` using `B`.
- **Constraints:** `1 <= n <= 20`. Time O(2^n) moves (inherent), space O(n) recursion.
- **Expected features / API / signature:** `function hanoi(n: number, from?: string, to?: string, via?: string): [string, string][]`
- **Sample Input / Output:** Input `n = 2` → Output `[["A","B"],["A","C"],["B","C"]]`.
- **Edge cases to handle:** `n = 1`; correct peg roles; move count equals `2^n - 1`.
- **Evaluation criteria:** Correct move ordering, exactly `2^n - 1` moves, clean recursive structure.

### Hard

### 45. Expression Evaluation Without eval  —  Hard
- **Topic / Pattern:** Recursion / Recursive descent parsing
- **Requirements:** Evaluate a string arithmetic expression with `+ - * /`, parentheses, and non-negative integers, respecting precedence.
- **Constraints:** `1 <= s.length <= 1e4`, valid expression, integer division truncates toward zero. Time O(n).
- **Expected features / API / signature:** `function evaluate(s: string): number`
- **Sample Input / Output:** Input `"3+2*2"` → Output `7`. Input `"(1+(4+5+2)-3)+(6+8)"` → Output `23`.
- **Edge cases to handle:** Nested parentheses; whitespace; division truncation; single number.
- **Evaluation criteria:** Correct precedence and associativity, no use of `eval`, O(n) single scan or clean recursion.
- **Hint (optional):** Parse in layers — expression → term → factor — with recursion for parentheses.

## Backtracking

### Easy

### 46. Generate All Subsets (Power Set)  —  Easy
- **Topic / Pattern:** Backtracking / Include-exclude
- **Requirements:** Return all subsets of an array of distinct integers, in any order.
- **Constraints:** `1 <= nums.length <= 10`. Time O(n·2^n).
- **Expected features / API / signature:** `function subsets(nums: number[]): number[][]`
- **Sample Input / Output:** Input `[1,2,3]` → Output includes `[]`, `[1]`, `[2]`, `[1,2]`, `[1,2,3]`, etc. (8 subsets).
- **Edge cases to handle:** Single element; empty subset included; order not required.
- **Evaluation criteria:** Exactly `2^n` subsets, no duplicates, clean recursion tree.

### 47. Letter Combinations of a Phone Number  —  Easy
- **Topic / Pattern:** Backtracking / Cartesian expansion
- **Requirements:** Given digits `2-9`, return all letter combinations the number could represent (phone keypad mapping).
- **Constraints:** `0 <= digits.length <= 4`. Time O(4^n · n).
- **Expected features / API / signature:** `function letterCombinations(digits: string): string[]`
- **Sample Input / Output:** Input `"23"` → Output `["ad","ae","af","bd","be","bf","cd","ce","cf"]`.
- **Edge cases to handle:** Empty input → `[]`; single digit; digits mapping to 4 letters (7, 9).
- **Evaluation criteria:** Complete enumeration, correct keypad mapping, empty-input handling.

### Medium

### 48. Combination Sum  —  Medium
- **Topic / Pattern:** Backtracking / Choose with repetition
- **Requirements:** Return all unique combinations of candidates (each usable unlimited times) that sum to `target`.
- **Constraints:** `1 <= candidates.length <= 30`, distinct, `1 <= target <= 500`. Time exponential (pruned).
- **Expected features / API / signature:** `function combinationSum(candidates: number[], target: number): number[][]`
- **Sample Input / Output:** Input `candidates = [2,3,6,7], target = 7` → Output `[[2,2,3],[7]]`.
- **Edge cases to handle:** No combination sums to target; single candidate; target smaller than all candidates.
- **Evaluation criteria:** No duplicate combinations, correct reuse of elements, effective pruning.
- **Hint (optional):** Advance a start index so you never revisit earlier candidates out of order.

### 49. Permutations  —  Medium
- **Topic / Pattern:** Backtracking / Swap or used-set
- **Requirements:** Return all permutations of an array of distinct integers.
- **Constraints:** `1 <= nums.length <= 8`. Time O(n·n!).
- **Expected features / API / signature:** `function permute(nums: number[]): number[][]`
- **Sample Input / Output:** Input `[1,2,3]` → Output the 6 permutations `[1,2,3]`, `[1,3,2]`, `[2,1,3]`, `[2,3,1]`, `[3,1,2]`, `[3,2,1]`.
- **Edge cases to handle:** Single element; two elements; correct count `n!`.
- **Evaluation criteria:** Exactly `n!` results, no duplicates, clean state restoration.

### Hard

### 50. N-Queens  —  Hard
- **Topic / Pattern:** Backtracking / Constraint propagation
- **Requirements:** Return all distinct board configurations placing `n` queens on an `n×n` board so none attack each other.
- **Constraints:** `1 <= n <= 9`. Time exponential (pruned by diagonals/columns).
- **Expected features / API / signature:** `function solveNQueens(n: number): string[][]`
- **Sample Input / Output:** Input `n = 4` → Output 2 solutions, each a list of strings like `[".Q..","...Q","Q...","..Q."]`.
- **Edge cases to handle:** `n = 1` (one solution); `n = 2` and `n = 3` (no solutions); efficient diagonal checks.
- **Evaluation criteria:** Correct conflict detection (columns + both diagonals), effective pruning, correct board rendering.
- **Hint (optional):** Track occupied columns and both diagonal directions as sets for O(1) conflict checks.

## Linked Lists

### Easy

### 51. Reverse a Singly Linked List  —  Easy
- **Topic / Pattern:** Linked Lists / Iterative pointer reversal
- **Requirements:** Reverse a singly linked list and return the new head.
- **Constraints:** `0 <= length <= 5000`. Time O(n), space O(1).
- **Expected features / API / signature:** `function reverseList(head: ListNode | null): ListNode | null` where `ListNode = { val: number; next: ListNode | null }`
- **Sample Input / Output:** Input `1 -> 2 -> 3 -> null` → Output `3 -> 2 -> 1 -> null`.
- **Edge cases to handle:** Empty list; single node; two nodes.
- **Evaluation criteria:** O(1) space iterative reversal, correct pointer relinking.

### 52. Merge Two Sorted Lists  —  Easy
- **Topic / Pattern:** Linked Lists / Two-pointer splice
- **Requirements:** Merge two sorted linked lists into one sorted list and return its head.
- **Constraints:** `0 <= each length <= 50`, values sorted ascending. Time O(m+n), space O(1).
- **Expected features / API / signature:** `function mergeTwoLists(a: ListNode | null, b: ListNode | null): ListNode | null`
- **Sample Input / Output:** Input `1->2->4`, `1->3->4` → Output `1->1->2->3->4->4`.
- **Edge cases to handle:** One or both empty; duplicates; one list fully smaller.
- **Evaluation criteria:** In-place splicing (reuse nodes), correct ordering, O(1) extra space.

### Medium

### 53. Add Two Numbers (Linked List Digits)  —  Medium
- **Topic / Pattern:** Linked Lists / Digit-wise carry
- **Requirements:** Two numbers are stored as reversed-digit linked lists. Return their sum as the same representation.
- **Constraints:** `1 <= each length <= 100`, digits `0-9`, no leading zeros except the number 0. Time O(max(m,n)).
- **Expected features / API / signature:** `function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null`
- **Sample Input / Output:** Input `2->4->3` (342), `5->6->4` (465) → Output `7->0->8` (807).
- **Edge cases to handle:** Different lengths; final carry creating a new node; one number is 0.
- **Evaluation criteria:** Correct carry propagation, single pass, correct terminal node handling.

### 54. Remove Nth Node From End  —  Medium
- **Topic / Pattern:** Linked Lists / Two-pointer gap
- **Requirements:** Remove the `n`th node from the end of the list and return the head, in one pass.
- **Constraints:** `1 <= length <= 30`, `1 <= n <= length`. Time O(length), space O(1).
- **Expected features / API / signature:** `function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null`
- **Sample Input / Output:** Input `1->2->3->4->5, n = 2` → Output `1->2->3->5`.
- **Edge cases to handle:** Removing the head; single node; `n` equals length.
- **Evaluation criteria:** Single pass with a gap pointer, correct head-removal via dummy node.
- **Hint (optional):** Advance one pointer `n` steps ahead, then move both until it reaches the end.

### Hard

### 55. Merge K Sorted Lists  —  Hard
- **Topic / Pattern:** Linked Lists / Heap or divide-and-conquer
- **Requirements:** Merge `k` sorted linked lists into one sorted list and return its head.
- **Constraints:** `0 <= k <= 1e4`, total nodes up to `1e5`. Time O(N log k), space O(k).
- **Expected features / API / signature:** `function mergeKLists(lists: Array<ListNode | null>): ListNode | null`
- **Sample Input / Output:** Input `[1->4->5, 1->3->4, 2->6]` → Output `1->1->2->3->4->4->5->6`.
- **Edge cases to handle:** Empty input array; some lists null; all lists empty; single list.
- **Evaluation criteria:** O(N log k) via heap or pairwise merge, correct handling of null lists.
- **Hint (optional):** A min-heap keyed on current node values, or repeated pairwise merging, both achieve log-k factor.

## Stacks

### Easy

### 56. Valid Parentheses  —  Easy
- **Topic / Pattern:** Stacks / Matching pairs
- **Requirements:** Given a string of `()[]{}`, return whether all brackets are correctly opened and closed in order.
- **Constraints:** `1 <= s.length <= 1e4`. Time O(n), space O(n).
- **Expected features / API / signature:** `function isValid(s: string): boolean`
- **Sample Input / Output:** Input `"()[]{}"` → Output `true`. Input `"(]"` → Output `false`.
- **Edge cases to handle:** Unmatched closer first; leftover openers; single character; empty string.
- **Evaluation criteria:** O(n) with a single stack, correct pair matching and empty-stack checks.

### 57. Min Stack  —  Easy
- **Topic / Pattern:** Stacks / Auxiliary min tracking
- **Requirements:** Design a stack supporting `push`, `pop`, `top`, and `getMin` all in O(1).
- **Constraints:** Up to `3e4` operations; `pop`/`top`/`getMin` only called on non-empty stack. All ops O(1).
- **Expected features / API / signature:** `class MinStack { push(x: number): void; pop(): void; top(): number; getMin(): number }`
- **Sample Input / Output:** `push(-2); push(0); push(-3); getMin()→ -3; pop(); top()→ 0; getMin()→ -2`.
- **Edge cases to handle:** Duplicate minimums; popping the current min; single element.
- **Evaluation criteria:** True O(1) getMin, correct min restoration on pop.
- **Hint (optional):** Track the running minimum alongside each pushed element.

### Medium

### 58. Daily Temperatures  —  Medium
- **Topic / Pattern:** Stacks / Monotonic stack
- **Requirements:** For each day, return how many days until a warmer temperature; `0` if none.
- **Constraints:** `1 <= temps.length <= 1e5`, `30 <= temps[i] <= 100`. Time O(n), space O(n).
- **Expected features / API / signature:** `function dailyTemperatures(temperatures: number[]): number[]`
- **Sample Input / Output:** Input `[73,74,75,71,69,72,76,73]` → Output `[1,1,4,2,1,1,0,0]`.
- **Edge cases to handle:** Monotonically decreasing (all zeros); all equal; single element; last element.
- **Evaluation criteria:** O(n) via a decreasing stack of indices, correct distance computation.
- **Hint (optional):** Keep a stack of indices whose warmer day hasn't been found yet.

### 59. Evaluate Reverse Polish Notation  —  Medium
- **Topic / Pattern:** Stacks / Postfix evaluation
- **Requirements:** Evaluate an arithmetic expression given in Reverse Polish Notation with `+ - * /` (division truncates toward zero).
- **Constraints:** `1 <= tokens.length <= 1e4`, valid RPN. Time O(n), space O(n).
- **Expected features / API / signature:** `function evalRPN(tokens: string[]): number`
- **Sample Input / Output:** Input `["2","1","+","3","*"]` → Output `9`. Input `["4","13","5","/","+"]` → Output `6`.
- **Edge cases to handle:** Negative numbers; division truncation; single operand; operator order for `-` and `/`.
- **Evaluation criteria:** O(n) stack evaluation, correct operand ordering and truncation.

### Hard

### 60. Largest Rectangle in Histogram  —  Hard
- **Topic / Pattern:** Stacks / Monotonic stack of bars
- **Requirements:** Given bar heights of unit width, return the area of the largest rectangle that fits within the histogram.
- **Constraints:** `1 <= heights.length <= 1e5`, `0 <= heights[i] <= 1e4`. Time O(n), space O(n).
- **Expected features / API / signature:** `function largestRectangleArea(heights: number[]): number`
- **Sample Input / Output:** Input `[2,1,5,6,2,3]` → Output `10`.
- **Edge cases to handle:** All equal heights; strictly increasing; strictly decreasing; single bar; zeros.
- **Evaluation criteria:** O(n) via monotonic stack, correct width computation on pops.
- **Hint (optional):** When a shorter bar appears, pop taller bars and compute their bounded width.

## Queues

### Easy

### 61. Implement Queue Using Two Stacks  —  Easy
- **Topic / Pattern:** Queues / Amortized transfer
- **Requirements:** Implement a FIFO queue (`push`, `pop`, `peek`, `empty`) using only two stacks.
- **Constraints:** Up to `100` operations; `pop`/`peek` only on non-empty queue. Amortized O(1) per op.
- **Expected features / API / signature:** `class MyQueue { push(x: number): void; pop(): number; peek(): number; empty(): boolean }`
- **Sample Input / Output:** `push(1); push(2); peek()→1; pop()→1; empty()→false`.
- **Edge cases to handle:** Interleaved push/pop; single element; emptying and refilling.
- **Evaluation criteria:** Amortized O(1) via lazy transfer, correct FIFO order.

### 62. Number of Recent Calls  —  Easy
- **Topic / Pattern:** Queues / Sliding time window
- **Requirements:** Count requests in the last 3000 ms. Each `ping(t)` is called with strictly increasing `t`; return the count in `[t-3000, t]`.
- **Constraints:** `1 <= t <= 1e9` strictly increasing, up to `1e4` calls. Each call amortized O(1).
- **Expected features / API / signature:** `class RecentCounter { ping(t: number): number }`
- **Sample Input / Output:** `ping(1)→1; ping(100)→2; ping(3001)→3; ping(3002)→3`.
- **Edge cases to handle:** First call; all calls within window; calls exactly at boundary `t-3000`.
- **Evaluation criteria:** Correct eviction of stale timestamps, amortized O(1) per ping.

### Medium

### 63. Design Circular Queue  —  Medium
- **Topic / Pattern:** Queues / Ring buffer
- **Requirements:** Implement a fixed-capacity circular queue with `enqueue`, `dequeue`, `front`, `rear`, `isEmpty`, `isFull`.
- **Constraints:** `1 <= capacity <= 1000`, up to `3000` operations. All ops O(1).
- **Expected features / API / signature:** `class MyCircularQueue { constructor(k: number); enQueue(v: number): boolean; deQueue(): boolean; Front(): number; Rear(): number; isEmpty(): boolean; isFull(): boolean }`
- **Sample Input / Output:** `k=3; enQueue(1)→true; enQueue(2)→true; enQueue(3)→true; enQueue(4)→false; Rear()→3; isFull()→true; deQueue()→true; enQueue(4)→true; Rear()→4`.
- **Edge cases to handle:** Full then dequeue then enqueue (wraparound); empty front/rear; capacity 1.
- **Evaluation criteria:** O(1) ops with fixed-size backing array, correct wraparound arithmetic.
- **Hint (optional):** Track head index and size to derive tail without ambiguity.

### 64. First Unique Character in a Stream  —  Medium
- **Topic / Pattern:** Queues / Queue + frequency map
- **Requirements:** Support a stream of characters; after each insert, be able to return the first non-repeating character so far, or `#` if none.
- **Constraints:** Up to `1e5` characters, lowercase letters. Each operation amortized O(1).
- **Expected features / API / signature:** `class FirstUnique { add(c: string): void; firstNonRepeating(): string }`
- **Sample Input / Output:** `add('a'); firstNonRepeating()→'a'; add('a'); firstNonRepeating()→'#'; add('b'); firstNonRepeating()→'b'`.
- **Edge cases to handle:** All repeating; empty stream; character repeats after being reported unique.
- **Evaluation criteria:** Amortized O(1) via queue eviction, correct maintenance of first-unique invariant.

### Hard

### 65. Shortest Subarray with Sum at Least K  —  Hard
- **Topic / Pattern:** Queues / Monotonic deque on prefix sums
- **Requirements:** Return the length of the shortest contiguous subarray whose sum is at least `k`, or `-1` if none. Values may be negative.
- **Constraints:** `1 <= nums.length <= 1e5`, `-1e5 <= nums[i] <= 1e5`, `1 <= k <= 1e9`. Time O(n), space O(n).
- **Expected features / API / signature:** `function shortestSubarray(nums: number[], k: number): number`
- **Sample Input / Output:** Input `nums = [2,-1,2], k = 3` → Output `3`. Input `[1,2], k = 4` → Output `-1`.
- **Edge cases to handle:** Negative numbers; single element equals k; no valid subarray; large k.
- **Evaluation criteria:** O(n) via monotonic deque of prefix-sum indices, correctness with negatives.
- **Hint (optional):** Maintain increasing prefix sums in a deque; pop from both ends as you scan.

## Trees / Binary Trees / BST

### Easy

### 66. Maximum Depth of Binary Tree  —  Easy
- **Topic / Pattern:** Trees / DFS recursion
- **Requirements:** Return the maximum depth (number of nodes on the longest root-to-leaf path) of a binary tree.
- **Constraints:** `0 <= nodes <= 1e4`. Time O(n), space O(h).
- **Expected features / API / signature:** `function maxDepth(root: TreeNode | null): number` where `TreeNode = { val: number; left: TreeNode | null; right: TreeNode | null }`
- **Sample Input / Output:** Input `[3,9,20,null,null,15,7]` → Output `3`.
- **Edge cases to handle:** Empty tree; single node; skewed (linked-list-like) tree.
- **Evaluation criteria:** O(n) traversal, correct depth definition, recursion or BFS.

### 67. Symmetric Tree  —  Easy
- **Topic / Pattern:** Trees / Mirror comparison
- **Requirements:** Determine whether a binary tree is a mirror image of itself around its center.
- **Constraints:** `1 <= nodes <= 1000`. Time O(n), space O(h).
- **Expected features / API / signature:** `function isSymmetric(root: TreeNode | null): boolean`
- **Sample Input / Output:** Input `[1,2,2,3,4,4,3]` → Output `true`. Input `[1,2,2,null,3,null,3]` → Output `false`.
- **Edge cases to handle:** Single node; empty tree; structurally symmetric but value-mismatched.
- **Evaluation criteria:** Correct mirrored comparison of value and structure, O(n).

### Medium

### 68. Validate Binary Search Tree  —  Medium
- **Topic / Pattern:** Trees / Range bounds / inorder
- **Requirements:** Determine whether a binary tree is a valid BST (strictly increasing, no duplicates).
- **Constraints:** `1 <= nodes <= 1e4`, node values fit in 32-bit. Time O(n), space O(h).
- **Expected features / API / signature:** `function isValidBST(root: TreeNode | null): boolean`
- **Sample Input / Output:** Input `[2,1,3]` → Output `true`. Input `[5,1,4,null,null,3,6]` → Output `false`.
- **Edge cases to handle:** Values equal to ancestor bounds; single node; INT_MIN/INT_MAX nodes; right-subtree violation deep down.
- **Evaluation criteria:** Correct min/max bound propagation (not just parent comparison), O(n).
- **Hint (optional):** Each node must fall strictly within an inherited (low, high) range.

### 69. Lowest Common Ancestor of a Binary Tree  —  Medium
- **Topic / Pattern:** Trees / Post-order search
- **Requirements:** Given two nodes `p` and `q` present in the tree, return their lowest common ancestor.
- **Constraints:** `2 <= nodes <= 1e5`, all values unique, `p != q`. Time O(n), space O(h).
- **Expected features / API / signature:** `function lowestCommonAncestor(root: TreeNode, p: TreeNode, q: TreeNode): TreeNode`
- **Sample Input / Output:** For tree `[3,5,1,6,2,0,8,null,null,7,4]`, LCA of `5` and `1` → `3`; LCA of `5` and `4` → `5`.
- **Edge cases to handle:** One node is ancestor of the other; nodes in different subtrees; nodes near root.
- **Evaluation criteria:** Single O(n) traversal, correct ancestor detection including the ancestor-of case.

### Hard

### 70. Binary Tree Maximum Path Sum  —  Hard
- **Topic / Pattern:** Trees / Post-order with global max
- **Requirements:** Return the maximum path sum where a path is any node sequence connected by edges (need not pass through root).
- **Constraints:** `1 <= nodes <= 3e4`, `-1000 <= val <= 1000`. Time O(n), space O(h).
- **Expected features / API / signature:** `function maxPathSum(root: TreeNode | null): number`
- **Sample Input / Output:** Input `[-10,9,20,null,null,15,7]` → Output `42`.
- **Edge cases to handle:** All negative values; single node; path through vs under a node; skewed tree.
- **Evaluation criteria:** O(n), correct distinction between the gain returned upward and the global best (which may split).
- **Hint (optional):** A node contributes at most one child branch upward, but can join both branches for the global answer.

## Heaps

### Easy

### 71. Kth Largest Element in a Stream  —  Easy
- **Topic / Pattern:** Heaps / Fixed-size min-heap
- **Requirements:** Maintain the `k`th largest value in a stream; each `add(val)` returns the current `k`th largest.
- **Constraints:** `1 <= k <= 1e4`, up to `1e4` adds. Each `add` O(log k).
- **Expected features / API / signature:** `class KthLargest { constructor(k: number, nums: number[]); add(val: number): number }`
- **Sample Input / Output:** `k=3, nums=[4,5,8,2]; add(3)→4; add(5)→5; add(10)→5; add(9)→8; add(4)→8`.
- **Edge cases to handle:** Fewer than `k` initial elements; duplicates; negative values.
- **Evaluation criteria:** Heap capped at size `k`, O(log k) per add, correct root as the answer.

### 72. Last Stone Weight  —  Easy
- **Topic / Pattern:** Heaps / Max-heap simulation
- **Requirements:** Repeatedly smash the two heaviest stones; return the weight of the last remaining stone or `0`.
- **Constraints:** `1 <= stones.length <= 30`, `1 <= stones[i] <= 1000`. Time O(n log n).
- **Expected features / API / signature:** `function lastStoneWeight(stones: number[]): number`
- **Sample Input / Output:** Input `[2,7,4,1,8,1]` → Output `1`.
- **Edge cases to handle:** Single stone; all equal (cancel out); two stones.
- **Evaluation criteria:** Correct max-heap simulation, O(n log n) overall.

### Medium

### 73. Top K Frequent Elements  —  Medium
- **Topic / Pattern:** Heaps / Frequency + partial order
- **Requirements:** Return the `k` most frequent elements in any order.
- **Constraints:** `1 <= nums.length <= 1e5`, `1 <= k <= number of distinct`. Time O(n log k) or O(n).
- **Expected features / API / signature:** `function topKFrequent(nums: number[], k: number): number[]`
- **Sample Input / Output:** Input `nums = [1,1,1,2,2,3], k = 2` → Output `[1,2]`.
- **Edge cases to handle:** All unique with `k = n`; ties in frequency; single element; `k = 1`.
- **Evaluation criteria:** Better than O(n log n) (heap of size k or bucket sort), correct frequency counting.
- **Hint (optional):** A heap capped at `k`, or bucketing by frequency, both beat a full sort.

### 74. Task Scheduler  —  Medium
- **Topic / Pattern:** Heaps / Greedy scheduling
- **Requirements:** Given tasks and a cooldown `n` between identical tasks, return the least number of time units to finish all tasks (including idles).
- **Constraints:** `1 <= tasks.length <= 1e4`, tasks are uppercase letters, `0 <= n <= 100`. Time O(total).
- **Expected features / API / signature:** `function leastInterval(tasks: string[], n: number): number`
- **Sample Input / Output:** Input `tasks = ["A","A","A","B","B","B"], n = 2` → Output `8`.
- **Edge cases to handle:** `n = 0`; all distinct tasks; one dominant task; ties on max frequency.
- **Evaluation criteria:** Correct idle computation, handles the "no idles needed" case, stated complexity.

### Hard

### 75. Find Median from Data Stream  —  Hard
- **Topic / Pattern:** Heaps / Two-heap balance
- **Requirements:** Support `addNum(num)` and `findMedian()` over a growing stream of integers.
- **Constraints:** Up to `5e4` operations. `addNum` O(log n), `findMedian` O(1).
- **Expected features / API / signature:** `class MedianFinder { addNum(num: number): void; findMedian(): number }`
- **Sample Input / Output:** `addNum(1); addNum(2); findMedian()→1.5; addNum(3); findMedian()→2`.
- **Edge cases to handle:** Single element; even vs odd count; duplicates; negative numbers.
- **Evaluation criteria:** Balanced max-heap/min-heap invariant, O(log n) insert, O(1) median.
- **Hint (optional):** Keep the lower half in a max-heap and the upper half in a min-heap, sizes differing by at most one.

## Tries

### Easy

### 76. Implement Trie (Prefix Tree)  —  Easy
- **Topic / Pattern:** Tries / Node-children map
- **Requirements:** Implement a trie supporting `insert`, `search` (exact word), and `startsWith` (prefix).
- **Constraints:** Up to `3e4` operations, lowercase letters, word length up to `2000`. Each op O(word length).
- **Expected features / API / signature:** `class Trie { insert(word: string): void; search(word: string): boolean; startsWith(prefix: string): boolean }`
- **Sample Input / Output:** `insert("apple"); search("apple")→true; search("app")→false; startsWith("app")→true; insert("app"); search("app")→true`.
- **Edge cases to handle:** Empty string; word that is a prefix of another; repeated inserts; single character.
- **Evaluation criteria:** Correct end-of-word marking (search vs startsWith distinction), O(length) per op.

### 77. Longest Common Prefix via Trie  —  Easy
- **Topic / Pattern:** Tries / Single-branch descent
- **Requirements:** Return the longest common prefix shared by all strings in an array (empty if none).
- **Constraints:** `1 <= strs.length <= 200`, `0 <= strs[i].length <= 200`. Time O(total chars).
- **Expected features / API / signature:** `function longestCommonPrefix(strs: string[]): string`
- **Sample Input / Output:** Input `["flower","flow","flight"]` → Output `"fl"`. Input `["dog","car"]` → Output `""`.
- **Edge cases to handle:** Single string; empty string present; no common prefix; identical strings.
- **Evaluation criteria:** Correct termination at first branching or word end, handles empty inputs.

### Medium

### 78. Add and Search Word (Wildcard `.`)  —  Medium
- **Topic / Pattern:** Tries / DFS with wildcard
- **Requirements:** Support `addWord` and `search` where search patterns may contain `.` matching any single letter.
- **Constraints:** Up to `1e4` operations, lowercase letters and `.`, word length up to `25`. Search may be exponential in dots.
- **Expected features / API / signature:** `class WordDictionary { addWord(word: string): void; search(word: string): boolean }`
- **Sample Input / Output:** `addWord("bad"); addWord("dad"); search("pad")→false; search(".ad")→true; search("b..")→true`.
- **Edge cases to handle:** All-wildcard pattern; pattern longer than any word; no words added; wildcard at start/end.
- **Evaluation criteria:** Correct branching DFS on `.`, correct end-of-word checks, no false positives.
- **Hint (optional):** On a `.`, recurse into every existing child at that position.

### 79. Replace Words with Roots  —  Medium
- **Topic / Pattern:** Tries / Shortest-root lookup
- **Requirements:** Given a dictionary of roots, replace every word in a sentence with the shortest root that is a prefix of it; otherwise keep the word.
- **Constraints:** `1 <= roots <= 1000`, sentence up to `1e6` chars. Time O(total chars).
- **Expected features / API / signature:** `function replaceWords(dictionary: string[], sentence: string): string`
- **Sample Input / Output:** Input `dictionary = ["cat","bat","rat"], sentence = "the cattle was rattled by the battery"` → Output `"the cat was rat by the bat"`.
- **Edge cases to handle:** Word equals a root; no matching root; multiple roots where shortest wins; single-word sentence.
- **Evaluation criteria:** Shortest-root selection, correct fallback to original word, efficient trie traversal.

### Hard

### 80. Word Search II  —  Hard
- **Topic / Pattern:** Tries / Trie-guided grid DFS
- **Requirements:** Given a grid of letters and a word list, return all words from the list that can be formed by adjacent (up/down/left/right) cells without reusing a cell.
- **Constraints:** `1 <= rows, cols <= 12`, `1 <= words.length <= 3e4`, word length up to `10`. Prune via trie.
- **Expected features / API / signature:** `function findWords(board: string[][], words: string[]): string[]`
- **Sample Input / Output:** For a board containing "oath" and "eat" among the words, Output `["oath","eat"]`.
- **Edge cases to handle:** Duplicate words in output (dedupe); single-cell board; no words found; overlapping paths.
- **Evaluation criteria:** Trie-based pruning (not per-word DFS), correct visited-cell handling, deduplicated results.
- **Hint (optional):** Insert all words into a trie, then DFS the grid following existing trie edges only.

## Graphs (DFS/BFS/Topo/Union-Find)

### Easy

### 81. Number of Islands  —  Easy
- **Topic / Pattern:** Graphs / Grid flood fill (DFS/BFS)
- **Requirements:** Count connected groups of `'1'` (land) cells in a 2D grid (4-directional adjacency).
- **Constraints:** `1 <= rows, cols <= 300`. Time O(rows·cols), space O(rows·cols).
- **Expected features / API / signature:** `function numIslands(grid: string[][]): number`
- **Sample Input / Output:** Input `[["1","1","0"],["1","0","0"],["0","0","1"]]` → Output `2`.
- **Edge cases to handle:** All water; all land; single cell; diagonal cells (not connected).
- **Evaluation criteria:** Correct visited marking, linear-in-cells time, no double counting.

### 82. Find if Path Exists in Graph  —  Easy
- **Topic / Pattern:** Graphs / Union-Find or BFS
- **Requirements:** Given an undirected graph by edge list, determine whether a path connects `source` to `destination`.
- **Constraints:** `1 <= n <= 2e5`, `0 <= edges.length <= 2e5`. Time near O(n + e).
- **Expected features / API / signature:** `function validPath(n: number, edges: number[][], source: number, destination: number): boolean`
- **Sample Input / Output:** Input `n = 3, edges = [[0,1],[1,2],[2,0]], source = 0, destination = 2` → Output `true`.
- **Edge cases to handle:** `source === destination`; disconnected graph; no edges; self loops.
- **Evaluation criteria:** Efficient connectivity check (union-find with path compression or BFS), correct trivial case.

### Medium

### 83. Course Schedule (Cycle Detection)  —  Medium
- **Topic / Pattern:** Graphs / Topological sort
- **Requirements:** Given course count and prerequisite pairs `[a, b]` (b before a), determine if all courses can be finished (no cycle).
- **Constraints:** `1 <= numCourses <= 2000`, `0 <= prerequisites.length <= 5000`. Time O(V + E).
- **Expected features / API / signature:** `function canFinish(numCourses: number, prerequisites: number[][]): boolean`
- **Sample Input / Output:** Input `numCourses = 2, prerequisites = [[1,0]]` → Output `true`. Input `[[1,0],[0,1]]` → Output `false`.
- **Edge cases to handle:** No prerequisites; self-dependency; disconnected components; multiple cycles.
- **Evaluation criteria:** O(V + E) via Kahn's algorithm or DFS coloring, correct cycle detection.
- **Hint (optional):** A valid ordering exists iff the graph is a DAG.

### 84. Rotting Oranges  —  Medium
- **Topic / Pattern:** Graphs / Multi-source BFS
- **Requirements:** Each minute, rotten oranges (2) rot adjacent fresh ones (1). Return minutes until none are fresh, or `-1` if impossible.
- **Constraints:** `1 <= rows, cols <= 10`. Time O(rows·cols).
- **Expected features / API / signature:** `function orangesRotting(grid: number[][]): number`
- **Sample Input / Output:** Input `[[2,1,1],[1,1,0],[0,1,1]]` → Output `4`.
- **Edge cases to handle:** No fresh oranges (0 minutes); unreachable fresh orange (-1); all empty; single cell.
- **Evaluation criteria:** Level-by-level BFS from all initial rotten cells, correct minute counting and impossibility detection.

### Hard

### 85. Word Ladder  —  Hard
- **Topic / Pattern:** Graphs / Shortest path BFS
- **Requirements:** Return the length of the shortest transformation sequence from `beginWord` to `endWord`, changing one letter at a time, each intermediate in `wordList`. Return `0` if none.
- **Constraints:** `1 <= wordList.length <= 5000`, all words equal length up to `10`, lowercase. Time O(N·L^2).
- **Expected features / API / signature:** `function ladderLength(beginWord: string, endWord: string, wordList: string[]): number`
- **Sample Input / Output:** Input `beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]` → Output `5`.
- **Edge cases to handle:** `endWord` not in list (return 0); begin equals end; no valid path; single-letter words.
- **Evaluation criteria:** BFS for shortest path, efficient neighbor generation (wildcard buckets), correct length counting.
- **Hint (optional):** Precompute generic patterns like `h*t` to find neighbors in O(L) instead of scanning all words.

## Greedy

### Easy

### 86. Assign Cookies  —  Easy
- **Topic / Pattern:** Greedy / Sort + match
- **Requirements:** Given children's greed factors and cookie sizes, maximize the number of content children (a child is content if a cookie ≥ their greed).
- **Constraints:** `1 <= children, cookies <= 3e4`. Time O(n log n).
- **Expected features / API / signature:** `function findContentChildren(g: number[], s: number[]): number`
- **Sample Input / Output:** Input `g = [1,2,3], s = [1,1]` → Output `1`. Input `g = [1,2], s = [1,2,3]` → Output `2`.
- **Edge cases to handle:** More cookies than children; no cookie large enough; equal sizes; single child.
- **Evaluation criteria:** Correct greedy pairing after sorting, O(n log n).

### 87. Best Time to Buy and Sell Stock II  —  Easy
- **Topic / Pattern:** Greedy / Capture every rise
- **Requirements:** Maximize profit with unlimited transactions (buy then sell, one share at a time).
- **Constraints:** `1 <= prices.length <= 3e4`, `0 <= prices[i] <= 1e4`. Time O(n), space O(1).
- **Expected features / API / signature:** `function maxProfit(prices: number[]): number`
- **Sample Input / Output:** Input `[7,1,5,3,6,4]` → Output `7`.
- **Edge cases to handle:** Monotonically decreasing (0 profit); single day; all equal prices.
- **Evaluation criteria:** O(n) single pass summing positive deltas, O(1) space.

### Medium

### 88. Jump Game II  —  Medium
- **Topic / Pattern:** Greedy / Reachability frontier
- **Requirements:** Given max jump lengths per index, return the minimum jumps to reach the last index (a solution is guaranteed).
- **Constraints:** `1 <= nums.length <= 1e4`, `0 <= nums[i] <= 1000`. Time O(n), space O(1).
- **Expected features / API / signature:** `function jump(nums: number[]): number`
- **Sample Input / Output:** Input `[2,3,1,1,4]` → Output `2`.
- **Edge cases to handle:** Single element (0 jumps); reaching end early; large jump at start.
- **Evaluation criteria:** O(n) greedy expanding the reachable range, correct jump counting.
- **Hint (optional):** Track the farthest reachable index within the current jump's boundary.

### 89. Gas Station  —  Medium
- **Topic / Pattern:** Greedy / Running balance
- **Requirements:** Given gas and cost arrays around a circular route, return the starting index to complete the circuit once, or `-1`.
- **Constraints:** `1 <= n <= 1e5`, `0 <= gas[i], cost[i] <= 1e4`. Time O(n), space O(1).
- **Expected features / API / signature:** `function canCompleteCircuit(gas: number[], cost: number[]): number`
- **Sample Input / Output:** Input `gas = [1,2,3,4,5], cost = [3,4,5,1,2]` → Output `3`.
- **Edge cases to handle:** Total gas < total cost (-1); single station; unique valid start; tie balance.
- **Evaluation criteria:** Single-pass greedy with running deficit reset, correct feasibility check.

### Hard

### 90. Candy Distribution  —  Hard
- **Topic / Pattern:** Greedy / Two-direction passes
- **Requirements:** Each child has a rating; give candies so every child gets at least one and higher-rated children get more than adjacent lower-rated ones. Minimize total candies.
- **Constraints:** `1 <= ratings.length <= 2e4`, `0 <= ratings[i] <= 2e4`. Time O(n), space O(n).
- **Expected features / API / signature:** `function candy(ratings: number[]): number`
- **Sample Input / Output:** Input `[1,0,2]` → Output `5`. Input `[1,2,2]` → Output `4`.
- **Edge cases to handle:** All equal ratings; strictly increasing; strictly decreasing; single child.
- **Evaluation criteria:** O(n) via left and right passes, correct handling of both-direction constraints.
- **Hint (optional):** Satisfy the left-neighbor rule and the right-neighbor rule in two separate sweeps, then combine.

## Dynamic Programming

### Easy

### 91. Climbing Stairs  —  Easy
- **Topic / Pattern:** DP / 1D linear recurrence
- **Requirements:** Return the number of distinct ways to climb `n` stairs taking 1 or 2 steps at a time.
- **Constraints:** `1 <= n <= 45`. Time O(n), space O(1).
- **Expected features / API / signature:** `function climbStairs(n: number): number`
- **Sample Input / Output:** Input `n = 3` → Output `3`. Input `n = 2` → Output `2`.
- **Edge cases to handle:** `n = 1`; `n = 2`; upper bound.
- **Evaluation criteria:** O(1) space rolling recurrence, correct base cases.

### 92. House Robber  —  Easy
- **Topic / Pattern:** DP / Include-exclude states
- **Requirements:** Maximize the sum of non-adjacent elements in the array (cannot rob two adjacent houses).
- **Constraints:** `1 <= nums.length <= 100`, `0 <= nums[i] <= 400`. Time O(n), space O(1).
- **Expected features / API / signature:** `function rob(nums: number[]): number`
- **Sample Input / Output:** Input `[1,2,3,1]` → Output `4`. Input `[2,7,9,3,1]` → Output `12`.
- **Edge cases to handle:** Single house; two houses; all zeros; equal values.
- **Evaluation criteria:** O(1) space, correct adjacency exclusion, correct base cases.

### Medium

### 93. Coin Change (Minimum Coins)  —  Medium
- **Topic / Pattern:** DP / Unbounded knapsack
- **Requirements:** Return the fewest coins summing to `amount` using unlimited coins of given denominations, or `-1` if impossible.
- **Constraints:** `1 <= coins.length <= 12`, `1 <= coins[i] <= 2^31 - 1`, `0 <= amount <= 1e4`. Time O(amount·coins).
- **Expected features / API / signature:** `function coinChange(coins: number[], amount: number): number`
- **Sample Input / Output:** Input `coins = [1,2,5], amount = 11` → Output `3`. Input `coins = [2], amount = 3` → Output `-1`.
- **Edge cases to handle:** `amount = 0` → 0; no combination works; single coin equal to amount; coin larger than amount.
- **Evaluation criteria:** O(amount·coins) bottom-up, correct unreachable handling.
- **Hint (optional):** Build up the answer for every sub-amount from `0` to `amount`.

### 94. Longest Increasing Subsequence  —  Medium
- **Topic / Pattern:** DP / Patience / O(n log n)
- **Requirements:** Return the length of the longest strictly increasing subsequence.
- **Constraints:** `1 <= nums.length <= 2500`. Target time O(n log n).
- **Expected features / API / signature:** `function lengthOfLIS(nums: number[]): number`
- **Sample Input / Output:** Input `[10,9,2,5,3,7,101,18]` → Output `4` (e.g. `2,3,7,101`).
- **Edge cases to handle:** Strictly decreasing (length 1); all equal (length 1); single element; already increasing.
- **Evaluation criteria:** O(n log n) using a patience/tails array with binary search, correct strictness.
- **Hint (optional):** Maintain the smallest possible tail for each subsequence length.

### Hard

### 95. Edit Distance  —  Hard
- **Topic / Pattern:** DP / 2D grid recurrence
- **Requirements:** Return the minimum number of insert/delete/replace operations to convert `word1` into `word2`.
- **Constraints:** `0 <= word1.length, word2.length <= 500`. Time O(m·n), space O(min(m,n)) achievable.
- **Expected features / API / signature:** `function minDistance(word1: string, word2: string): number`
- **Sample Input / Output:** Input `word1 = "horse", word2 = "ros"` → Output `3`.
- **Edge cases to handle:** One string empty; identical strings; completely different strings; single-char strings.
- **Evaluation criteria:** Correct 2D recurrence, O(m·n) time, optional space optimization, correct base rows/columns.

### 96. Word Break  —  Hard
- **Topic / Pattern:** DP / Segmentation
- **Requirements:** Determine whether a string can be segmented into a space-separated sequence of dictionary words.
- **Constraints:** `1 <= s.length <= 300`, `1 <= wordDict.length <= 1000`. Time O(n^2 · maxWordLen) acceptable.
- **Expected features / API / signature:** `function wordBreak(s: string, wordDict: string[]): boolean`
- **Sample Input / Output:** Input `s = "leetcode", wordDict = ["leet","code"]` → Output `true`. Input `s = "catsandog", wordDict = ["cats","dog","sand","and","cat"]` → Output `false`.
- **Edge cases to handle:** Word reused multiple times; no valid split; single-character words; overlapping words.
- **Evaluation criteria:** DP over prefixes (avoid exponential blowup), correct reachability of the full length.
- **Hint (optional):** `dp[i]` = whether the first `i` characters are segmentable.

## Bit Manipulation

### Easy

### 97. Single Number  —  Easy
- **Topic / Pattern:** Bit Manipulation / XOR cancellation
- **Requirements:** In an array where every element appears twice except one, return the element that appears once.
- **Constraints:** `1 <= nums.length <= 3e4`, exactly one single. Time O(n), space O(1).
- **Expected features / API / signature:** `function singleNumber(nums: number[]): number`
- **Sample Input / Output:** Input `[4,1,2,1,2]` → Output `4`. Input `[2,2,1]` → Output `1`.
- **Edge cases to handle:** Single element array; negatives; the single element being 0.
- **Evaluation criteria:** O(1) space via XOR, O(n) single pass.

### 98. Number of 1 Bits (Hamming Weight)  —  Easy
- **Topic / Pattern:** Bit Manipulation / Bit counting
- **Requirements:** Return the number of set bits in the 32-bit unsigned representation of an integer.
- **Constraints:** Input is a 32-bit unsigned integer. Time O(number of set bits) or O(32).
- **Expected features / API / signature:** `function hammingWeight(n: number): number`
- **Sample Input / Output:** Input `11` (`1011`) → Output `3`. Input `128` (`10000000`) → Output `1`.
- **Edge cases to handle:** `0`; all bits set; single bit; high bit set.
- **Evaluation criteria:** Correct bit counting, no string conversion preferred.
- **Hint (optional):** `n & (n - 1)` clears the lowest set bit.

### Medium

### 99. Sum of Two Integers Without `+`/`-`  —  Medium
- **Topic / Pattern:** Bit Manipulation / Carry via XOR/AND
- **Requirements:** Return `a + b` without using the `+` or `-` operators.
- **Constraints:** `-1000 <= a, b <= 1000` (mind 32-bit wraparound). Time O(1)/O(bits).
- **Expected features / API / signature:** `function getSum(a: number, b: number): number`
- **Sample Input / Output:** Input `a = 1, b = 2` → Output `3`. Input `a = 2, b = 3` → Output `5`.
- **Edge cases to handle:** Negative operands; one operand zero; carry propagation; result sign.
- **Evaluation criteria:** Correct XOR (sum-without-carry) plus shifted-AND (carry) loop, handles negatives via 32-bit semantics.
- **Hint (optional):** XOR gives the addition without carry; AND-shift gives the carry to fold back in.

### 100. Counting Bits (0..n)  —  Medium
- **Topic / Pattern:** Bit Manipulation / DP on bits
- **Requirements:** Return an array where index `i` holds the number of set bits in `i`, for all `i` from `0` to `n`.
- **Constraints:** `0 <= n <= 1e5`. Time O(n), space O(n) output.
- **Expected features / API / signature:** `function countBits(n: number): number[]`
- **Sample Input / Output:** Input `n = 5` → Output `[0,1,1,2,1,2]`.
- **Edge cases to handle:** `n = 0`; powers of two; consecutive values.
- **Evaluation criteria:** O(n) using a recurrence (not O(n log n) recount per value).
- **Hint (optional):** `bits[i] = bits[i >> 1] + (i & 1)`.

### Hard

### 101. Maximum XOR of Two Numbers in an Array  —  Hard
- **Topic / Pattern:** Bit Manipulation / Binary trie / prefix mask
- **Requirements:** Return the maximum value of `nums[i] XOR nums[j]` over all pairs.
- **Constraints:** `1 <= nums.length <= 2e5`, `0 <= nums[i] < 2^31`. Time O(n·32).
- **Expected features / API / signature:** `function findMaximumXOR(nums: number[]): number`
- **Sample Input / Output:** Input `[3,10,5,25,2,8]` → Output `28`.
- **Edge cases to handle:** Single element (0); all identical (0); values with the high bit set.
- **Evaluation criteria:** Linear-in-bits approach (bit trie or greedy prefix), not brute-force O(n^2).
- **Hint (optional):** Build the answer bit by bit from the most significant bit using a set of prefixes.

## Math & Number Theory

### Easy

### 102. Fizz Buzz  —  Easy
- **Topic / Pattern:** Math / Divisibility
- **Requirements:** Return an array of length `n` where multiples of 3 → "Fizz", of 5 → "Buzz", of both → "FizzBuzz", else the number as a string.
- **Constraints:** `1 <= n <= 1e4`. Time O(n).
- **Expected features / API / signature:** `function fizzBuzz(n: number): string[]`
- **Sample Input / Output:** Input `n = 5` → Output `["1","2","Fizz","4","Buzz"]`.
- **Edge cases to handle:** `n` less than 3 (no Fizz/Buzz); exactly 15 (FizzBuzz); n = 1.
- **Evaluation criteria:** Correct precedence of the both-divisible case, O(n).

### 103. Palindrome Number  —  Easy
- **Topic / Pattern:** Math / Digit reversal
- **Requirements:** Determine whether an integer reads the same forwards and backwards, without converting to a string.
- **Constraints:** `-2^31 <= x <= 2^31 - 1`. Time O(digits), space O(1).
- **Expected features / API / signature:** `function isPalindrome(x: number): boolean`
- **Sample Input / Output:** Input `121` → Output `true`. Input `-121` → Output `false`. Input `10` → Output `false`.
- **Edge cases to handle:** Negative numbers (always false); trailing zero; single digit; zero.
- **Evaluation criteria:** No string conversion, O(1) space via reversing half the digits, correct negative handling.

### Medium

### 104. Count Primes (Sieve)  —  Medium
- **Topic / Pattern:** Math / Sieve of Eratosthenes
- **Requirements:** Return the count of prime numbers strictly less than `n`.
- **Constraints:** `0 <= n <= 5e6`. Time O(n log log n), space O(n).
- **Expected features / API / signature:** `function countPrimes(n: number): number`
- **Sample Input / Output:** Input `n = 10` → Output `4` (2,3,5,7). Input `n = 0` → Output `0`.
- **Edge cases to handle:** `n <= 2` → 0; `n = 3` → 1; large `n` performance; boundary (strictly less than n).
- **Evaluation criteria:** Sieve (not per-number trial division), correct upper bound handling, stated complexity.
- **Hint (optional):** Start crossing out multiples of each prime `p` from `p*p`.

### 105. Greatest Common Divisor & LCM  —  Medium
- **Topic / Pattern:** Math / Euclidean algorithm
- **Requirements:** Return `[gcd, lcm]` of two non-negative integers.
- **Constraints:** `0 <= a, b <= 1e9`; LCM fits in a safe integer. GCD O(log min(a,b)).
- **Expected features / API / signature:** `function gcdLcm(a: number, b: number): [number, number]`
- **Sample Input / Output:** Input `a = 12, b = 18` → Output `[6, 36]`.
- **Edge cases to handle:** One operand zero; equal operands; coprime pair; overflow-safe LCM (divide before multiply).
- **Evaluation criteria:** Euclidean GCD, LCM computed as `a / gcd * b` to avoid overflow, correct zero handling.

### Hard

### 106. Integer to English Words  —  Hard
- **Topic / Pattern:** Math / Grouping by thousands
- **Requirements:** Convert a non-negative integer to its English words representation.
- **Constraints:** `0 <= num <= 2^31 - 1`. Time O(digits).
- **Expected features / API / signature:** `function numberToWords(num: number): string`
- **Sample Input / Output:** Input `123` → Output `"One Hundred Twenty Three"`. Input `1234567` → Output `"One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven"`.
- **Edge cases to handle:** Zero → "Zero"; numbers with internal zeros (e.g. 1000000); teens (11-19); no trailing spaces.
- **Evaluation criteria:** Correct three-digit grouping with scale words, proper spacing, teens/tens handling, zero case.
- **Hint (optional):** Process the number in groups of three digits with scale labels (Thousand, Million, Billion).


---

# Machine Coding Practice Bank

## Frontend

### 1. Star Rating  —  Easy
- **Topic / Pattern:** Controlled component / event handling
- **Requirements:** Build a reusable `StarRating` component that shows N stars, highlights on hover, and locks in a value on click.
- **Constraints:** Configurable `max` (default 5); must work with keyboard; no external rating libraries; React + TypeScript.
- **Expected features / component API:** `<StarRating max={5} value={number} onChange={(v:number)=>void} />`; hover preview state independent of committed value.
- **Expected features (MoSCoW):**
  - Must: render `max` stars, click to set value, hover to preview, controlled via `value`/`onChange`.
  - Should: keyboard support (arrow keys + Enter), `readOnly` prop.
  - Could: half-star support, custom icons via prop.
  - Won't: server persistence, animations library.
- **Acceptance scenario:** User hovers over the 3rd star -> first 3 stars highlight; user clicks -> `onChange(3)` fires and 3 stars stay filled after mouse leaves.
- **Edge cases to handle:** value of 0 (no selection), value > max, hover then leave without click, rapid re-hover, disabled/readOnly state.
- **Evaluation criteria:** Clean separation of hover vs committed state, controlled-component correctness, accessibility (roles/aria), no unnecessary re-renders.
- **Hint (optional):** Track two pieces of state — the committed value and a transient hover value.

### 2. Accordion  —  Easy
- **Topic / Pattern:** List rendering / conditional display
- **Requirements:** Build an `Accordion` that renders a list of sections, each with a header and collapsible body.
- **Constraints:** Support single-open and multi-open modes via prop; smooth without a heavy animation lib; React + TS.
- **Expected features / component API:** `<Accordion items={{id,title,content}[]} allowMultiple={boolean} defaultOpenIds={string[]} />`.
- **Expected features (MoSCoW):**
  - Must: toggle sections open/closed, single-open default, render arbitrary content.
  - Should: `allowMultiple` mode, `defaultOpenIds`.
  - Could: CSS height transition, aria-expanded wiring.
  - Won't: nested accordions, drag reorder.
- **Acceptance scenario:** In single-open mode, opening section B while A is open closes A automatically; in multi mode both stay open.
- **Edge cases to handle:** empty items list, duplicate ids, all-collapsed state, controlling open state externally.
- **Evaluation criteria:** State shape choice (Set vs array), keying, prop-driven behavior switching, a11y attributes.
- **Hint (optional):** A `Set<string>` of open ids handles both modes with minimal branching.

### 3. Tabs  —  Easy
- **Topic / Pattern:** Compound components / active-index state
- **Requirements:** Build a `Tabs` component with a tab list and matching panels; only the active panel renders visibly.
- **Constraints:** Support controlled and uncontrolled usage; keyboard arrow navigation; React + TS.
- **Expected features / component API:** `<Tabs><TabList/><Tab/><TabPanels><TabPanel/></TabPanels></Tabs>` OR config-array API — pick one and document it.
- **Expected features (MoSCoW):**
  - Must: switch active tab on click, show matching panel, highlight active tab.
  - Should: keyboard Left/Right/Home/End navigation, roving tabindex.
  - Could: lazy-mount panels, disabled tabs.
  - Won't: closeable tabs, drag reorder.
- **Acceptance scenario:** Clicking "Billing" tab hides the "Profile" panel and shows the "Billing" panel; ArrowRight moves focus and selection to the next tab.
- **Edge cases to handle:** zero tabs, single tab, disabled tab skipping in keyboard nav, initial active index out of range.
- **Evaluation criteria:** ARIA tab pattern compliance, controlled/uncontrolled handling, focus management.
- **Hint (optional):** Follow the WAI-ARIA tabs roving-tabindex pattern.

### 4. Modal / Dialog  —  Easy
- **Topic / Pattern:** Portals / focus trap
- **Requirements:** Build a `Modal` that renders above the app, dims the background, and closes on overlay click or Escape.
- **Constraints:** Use React portal; restore focus to the trigger on close; prevent body scroll while open; React + TS.
- **Expected features / component API:** `<Modal isOpen onClose title>{children}</Modal>`.
- **Expected features (MoSCoW):**
  - Must: portal render, overlay + Escape close, body-scroll lock.
  - Should: focus trap within modal, focus restore on close.
  - Could: stacked modals, size variants, animation.
  - Won't: routing-based modals.
- **Acceptance scenario:** Opening the modal moves focus inside it; pressing Escape closes it and returns focus to the button that opened it; clicking the dimmed backdrop also closes it.
- **Edge cases to handle:** click inside modal shouldn't close, Escape when a nested input is focused, unmount cleanup of scroll lock/listeners, SSR (no document).
- **Evaluation criteria:** Portal usage, effect cleanup, focus management, no scroll-lock leaks.
- **Hint (optional):** Tab-key focus trapping needs the first/last focusable elements of the dialog.

### 5. Toast Notifications  —  Medium
- **Topic / Pattern:** Context provider / imperative API + timers
- **Requirements:** Build a toast system where any component can trigger a transient notification via a hook.
- **Constraints:** Auto-dismiss after a timeout, stack multiple toasts, no external toast lib; React + TS.
- **Expected features / component API:** `const { toast } = useToast(); toast({ type:'success', message, duration })`; `<ToastProvider>` at root.
- **Expected features (MoSCoW):**
  - Must: show/stack toasts, auto-dismiss, manual dismiss, type variants.
  - Should: pause-dismiss on hover, max-visible cap with queueing.
  - Could: positioning prop, action button inside toast, exit animation.
  - Won't: cross-tab sync.
- **Acceptance scenario:** Calling `toast({message:'Saved'})` shows a toast that disappears after 3s; triggering three rapidly stacks them and each dismisses on its own timer.
- **Edge cases to handle:** timer cleanup on unmount, dismiss before timeout fires, identical messages, provider missing (hook used outside).
- **Evaluation criteria:** Context design, timer lifecycle correctness, no memory leaks, ergonomic imperative API.
- **Hint (optional):** Keep an array of toasts in provider state; each item owns its own dismissal timer.

### 6. Infinite Scroll List  —  Medium
- **Topic / Pattern:** IntersectionObserver / pagination
- **Requirements:** Render a list that loads the next page of items when the user scrolls near the bottom.
- **Constraints:** Use IntersectionObserver (not scroll math); mock async fetch with a delay; handle loading and end-of-list; React + TS.
- **Expected features / component API:** `<InfiniteList fetchPage={(page)=>Promise<{items,hasMore}>} renderItem />`.
- **Expected features (MoSCoW):**
  - Must: initial load, load-more on sentinel visibility, loading indicator, stop at end.
  - Should: error state with retry, prevent duplicate concurrent fetches.
  - Could: scroll-position restore, skeleton placeholders.
  - Won't: virtualization (see Hard problem).
- **Acceptance scenario:** Scrolling the sentinel into view fetches page 2 and appends items; when `hasMore` is false the sentinel/loader disappears and no further fetches fire.
- **Edge cases to handle:** rapid scroll triggering multiple loads, empty first page, fetch failure mid-list, observer cleanup on unmount.
- **Evaluation criteria:** Observer setup/teardown, race-condition guarding, correct end/loading states.
- **Hint (optional):** Guard against re-entrant fetches with a loading flag before triggering the next page.

### 7. Image Carousel  —  Medium
- **Topic / Pattern:** Index state / timers / gestures
- **Requirements:** Build a carousel that cycles through images with prev/next controls, dot indicators, and optional autoplay.
- **Constraints:** Looping navigation, pause autoplay on hover/focus, no carousel lib; React + TS.
- **Expected features / component API:** `<Carousel images={string[]} autoPlayMs={number} loop />`.
- **Expected features (MoSCoW):**
  - Must: prev/next, dot indicators, active slide display, loop wrap-around.
  - Should: autoplay with pause-on-hover, keyboard arrows.
  - Could: swipe/touch, lazy image loading, transition animation.
  - Won't: thumbnails strip, video slides.
- **Acceptance scenario:** With autoplay on, slides advance every 3s; hovering pauses it; clicking the last "next" wraps to the first slide.
- **Edge cases to handle:** single image (hide controls), empty array, autoplay timer cleanup, rapid clicking, index bounds.
- **Evaluation criteria:** Timer management, index arithmetic (modulo), a11y for controls, clean pause/resume.
- **Hint (optional):** Modulo arithmetic on the index gives you free wrap-around in both directions.

### 8. Form with Validation  —  Medium
- **Topic / Pattern:** Controlled inputs / validation state
- **Requirements:** Build a signup form with fields (name, email, password, confirm) that validates on blur and on submit, showing per-field errors.
- **Constraints:** No form library (build the state/validation yourself); disable submit until valid; React + TS.
- **Expected features / component API:** field config with validators; `onSubmit(values)` only fires when valid.
- **Expected features (MoSCoW):**
  - Must: per-field validation, error messages, blur + submit validation, block invalid submit.
  - Should: cross-field validation (password === confirm), touched-state tracking.
  - Could: async validation (email taken), reusable `useForm` hook.
  - Won't: schema-lib integration.
- **Acceptance scenario:** Submitting with an invalid email shows "Enter a valid email" under that field and does not call `onSubmit`; fixing it and submitting calls `onSubmit` with the values.
- **Edge cases to handle:** untouched fields on submit (validate all), whitespace-only input, password/confirm mismatch, re-validation after fix.
- **Evaluation criteria:** Validation architecture, touched vs dirty vs error state modeling, accessibility of error messaging.
- **Hint (optional):** Separate `values`, `errors`, and `touched` maps; show an error only when touched or after submit.

### 9. Debounced Search / Autocomplete  —  Medium
- **Topic / Pattern:** Debounce / async race handling
- **Requirements:** Build a search input that queries a mock API as the user types, showing a dropdown of suggestions.
- **Constraints:** Debounce input, cancel/ignore stale responses, keyboard-navigable results; React + TS.
- **Expected features / component API:** `<Autocomplete fetchSuggestions={(q)=>Promise<Item[]>} onSelect />`.
- **Expected features (MoSCoW):**
  - Must: debounce, show results, select via click, loading state.
  - Should: keyboard Up/Down/Enter/Escape, ignore out-of-order responses.
  - Could: highlight matched substring, recent searches, ARIA combobox roles.
  - Won't: server-side ranking.
- **Acceptance scenario:** Typing "re" then quickly "rea" issues at most one settled request for the final term; if the "re" response arrives late it is discarded and only "rea" results show.
- **Edge cases to handle:** empty query clears results, request failure, selection then continued typing, debounce timer cleanup.
- **Evaluation criteria:** Debounce correctness, stale-response handling (request id/AbortController), keyboard a11y.
- **Hint (optional):** Tag each request and only apply results whose tag matches the latest query.

### 10. Kanban Board (drag & drop)  —  Hard
- **Topic / Pattern:** Drag-and-drop / normalized state
- **Requirements:** Build a Kanban board with columns and cards where cards can be dragged between and reordered within columns.
- **Constraints:** Use native HTML5 drag-and-drop (no dnd library); persist order in state; React + TS.
- **Expected features / component API:** `columns: {id,title,cardIds[]}`, `cards: Record<id,Card>`; add-card per column.
- **Expected features (MoSCoW):**
  - Must: render columns/cards, drag card to another column, reorder within a column, add new card.
  - Should: drop-position indicator, edit/delete card.
  - Could: persist to localStorage, WIP limits per column, keyboard reordering.
  - Won't: multi-board, real-time sync (see Full-Stack).
- **Acceptance scenario:** Dragging "Task 3" from Todo and dropping it between two cards in Doing removes it from Todo and inserts it at the drop index in Doing; state reflects the new order.
- **Edge cases to handle:** drop onto empty column, drop at start/end, drop onto itself (no-op), drag cancel (Escape/outside), duplicate ids.
- **Evaluation criteria:** State normalization, drop-index calculation, immutable updates, DnD event handling correctness.
- **Hint (optional):** Store card order as arrays of ids per column and compute the insertion index from the hovered card.

### 11. Virtualized List  —  Hard
- **Topic / Pattern:** Windowing / performance
- **Requirements:** Render a list of 10,000+ items but only mount the DOM nodes currently in view (plus a small overscan).
- **Constraints:** Fixed row height first; no virtualization library; smooth scrolling; React + TS.
- **Expected features / component API:** `<VirtualList itemCount={number} itemHeight={number} height={number} renderItem={(index)=>node} />`.
- **Expected features (MoSCoW):**
  - Must: render only visible rows, correct total scroll height, correct absolute positioning, overscan.
  - Should: handle container resize, scroll-to-index method.
  - Could: variable/dynamic row heights, horizontal variant.
  - Won't: grid virtualization.
- **Acceptance scenario:** With 10,000 items and a 400px viewport, the DOM contains only ~15–20 rows at any time; scrolling reveals later items without jank and total scrollbar height matches `itemCount * itemHeight`.
- **Edge cases to handle:** itemCount of 0, viewport taller than content, fast scroll jumps, off-by-one at boundaries, resize.
- **Evaluation criteria:** Correct visible-range math, spacer/offset technique, performance (no full-list render), boundary correctness.
- **Hint (optional):** startIndex = floor(scrollTop / itemHeight); render a slice and translate it by startIndex * itemHeight.

### 12. Nested Comments Thread  —  Hard
- **Topic / Pattern:** Recursion / tree state
- **Requirements:** Build a threaded comment component supporting arbitrarily deep replies, with add/reply/delete and collapse per node.
- **Constraints:** Recursive rendering; immutable tree updates; React + TS.
- **Expected features / component API:** `comments: {id, text, author, children[]}[]`; actions: reply(parentId), delete(id), collapse(id).
- **Expected features (MoSCoW):**
  - Must: render nested tree, reply to any node, delete node (and descendants), collapse/expand subtree.
  - Should: reply count, indentation by depth, edit comment.
  - Could: sort (newest/top), upvote, max-depth flattening.
  - Won't: server persistence.
- **Acceptance scenario:** Replying to a 2nd-level comment inserts the new comment as its child; deleting a parent removes it and all descendants; collapsing hides the subtree while keeping the node visible.
- **Edge cases to handle:** deleting root vs leaf, deep nesting performance, empty thread, editing while replying, id generation.
- **Evaluation criteria:** Recursive component design, immutable tree traversal/update, key stability, clear action handlers.
- **Hint (optional):** A recursive `updateNode(tree, id, fn)` helper keeps add/delete/edit logic in one place.

## Backend

### 13. CRUD REST API for Tasks  —  Easy
- **Topic / Pattern:** REST / Express routing
- **Requirements:** Build a REST API for a `Task` resource supporting create, read (one + list), update, and delete.
- **Constraints:** Node + Express + TypeScript; in-memory store or Prisma+SQLite; proper HTTP status codes; JSON bodies.
- **Expected features / endpoints:** `POST /tasks`, `GET /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id`.
- **Expected features (MoSCoW):**
  - Must: all five endpoints, correct status codes (201/200/204/404), request body validation.
  - Should: centralized error handler, input validation library or manual guards.
  - Could: soft delete, timestamps, partial update semantics.
  - Won't: auth, pagination (separate problem).
- **Acceptance scenario:** `POST /tasks {title:"Buy milk"}` returns 201 with the created task including an id; `GET /tasks/:id` on a missing id returns 404 with a JSON error body.
- **Edge cases to handle:** missing required fields, invalid id format, updating nonexistent resource, empty list, malformed JSON.
- **Evaluation criteria:** RESTful design, status-code correctness, validation, error-response consistency, layering (route/service).
- **Hint (optional):** Route handlers should be thin; push storage logic into a service module.

### 14. Pagination, Filtering & Sorting  —  Easy
- **Topic / Pattern:** Query params / DB querying
- **Requirements:** Extend a list endpoint to support pagination, filtering by fields, and sorting via query parameters.
- **Constraints:** Node + Express + Prisma; cap page size; validate/whitelist sort and filter fields; TypeScript.
- **Expected features / endpoints:** `GET /products?page=&limit=&sort=price:desc&category=books&minPrice=`.
- **Expected features (MoSCoW):**
  - Must: offset pagination with total count, one-field sort, at least two filters, page-size cap.
  - Should: multi-field filter, sort direction parsing, metadata (total, page, pages).
  - Could: cursor-based pagination, full-text search param.
  - Won't: aggregation endpoints.
- **Acceptance scenario:** `GET /products?page=2&limit=10&sort=price:desc&category=books` returns items 11–20 of books sorted by price descending, plus `{ total, page, limit, totalPages }`.
- **Edge cases to handle:** page beyond range (empty items, valid meta), limit above cap, invalid sort field (reject/ignore), negative/zero page, unknown filter keys.
- **Evaluation criteria:** Field whitelisting (injection safety), consistent metadata, sensible defaults, query-param parsing robustness.
- **Hint (optional):** Whitelist sortable/filterable fields to a fixed allow-list before building the query.

### 15. File Upload Service  —  Easy
- **Topic / Pattern:** Multipart handling / streams
- **Requirements:** Build an endpoint that accepts file uploads, validates them, stores them, and returns a retrievable URL.
- **Constraints:** Node + Express + multer (or manual multipart); limit file size and MIME types; TypeScript.
- **Expected features / endpoints:** `POST /files` (multipart), `GET /files/:id`, `DELETE /files/:id`.
- **Expected features (MoSCoW):**
  - Must: accept upload, size limit, MIME whitelist, store to disk, return id/URL, serve file.
  - Should: unique stored filenames, delete endpoint, metadata record.
  - Could: image thumbnail generation, checksum dedupe, streaming download.
  - Won't: cloud/S3 integration.
- **Acceptance scenario:** Uploading a 2MB PNG returns 201 with a file id and URL; uploading a 20MB file (over the 10MB cap) returns 413; `GET /files/:id` streams the stored file back.
- **Edge cases to handle:** no file in request, disallowed MIME type, oversize file, duplicate filenames, missing file on GET.
- **Evaluation criteria:** Validation before persistence, safe filename handling (no path traversal), correct status codes, stream usage.
- **Hint (optional):** Never trust the client-provided filename for the on-disk path.

### 16. Token Bucket Rate Limiter  —  Medium
- **Topic / Pattern:** Middleware / algorithms
- **Requirements:** Build Express middleware that limits each client to N requests per window using a token-bucket (or sliding-window) algorithm.
- **Constraints:** Key by IP or API key; Redis-backed (or in-memory with clear interface); return standard rate-limit headers; TypeScript.
- **Expected features / endpoints:** `rateLimit({ capacity, refillPerSec, keyBy })` middleware.
- **Expected features (MoSCoW):**
  - Must: allow up to limit, reject excess with 429, per-key isolation, `Retry-After` / `X-RateLimit-*` headers.
  - Should: Redis store for multi-instance, configurable window/capacity.
  - Could: sliding-window log variant, per-route limits, burst allowance.
  - Won't: distributed consensus.
- **Acceptance scenario:** With capacity 5/minute, the 6th request within a minute from the same key returns 429 with `Retry-After`; after the window refills, requests succeed again.
- **Edge cases to handle:** concurrent requests racing on the same bucket, clock skew, first request (empty bucket), key extraction when IP missing, Redis unavailable fallback.
- **Evaluation criteria:** Algorithm correctness, atomicity of counter updates, header accuracy, pluggable store abstraction.
- **Hint (optional):** Redis atomic ops (INCR+EXPIRE or a Lua script) avoid the read-modify-write race.

### 17. URL Shortener Service  —  Medium
- **Topic / Pattern:** Hashing / encoding / redirects
- **Requirements:** Build a service that shortens long URLs into short codes and redirects short codes to their originals.
- **Constraints:** Node + Express + Prisma; collision-safe code generation; 301/302 redirect; TypeScript.
- **Expected features / endpoints:** `POST /shorten {url}` -> `{code, shortUrl}`; `GET /:code` -> redirect.
- **Expected features (MoSCoW):**
  - Must: create short code, store mapping, redirect on GET, validate input URL.
  - Should: idempotent shortening of same URL, custom alias support, 404 for unknown code.
  - Could: expiry dates, click counting, base62 encoding of an id.
  - Won't: analytics dashboard (see Full-Stack).
- **Acceptance scenario:** `POST /shorten {url:"https://example.com/very/long"}` returns a code like `ab3Xz9`; visiting `GET /ab3Xz9` issues a redirect to the original URL; unknown code returns 404.
- **Edge cases to handle:** invalid/non-http URL, custom alias collision, very long URLs, duplicate submissions, code case-sensitivity.
- **Evaluation criteria:** Collision handling, URL validation, redirect correctness, encoding scheme choice.
- **Hint (optional):** Base62-encoding an auto-increment id sidesteps random collisions entirely.

### 18. Auth Service (JWT + Refresh Tokens)  —  Medium
- **Topic / Pattern:** Authentication / token rotation
- **Requirements:** Build register/login endpoints issuing a short-lived access token and a refresh token, plus a protected route and logout.
- **Constraints:** Hash passwords (bcrypt/argon2); sign JWTs; store/rotate refresh tokens; TypeScript.
- **Expected features / endpoints:** `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me` (protected).
- **Expected features (MoSCoW):**
  - Must: hashed passwords, JWT access token, refresh endpoint, auth middleware protecting `/me`.
  - Should: refresh-token rotation + revocation on logout, expiry handling (401 on expired).
  - Could: refresh-token reuse detection, roles in token, httpOnly cookie delivery.
  - Won't: OAuth/social login, email verification.
- **Acceptance scenario:** Login returns access + refresh tokens; `GET /me` with a valid access token returns the user; after access expiry, `POST /refresh` yields a new access token; logout invalidates the refresh token so subsequent refresh returns 401.
- **Edge cases to handle:** wrong password, duplicate registration, expired/tampered token, reused revoked refresh token, missing Authorization header.
- **Evaluation criteria:** Password hashing, token lifecycle/rotation, middleware design, no secret leakage, correct 401 vs 403.
- **Hint (optional):** Persist refresh tokens server-side so logout can actually revoke them.

### 19. Webhook Receiver with Idempotency  —  Medium
- **Topic / Pattern:** Idempotency / signature verification
- **Requirements:** Build an endpoint that receives webhook events, verifies their signature, and processes each event exactly once despite retries.
- **Constraints:** Verify HMAC signature from a header; dedupe by event id; return fast; TypeScript.
- **Expected features / endpoints:** `POST /webhooks/provider` with `X-Signature` and event `id`.
- **Expected features (MoSCoW):**
  - Must: HMAC verification (reject 401 on mismatch), idempotent processing keyed by event id, 200 ack.
  - Should: store processed event ids, replay-safe (return 200 without reprocessing), timestamp tolerance check.
  - Could: async processing via queue, per-event-type handlers, dead-letter on failure.
  - Won't: multi-provider signature schemes.
- **Acceptance scenario:** Sending the same event id twice processes the side effect only once; the second delivery returns 200 without re-running it; a payload with a bad signature returns 401.
- **Edge cases to handle:** missing signature header, replayed old timestamp, malformed body, concurrent duplicate deliveries, unknown event type.
- **Evaluation criteria:** Constant-time signature compare, idempotency store design, concurrency safety, fast acknowledgement.
- **Hint (optional):** Record each processed event id in a unique-constrained table; a duplicate insert error means "already handled".

### 20. Caching Layer (cache-aside)  —  Medium
- **Topic / Pattern:** Caching / invalidation
- **Requirements:** Add a Redis cache-aside layer in front of an expensive read endpoint, with TTL and invalidation on writes.
- **Constraints:** Node + Express + Redis; configurable TTL; invalidate/refresh on mutation; TypeScript.
- **Expected features / endpoints:** `GET /items/:id` (cached), `PUT /items/:id` (invalidates).
- **Expected features (MoSCoW):**
  - Must: read-through cache with TTL, cache hit/miss handling, invalidate on update/delete.
  - Should: cache key strategy, serialize/deserialize, stampede guard.
  - Could: metrics (hit ratio), stale-while-revalidate, list-cache invalidation.
  - Won't: distributed cache coherence protocols.
- **Acceptance scenario:** First `GET /items/1` misses cache and hits the DB; the second `GET` is served from cache; a `PUT /items/1` invalidates the key so the next `GET` re-fetches from the DB.
- **Edge cases to handle:** cache miss vs stored-null, TTL expiry mid-request, Redis down (fallback to source), concurrent misses (thundering herd), serialization of dates.
- **Evaluation criteria:** Correct cache-aside flow, invalidation completeness, graceful degradation, key design.
- **Hint (optional):** Distinguish "not in cache" from "cached value is null" to avoid re-querying known-empty results incorrectly.

### 21. RBAC Authorization  —  Medium
- **Topic / Pattern:** Authorization / middleware
- **Requirements:** Implement role-based access control so endpoints require specific roles/permissions.
- **Constraints:** Roles map to permissions; middleware enforces per-route; assumes an authenticated user; TypeScript.
- **Expected features / endpoints:** `requirePermission('post:delete')` middleware; roles like admin/editor/viewer.
- **Expected features (MoSCoW):**
  - Must: role->permission mapping, middleware guard, 403 on insufficient permission, 401 when unauthenticated.
  - Should: multiple roles per user, permission-based (not just role-based) checks.
  - Could: resource ownership checks (owner can edit own), hierarchical roles.
  - Won't: policy DSL / external policy engine.
- **Acceptance scenario:** A viewer calling `DELETE /posts/:id` (guarded by `post:delete`) gets 403; an admin with that permission gets 200; an unauthenticated request gets 401.
- **Edge cases to handle:** user with no roles, unknown permission string, role changes mid-session, ownership vs role conflict, missing user context.
- **Evaluation criteria:** Clean permission model, reusable middleware, correct 401 vs 403 distinction, extensibility.
- **Hint (optional):** Resolve a user's effective permission set once, then check membership per route.

### 22. Background Job Queue  —  Hard
- **Topic / Pattern:** Async processing / workers
- **Requirements:** Build a job queue where jobs are enqueued via an API and processed by a worker with retries and backoff.
- **Constraints:** Redis-backed queue (or documented in-memory); at-least-once processing; retry with backoff; TypeScript.
- **Expected features / endpoints:** `POST /jobs {type,payload}`; worker loop; `GET /jobs/:id` status.
- **Expected features (MoSCoW):**
  - Must: enqueue, worker consumes and processes, status tracking (pending/active/done/failed), retry on failure.
  - Should: exponential backoff, max-attempts then dead-letter, concurrency control.
  - Could: delayed/scheduled jobs, priorities, graceful shutdown draining.
  - Won't: cron scheduling UI, multi-queue routing.
- **Acceptance scenario:** Enqueuing a job that fails twice then succeeds shows attempts incrementing with backoff and a final `done` status; a job that always fails lands in `failed`/dead-letter after max attempts.
- **Edge cases to handle:** worker crash mid-job (visibility/re-delivery), duplicate processing, poison messages, empty queue polling, shutdown while jobs in flight.
- **Evaluation criteria:** At-least-once semantics, retry/backoff correctness, worker/queue separation, failure isolation.
- **Hint (optional):** Track attempt count on the job and compute the next delay as base * 2^attempt.

### 23. Inventory Reservation with Transactions  —  Hard
- **Topic / Pattern:** DB transactions / concurrency
- **Requirements:** Build an endpoint that reserves stock for an order atomically, preventing overselling under concurrent requests.
- **Constraints:** Node + Prisma with transactions; handle race conditions (locking or conditional update); TypeScript.
- **Expected features / endpoints:** `POST /orders {items:[{sku,qty}]}`; decrements stock atomically.
- **Expected features (MoSCoW):**
  - Must: transactional multi-item reservation, reject if any item insufficient (all-or-nothing), no negative stock.
  - Should: concurrency safety (row lock or conditional `WHERE stock >= qty`), clear conflict error.
  - Could: reservation expiry/release, restock endpoint, optimistic-lock version field.
  - Won't: distributed transactions across services.
- **Acceptance scenario:** Two concurrent orders each requesting the last 1 unit of a SKU result in exactly one success and one 409/conflict; total stock never goes negative; a multi-item order fails wholly if any single item is short.
- **Edge cases to handle:** partial availability, zero/negative quantities, unknown SKU, deadlocks/retries, concurrent decrements of the same row.
- **Evaluation criteria:** Transaction correctness, race-condition prevention, atomic all-or-nothing behavior, meaningful error responses.
- **Hint (optional):** A conditional update `UPDATE ... SET stock=stock-:qty WHERE stock>=:qty` that affects 0 rows signals insufficient stock without a separate read.

### 24. Notification Service (multi-channel + retry)  —  Hard
- **Topic / Pattern:** Strategy pattern / async dispatch
- **Requirements:** Build a service that sends notifications across pluggable channels (email/SMS/push mocked) based on user preferences, with delivery tracking and retry.
- **Constraints:** Channel adapters behind a common interface; respect per-user preferences; retry failed sends; TypeScript.
- **Expected features / endpoints:** `POST /notify {userId, template, data, channels?}`; `GET /notifications/:id`.
- **Expected features (MoSCoW):**
  - Must: pluggable channel adapters, template rendering, respect user channel prefs, per-delivery status.
  - Should: retry on channel failure, fan-out to multiple channels, opt-out handling.
  - Could: async via queue, rate limiting per user, digest batching.
  - Won't: real provider integrations.
- **Acceptance scenario:** `POST /notify` for a user who prefers email+push renders the template and dispatches to both channels; if the push adapter throws, it is retried and its per-channel status reflects success/failure independently of email.
- **Edge cases to handle:** user with no channels enabled, unknown template, one channel failing while others succeed, duplicate notification suppression, invalid userId.
- **Evaluation criteria:** Adapter/strategy design, per-channel independent status, retry handling, preference resolution, extensibility for new channels.
- **Hint (optional):** Define one `Channel` interface (`send(msg): Promise<Result>`) and register adapters in a map keyed by channel name.

## Full-Stack

### 25. Notes App  —  Easy
- **Topic / Pattern:** CRUD full-stack / client-server
- **Requirements:** Build a notes app: create, list, edit, and delete notes, with a React frontend talking to an Express/Prisma backend.
- **Constraints:** React + TS frontend, Express + Prisma backend, REST API; persist to a DB; handle loading/error UI.
- **Expected features / API:** `GET/POST /notes`, `GET/PATCH/DELETE /notes/:id`; frontend list + editor views.
- **Expected features (MoSCoW):**
  - Must: create/list/edit/delete notes end-to-end, persistence, loading & error states.
  - Should: search/filter notes, autosave or explicit save, timestamps.
  - Could: markdown preview, tags, optimistic UI updates.
  - Won't: auth, real-time sync.
- **Acceptance scenario:** Creating a note POSTs it and it appears in the list; editing and saving PATCHes it and persists across reload; deleting removes it from DB and UI.
- **Edge cases to handle:** empty note title/body, deleting the currently open note, network failure on save, concurrent edits (last write wins), empty list state.
- **Evaluation criteria:** End-to-end data flow, API/UI error handling, state sync between client and server, clean component/route separation.
- **Hint (optional):** Keep the server the source of truth and refetch (or reconcile) after mutations.

### 26. Expense Tracker  —  Easy
- **Topic / Pattern:** CRUD + aggregation
- **Requirements:** Build an expense tracker where users add categorized expenses and see totals per category and overall.
- **Constraints:** React + TS + Express + Prisma; compute aggregates on the backend; TypeScript throughout.
- **Expected features / API:** `POST /expenses`, `GET /expenses?month=`, `GET /summary?month=`.
- **Expected features (MoSCoW):**
  - Must: add expense (amount, category, date), list by month, per-category and total summary.
  - Should: delete expense, month navigation, input validation (positive amount).
  - Could: simple chart, budget limits with warnings, CSV export.
  - Won't: multi-currency, auth.
- **Acceptance scenario:** Adding a $20 "Food" and $30 "Transport" expense for July shows a July total of $50 and category breakdown of Food $20 / Transport $30; deleting the Food expense updates both instantly.
- **Edge cases to handle:** zero/negative amounts, expense with no category, month with no expenses, floating-point money rounding, timezone/date boundaries.
- **Evaluation criteria:** Correct aggregation, money handling (avoid float errors), month filtering correctness, UI/data sync.
- **Hint (optional):** Store money in integer cents to avoid floating-point rounding surprises.

### 27. URL Shortener with Analytics  —  Medium
- **Topic / Pattern:** Redirects + event tracking full-stack
- **Requirements:** Extend a URL shortener with a frontend to create links and a dashboard showing per-link click analytics.
- **Constraints:** React + TS + Express + Prisma; record click events on redirect; TypeScript.
- **Expected features / API:** `POST /links`, `GET /links` (with counts), `GET /:code` (redirect + log), `GET /links/:id/stats`.
- **Expected features (MoSCoW):**
  - Must: create link via UI, redirect works, count clicks, dashboard listing links with totals.
  - Should: per-link stats view (clicks over time), referrer capture, copy-to-clipboard.
  - Could: geo/device breakdown, QR code, custom alias.
  - Won't: user accounts, cross-domain tracking.
- **Acceptance scenario:** Creating a link in the UI returns a short URL; visiting it three times redirects each time and logs 3 clicks; the dashboard shows that link with a click count of 3 and a stats view of clicks over time.
- **Edge cases to handle:** redirect must still work if analytics logging fails, bot/duplicate clicks, unknown code, high-frequency clicks, timezone in charts.
- **Evaluation criteria:** Non-blocking analytics logging, correct aggregation, redirect reliability, clean dashboard data flow.
- **Hint (optional):** Log the click asynchronously so analytics failures never block the redirect.

### 28. Real-Time Chat  —  Medium
- **Topic / Pattern:** WebSockets / real-time
- **Requirements:** Build a chat app with rooms where messages broadcast to all connected clients in real time and history persists.
- **Constraints:** React + TS frontend, Express + Socket.IO (or ws) backend, Prisma for history; TypeScript.
- **Expected features / API:** WS events `join`, `message`, `message:new`; `GET /rooms/:id/messages` for history.
- **Expected features (MoSCoW):**
  - Must: join a room, send message, real-time broadcast to room members, load history on join.
  - Should: usernames, typing indicator, message timestamps, reconnect handling.
  - Could: online-user list, read receipts, optimistic send with ack.
  - Won't: private/DM, media attachments, E2E encryption.
- **Acceptance scenario:** Two browser tabs join "general"; a message sent from tab A appears in tab B within a second without refresh; reloading tab B shows the persisted history including that message.
- **Edge cases to handle:** message sent before join, disconnect/reconnect, duplicate delivery, empty message, room with no history, connection drop mid-send.
- **Evaluation criteria:** Real-time correctness, room scoping of broadcasts, history persistence + hydration, reconnection resilience.
- **Hint (optional):** Persist first, then broadcast, and namespace broadcasts by room id.

### 29. Live Polls with Results  —  Medium
- **Topic / Pattern:** Real-time aggregation
- **Requirements:** Build a polling app where users vote on a poll and everyone sees live-updating result bars.
- **Constraints:** React + TS + Express + Prisma + WebSockets; one vote per user/session; TypeScript.
- **Expected features / API:** `POST /polls`, `GET /polls/:id`, `POST /polls/:id/vote`, WS `results:update`.
- **Expected features (MoSCoW):**
  - Must: create poll with options, vote, live result percentages broadcast to viewers, prevent double-vote per session.
  - Should: total-votes count, result bar UI, close/lock poll.
  - Could: multiple-choice polls, expiry, share link.
  - Won't: authenticated identity, weighted votes.
- **Acceptance scenario:** Two clients view a poll; when client A votes "Option 1", both clients' result bars update live to reflect the new tally; client A voting again is rejected and does not change the count.
- **Edge cases to handle:** double-voting, voting on a closed poll, poll with zero votes (avoid divide-by-zero in %), unknown option, concurrent votes on same option.
- **Evaluation criteria:** Live aggregation correctness, double-vote prevention, percentage math, broadcast scoping.
- **Hint (optional):** Guard the percentage calculation against a zero total to avoid NaN.

### 30. Kanban Board (persisted, full-stack)  —  Medium
- **Topic / Pattern:** Full-stack DnD + persistence
- **Requirements:** Build a Kanban board where columns and cards persist to a backend and drag-drop reordering is saved.
- **Constraints:** React + TS frontend, Express + Prisma backend; persist order (position field); optimistic UI; TypeScript.
- **Expected features / API:** `GET /board`, `POST /cards`, `PATCH /cards/:id` (move/reorder), `DELETE /cards/:id`.
- **Expected features (MoSCoW):**
  - Must: load board from server, add/edit/delete card, drag between/within columns, persist new position.
  - Should: optimistic update with rollback on failure, stable ordering (position field).
  - Could: add/rename columns, WIP limits, activity log.
  - Won't: real-time multi-user sync (that's the collaborative editor).
- **Acceptance scenario:** Dragging a card to another column and reloading the page shows it still in the new column at the correct position; if the move request fails, the UI rolls back to the original position.
- **Edge cases to handle:** reorder persistence gaps, concurrent moves, failed PATCH (rollback), empty column drops, position collisions.
- **Evaluation criteria:** Ordering persistence strategy, optimistic-update correctness with rollback, API design for moves, data consistency.
- **Hint (optional):** A fractional or gap-based position value lets you insert between cards without renumbering everything.

### 31. Blog with Comments  —  Medium
- **Topic / Pattern:** Relational data / nested resources
- **Requirements:** Build a blog where posts can be created and read, and readers can comment on posts.
- **Constraints:** React + TS + Express + Prisma; relational posts/comments; server-side validation; TypeScript.
- **Expected features / API:** `GET/POST /posts`, `GET /posts/:id`, `POST /posts/:id/comments`, `GET /posts/:id/comments`.
- **Expected features (MoSCoW):**
  - Must: create/list/read posts, add/list comments per post, validation.
  - Should: pagination for posts and comments, comment count on list, timestamps.
  - Could: markdown post body, nested replies, edit/delete own comment.
  - Won't: auth (or stub author names), moderation queue.
- **Acceptance scenario:** Creating a post makes it appear in the list and openable at its detail page; posting a comment on it persists and shows under that post; the list view shows the updated comment count.
- **Edge cases to handle:** comment on nonexistent post, empty comment, very long post body, post with zero comments, pagination boundaries.
- **Evaluation criteria:** Relational modeling, nested-resource API design, validation, pagination correctness, client/server data flow.
- **Hint (optional):** Model the comment->post relation with a foreign key and validate the post exists before inserting.

### 32. Booking / Reservation System  —  Hard
- **Topic / Pattern:** Availability + conflict prevention
- **Requirements:** Build a booking system where users reserve time slots for a resource and double-bookings are prevented.
- **Constraints:** React + TS + Express + Prisma with transactions; enforce no overlapping bookings; TypeScript.
- **Expected features / API:** `GET /resources/:id/availability?date=`, `POST /bookings`, `DELETE /bookings/:id`.
- **Expected features (MoSCoW):**
  - Must: show availability, create booking, reject overlapping/conflicting slots atomically, cancel booking.
  - Should: transactional conflict check, timezone-consistent slots, booking confirmation UI.
  - Could: recurring bookings, buffer time between bookings, email/notification stub.
  - Won't: payment, multi-resource optimization.
- **Acceptance scenario:** Two users try to book the 2–3pm slot for the same room simultaneously; exactly one succeeds and the other receives a conflict error; the availability view then shows 2–3pm as taken.
- **Edge cases to handle:** overlapping-edge slots (end == start), timezone/DST boundaries, concurrent bookings of same slot, cancel then rebook, past-date booking rejection.
- **Evaluation criteria:** Overlap detection correctness, transactional conflict prevention, timezone handling, availability computation accuracy.
- **Hint (optional):** Detect overlap with `newStart < existingEnd AND newEnd > existingStart`, enforced inside a transaction.

### 33. E-commerce Cart & Checkout  —  Hard
- **Topic / Pattern:** Cart state + transactional checkout
- **Requirements:** Build a product catalog with a cart and a checkout that creates an order, decrementing stock atomically.
- **Constraints:** React + TS + Express + Prisma; cart persists per session; checkout is transactional; TypeScript.
- **Expected features / API:** `GET /products`, cart endpoints (`POST/PATCH/DELETE /cart/items`), `POST /checkout`.
- **Expected features (MoSCoW):**
  - Must: browse products, add/update/remove cart items, cart totals, checkout creating an order and decrementing stock atomically.
  - Should: stock validation at checkout (reject if insufficient), order summary/confirmation, quantity limits.
  - Could: coupon/discount codes, guest vs saved cart, tax/shipping calc.
  - Won't: real payment gateway, inventory across warehouses.
- **Acceptance scenario:** A user adds 2 of a product with stock 3 and checks out; the order is created, stock drops to 1, and the cart clears; if another item in the cart is out of stock, the whole checkout is rejected and no stock is decremented.
- **Edge cases to handle:** item goes out of stock between add and checkout, quantity exceeding stock, empty cart checkout, concurrent checkouts of same item, price changes mid-session.
- **Evaluation criteria:** Transactional all-or-nothing checkout, stock-consistency under concurrency, cart/total correctness, clean API separation.
- **Hint (optional):** Re-validate and decrement stock inside the checkout transaction, not when adding to the cart.

### 34. Collaborative To-Do (real-time multi-user)  —  Hard
- **Topic / Pattern:** Real-time sync / conflict handling
- **Requirements:** Build a shared to-do list where multiple users see each other's add/toggle/delete/edit changes live.
- **Constraints:** React + TS + Express + WebSockets + Prisma; broadcast changes; handle concurrent edits; TypeScript.
- **Expected features / API:** REST for load/persist + WS events `todo:add|update|delete` broadcast to a shared list room.
- **Expected features (MoSCoW):**
  - Must: shared list loads from DB, add/toggle/delete broadcast live to all clients, persist changes.
  - Should: presence (who's online), last-write-wins conflict resolution, reconnect resync.
  - Could: per-item edit locking, optimistic updates with reconciliation, change attribution.
  - Won't: full CRDT/OT, offline-first sync.
- **Acceptance scenario:** Two clients open the same list; when client A toggles an item complete, client B sees it toggle within a second without refresh; both clients reflect a delete made by either party, and a reload reproduces the persisted state.
- **Edge cases to handle:** simultaneous edits to same item (LWW), client disconnect/reconnect resync, event ordering, duplicate broadcasts, editing a just-deleted item.
- **Evaluation criteria:** Real-time sync correctness, conflict-resolution strategy, persistence consistency, reconnection handling.
- **Hint (optional):** Persist authoritative state server-side and broadcast the applied change so late/duplicate events converge.

### 35. Analytics Dashboard  —  Hard
- **Topic / Pattern:** Aggregation + querying + charts
- **Requirements:** Build a dashboard that ingests events and displays aggregated metrics (counts, trends, breakdowns) with date-range filtering.
- **Constraints:** React + TS + Express + Prisma; server-side aggregation; charts without heavy dependency; TypeScript.
- **Expected features / API:** `POST /events`, `GET /metrics/summary?from=&to=`, `GET /metrics/timeseries?metric=&interval=`.
- **Expected features (MoSCoW):**
  - Must: ingest events, summary metrics (totals/uniques), time-series over a date range, date-range filter UI.
  - Should: group-by dimension breakdown, interval bucketing (day/hour), loading/empty states.
  - Could: caching of expensive aggregates, CSV export, comparison to previous period.
  - Won't: streaming/real-time ingestion, ML forecasting.
- **Acceptance scenario:** Posting 100 events across three days and selecting a "last 7 days" range shows a total of 100, a daily time-series with the correct per-day counts, and a breakdown by event type that sums to 100.
- **Edge cases to handle:** empty range (no data), timezone bucketing, large result sets, missing dimension values, inclusive/exclusive range boundaries.
- **Evaluation criteria:** Aggregation query correctness, bucketing/timezone handling, performance on larger datasets, clear chart data contract.
- **Hint (optional):** Do the grouping/bucketing in the database query, not in JavaScript over the full event list.

### 36. Feature-Flagged Settings Service  —  Hard
- **Topic / Pattern:** Config management + gradual rollout
- **Requirements:** Build a service and admin UI to define feature flags (boolean, percentage rollout, targeted) and an SDK-style endpoint that evaluates a flag for a given user.
- **Constraints:** React + TS admin frontend + Express + Prisma backend; deterministic percentage rollout; TypeScript.
- **Expected features / API:** `POST/GET/PATCH /flags`, `GET /evaluate?flag=&userId=` -> `{enabled:boolean}`.
- **Expected features (MoSCoW):**
  - Must: create/list/toggle flags, evaluate boolean flag for a user, admin UI to manage flags.
  - Should: percentage rollout (deterministic per user), targeted user/segment overrides.
  - Could: flag history/audit log, caching of evaluations, kill-switch, prerequisite flags.
  - Won't: multi-environment promotion, A/B analytics.
- **Acceptance scenario:** Setting a flag to 50% rollout, evaluating it for the same userId repeatedly always returns the same result; across many userIds roughly half return `enabled:true`; an explicit target override for a specific user always wins over the percentage.
- **Edge cases to handle:** unknown flag (default off), 0% and 100% rollouts, missing userId, override vs percentage precedence, flag disabled globally (kill switch).
- **Evaluation criteria:** Deterministic hashing for stable rollout, evaluation precedence rules, clean flag data model, admin/eval API separation.
- **Hint (optional):** Hash `flagKey + userId` to a stable number in [0,100) and compare against the rollout percentage for consistency.
