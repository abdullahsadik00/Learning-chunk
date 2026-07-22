// ═══════════════════════════════════════════════════════════
// CHALLENGE C01: ARRAYS & STRINGS
// Run: npm run challenge:01  |  Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Implement the core array/string interview patterns
//          from 01-arrays-strings.ts — two-pointer, sliding
//          window, hashmap complement, and frequency counting.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper functions.
//  • Run `npm run challenge:01` to check your work.

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// EXERCISE 1 — Two Sum (unsorted, hashmap complement trick)
// ══════════════════════════════════════════════════════════
// Given an unsorted array and a target, return the indices of the
// two numbers that add up to target. Exactly one solution exists.
// Return them as [i, j] with i < j. If none, return [-1, -1].
// Target: O(n) using a Map (value → index).
export function twoSum(nums: number[], target: number): [number, number] {
  // TODO: scan once; for each nums[i] check if (target - nums[i]) was seen.
  void nums; void target;
  return [-1, -1]; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 2 — Max Sum Subarray of Size K (fixed sliding window)
// ══════════════════════════════════════════════════════════
// Return the maximum sum of any contiguous subarray of length k.
// If k <= 0 or k > nums.length, return 0.
// Target: O(n) — build one window, then slide adding/dropping.
export function maxSubarraySum(nums: number[], k: number): number {
  // TODO: sum the first k, then slide: windowSum += nums[i] - nums[i-k].
  void nums; void k;
  return 0; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 3 — Reverse Array In-Place (two pointers)
// ══════════════════════════════════════════════════════════
// Reverse the given array IN PLACE and also return it.
// Do not allocate a new array. Target: O(n) time, O(1) space.
export function reverseInPlace(nums: number[]): number[] {
  // TODO: swap left/right pointers moving toward the middle.
  return nums; // placeholder (currently returns unreversed)
}

// ══════════════════════════════════════════════════════════
// EXERCISE 4 — Valid Anagram (frequency counting)
// ══════════════════════════════════════════════════════════
// Return true if t is an anagram of s (same characters, same counts).
// Case-sensitive, whole strings. Target: O(n).
export function isAnagram(s: string, t: string): boolean {
  // TODO: if lengths differ return false; else compare char frequencies.
  void s; void t;
  return false; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 5 — Valid Palindrome (two pointers, alphanumeric only)
// ══════════════════════════════════════════════════════════
// Return true if s reads the same forwards and backwards, ignoring
// non-alphanumeric characters and case. Target: O(n), O(1) space.
export function isPalindrome(s: string): boolean {
  // TODO: two pointers from both ends, skip non-alphanumeric, compare lowercased.
  void s;
  return false; // placeholder
}

// ══════════════════════════════════════════════════════════
// EXERCISE 6 — Longest Substring Without Repeating Characters
// ══════════════════════════════════════════════════════════
// Return the length of the longest substring with all unique chars.
// Target: O(n) variable sliding window with a last-seen Map.
export function lengthOfLongestSubstring(s: string): number {
  // TODO: grow right; when a repeat inside the window appears, jump left past it.
  void s;
  return 0; // placeholder
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C01 Arrays & Strings assertions ──");

// twoSum
const ts1 = twoSum([2, 7, 11, 15], 9);
assert(ts1?.[0] === 0 && ts1?.[1] === 1, "twoSum: [2,7,11,15],9 → [0,1]");
const ts2 = twoSum([3, 2, 4], 6);
assert(ts2?.[0] === 1 && ts2?.[1] === 2, "twoSum: [3,2,4],6 → [1,2]");
const ts3 = twoSum([1, 2, 3], 100);
assert(ts3?.[0] === -1 && ts3?.[1] === -1, "twoSum: no solution → [-1,-1]");

// maxSubarraySum
assert(maxSubarraySum([1, 12, -5, -6, 50, 3], 4) === 51, "maxSubarraySum: k=4 → 51");
assert(maxSubarraySum([2, 3], 5) === 0, "maxSubarraySum: k>length → 0");
assert(maxSubarraySum([5, -1, 5], 1) === 5, "maxSubarraySum: k=1 → 5");

// reverseInPlace
const arr = [1, 2, 3, 4, 5];
const rev = reverseInPlace(arr);
assert(JSON.stringify(rev) === "[5,4,3,2,1]", "reverseInPlace: returns reversed");
assert(JSON.stringify(arr) === "[5,4,3,2,1]", "reverseInPlace: mutates in place");
assert(JSON.stringify(reverseInPlace([1, 2])) === "[2,1]", "reverseInPlace: even length");

// isAnagram
assert(isAnagram("anagram", "nagaram") === true, "isAnagram: anagram/nagaram → true");
assert(isAnagram("rat", "car") === false, "isAnagram: rat/car → false");
assert(isAnagram("ab", "abc") === false, "isAnagram: different lengths → false");

// isPalindrome
assert(isPalindrome("A man, a plan, a canal: Panama") === true, "isPalindrome: true case");
assert(isPalindrome("race a car") === false, "isPalindrome: false case");
assert(isPalindrome(" ") === true, "isPalindrome: blank → true");

// lengthOfLongestSubstring
assert(lengthOfLongestSubstring("abcabcbb") === 3, "lengthOfLongestSubstring: abcabcbb → 3");
assert(lengthOfLongestSubstring("bbbbb") === 1, "lengthOfLongestSubstring: bbbbb → 1");
assert(lengthOfLongestSubstring("") === 0, "lengthOfLongestSubstring: empty → 0");

export {};
