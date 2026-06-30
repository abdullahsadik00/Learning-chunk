// ════════════════════════════════════════════════════════
// DSA 01: ARRAYS & STRINGS — PATTERNS FOR INTERVIEWS
// Run: npx ts-node 01-arrays-strings.ts
// ════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
// HOW TO USE THIS FILE
// ─────────────────────────────────────────────────────────
// Each section covers one pattern:
//   1. Why the pattern exists (what problem it solves)
//   2. A reusable template
//   3. 2-3 real interview problems solved with that template
//   4. Time/space complexity for each problem
//   5. A GOTCHA to avoid in interviews
//
// After reading each pattern, predict what the demo will
// print before you run it. That's active recall.
// ─────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════════
// PATTERN 0: BIG O — HOW TO READ TIME AND SPACE COMPLEXITY
// ═══════════════════════════════════════════════════════════════════════
//
// Big O answers the question: "How does runtime grow as input grows?"
// It strips away constants and lower-order terms. You only care about
// the dominant term at large n.
//
// COMPLEXITY CHEAT SHEET (from fastest to slowest):
//
//   O(1)        — does not grow with input. One array lookup, one hashmap get.
//   O(log n)    — cuts the problem in half each step. Binary search.
//   O(n)        — one pass through the data. A single for loop.
//   O(n log n)  — sort. The best you can do for comparison-based sorting.
//   O(n²)       — nested loops. Two pointers that aren't moving together.
//   O(2ⁿ)       — every subset. Avoid in interviews unless asked for it.
//
// HOW TO DERIVE COMPLEXITY FROM CODE:
//   - One loop over n elements → O(n)
//   - Loop inside a loop → O(n²)
//   - Each iteration halves the range → O(log n)
//   - Sort + one pass → O(n log n)
//
// DOMINANT TERM RULE:
//   O(n² + n + 100) → O(n²)  — n² grows so fast it drowns out the rest
//   O(n + log n)    → O(n)
//   O(5n)           → O(n)   — constants are dropped
//
// SPACE COMPLEXITY — what extra memory does your solution use?
//   - Creating a new array of size n → O(n) space
//   - A hashmap with at most n entries → O(n) space
//   - A few variables (left, right, max) → O(1) space
//   - Recursive call stack n levels deep → O(n) space (even without extra arrays)
//
// AMORTIZED ANALYSIS (array append):
//   Appending to a dynamic array is usually O(1), but occasionally O(n)
//   when the array doubles in size. Averaged over many appends: O(1) amortized.
//   This is why push() on a JS array is "O(1)" in practice.
//
// GOTCHA: O(n) isn't always bad. O(1) isn't always possible.
//   A single O(n) scan is perfectly fine for most interviews.
//   If someone asks for O(1) space, they're hinting that the input
//   array itself can be used as scratch space.

function bigODemo(): void {
  console.log("\n--- BIG O DEMO ---");

  // O(1) — constant. No matter how big the array, one step.
  const arr = [1, 2, 3, 4, 5];
  const first = arr[0]; // O(1) time, O(1) space
  console.log("O(1) lookup:", first);

  // O(n) — one pass. Time grows linearly with input.
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]; // n iterations
  }
  console.log("O(n) sum:", sum);

  // O(n²) — nested loops. Every pair of elements.
  const pairs: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      pairs.push(`(${arr[i]},${arr[j]})`);
    }
  }
  console.log("O(n²) pairs count:", pairs.length); // 10 pairs for n=5

  // O(log n) — binary search cuts range in half each time.
  // See Pattern 7 for full implementation.
  console.log("O(log n): see binary search section");
}


// ═══════════════════════════════════════════════════════════════════════
// PATTERN 1: TWO POINTERS
// ═══════════════════════════════════════════════════════════════════════
//
// WHY IT WORKS:
//   Instead of checking every pair (O(n²)), you start one pointer at
//   each end and move them toward each other based on a condition.
//   Because the array is sorted, moving the left pointer up increases
//   the sum; moving the right pointer down decreases it. You converge
//   to the answer in one pass → O(n).
//
// WHEN TO USE:
//   - Problem gives you a sorted array
//   - You need to find a pair (or triplet) meeting a condition
//   - You're checking if a string is a palindrome
//   - You need to remove duplicates in-place
//
// TEMPLATE:
//   let left = 0, right = array.length - 1;
//   while (left < right) {
//     if (condition is met) return answer;
//     else if (need larger value) left++;
//     else right--;
//   }
//
// GOTCHA: Two-pointer pair-sum only works on SORTED arrays.
//   On an unsorted array, use a HashMap (see Pattern 4).

// ── Problem: Two Sum II ─────────────────────────────────────────────
// Given a 1-indexed sorted array, find two numbers that sum to target.
// Return their 1-based indices.
// Time: O(n)  Space: O(1)
//
// WHY: sorted means we can use the two-pointer shortcut.
// If sum < target, the left number is too small → left++
// If sum > target, the right number is too large → right--

function twoSumSorted(numbers: number[], target: number): [number, number] {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left + 1, right + 1]; // 1-indexed
    else if (sum < target) left++;
    else right--;
  }

  return [-1, -1]; // not found (problem guarantees a solution)
}

// ── Problem: Valid Palindrome ────────────────────────────────────────
// A string is a palindrome if it reads the same forwards and backwards,
// ignoring non-alphanumeric characters and case.
// Time: O(n)  Space: O(1)

function isPalindrome(s: string): boolean {
  let left = 0;
  let right = s.length - 1;

  const isAlphanumeric = (c: string): boolean => /[a-zA-Z0-9]/.test(c);

  while (left < right) {
    // Skip non-alphanumeric from the left
    while (left < right && !isAlphanumeric(s[left])) left++;
    // Skip non-alphanumeric from the right
    while (left < right && !isAlphanumeric(s[right])) right--;

    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++;
    right--;
  }

  return true;
}

// ── Problem: Container With Most Water ──────────────────────────────
// Given heights of n vertical lines, find two lines that together with
// the x-axis form a container holding the most water.
// Time: O(n)  Space: O(1)
//
// WHY: The area is min(height[left], height[right]) * (right - left).
// Moving the taller pointer inward can only decrease width AND won't
// increase the bottleneck (the shorter side). So always move the
// SHORTER pointer — it's the only way to possibly find a better area.

function maxWater(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let maxArea = 0;

  while (left < right) {
    const area = Math.min(height[left], height[right]) * (right - left);
    maxArea = Math.max(maxArea, area);

    // Move the shorter pointer — moving the taller one only hurts us
    if (height[left] < height[right]) left++;
    else right--;
  }

  return maxArea;
}

function twoPointerDemo(): void {
  console.log("\n--- TWO POINTERS ---");
  console.log("Two Sum II [2,7,11,15] target=9:", twoSumSorted([2, 7, 11, 15], 9)); // [1,2]
  console.log("Valid Palindrome 'A man a plan a canal Panama':", isPalindrome("A man, a plan, a canal: Panama")); // true
  console.log("Valid Palindrome 'race a car':", isPalindrome("race a car")); // false
  console.log("Container With Most Water [1,8,6,2,5,4,8,3,7]:", maxWater([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49
}


// ═══════════════════════════════════════════════════════════════════════
// PATTERN 2: SLIDING WINDOW
// ═══════════════════════════════════════════════════════════════════════
//
// WHY IT WORKS:
//   For subarray/substring problems, the naive approach tries every
//   possible subarray → O(n²). The sliding window maintains a "window"
//   (a contiguous range) and slides it through the array. Each element
//   enters the window once and leaves once → O(n).
//
// TWO VARIANTS:
//   Fixed window: window size k is given. Slide it right, adding the
//     new element and removing the leftmost element each step.
//   Variable window: grow right freely; shrink from left when constraint
//     is violated. Window size answers the question "longest/shortest."
//
// WHEN TO USE:
//   - "Find max/min/longest/shortest subarray/substring with property X"
//   - "Contiguous elements" is a strong signal
//   - Character frequency constraints (at most k distinct chars, etc.)
//
// FIXED WINDOW TEMPLATE:
//   // Initialize window with first k elements
//   for (let i = k; i < n; i++) {
//     windowSum += arr[i];      // add incoming element
//     windowSum -= arr[i - k];  // drop outgoing element
//     result = Math.max(result, windowSum);
//   }
//
// VARIABLE WINDOW TEMPLATE:
//   let left = 0;
//   for (let right = 0; right < n; right++) {
//     // Expand: add arr[right] to window state
//     while (constraint is violated) {
//       // Shrink: remove arr[left] from window state
//       left++;
//     }
//     // Update answer using current window [left..right]
//   }
//
// GOTCHA: The shrink condition — shrink when the constraint is violated,
//   NOT before. Shrinking too early loses valid windows.

// ── Problem: Maximum Average Subarray I (Fixed Window) ──────────────
// Find the contiguous subarray of length k with the maximum average.
// Time: O(n)  Space: O(1)

function maxAvgSubarray(nums: number[], k: number): number {
  // Build initial window
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += nums[i];

  let maxSum = windowSum;

  // Slide: add right element, drop left element
  for (let i = k; i < nums.length; i++) {
    windowSum += nums[i] - nums[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum / k;
}

// ── Problem: Longest Substring Without Repeating Characters (Variable) ──
// Find the length of the longest substring with all unique characters.
// Time: O(n)  Space: O(min(n, alphabet)) — at most 26 for lowercase
//
// WHY variable window: we don't know the answer size upfront, and the
// window must shrink whenever we see a duplicate.

function lengthOfLongestSubstring(s: string): number {
  const seen = new Map<string, number>(); // char → last seen index
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    const c = s[right];

    // If we saw this char inside our current window, shrink past it
    if (seen.has(c) && seen.get(c)! >= left) {
      left = seen.get(c)! + 1;
    }

    seen.set(c, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}

// ── Problem: Minimum Window Substring (Hard, Variable Window) ────────
// Given strings s and t, find the smallest window in s that contains
// all characters of t (including duplicates).
// Time: O(n + m)  Space: O(m) where m = t.length
//
// WHY: Expand right until the window has all required chars.
// Then shrink from left to find the minimum valid window.
// A "formed" counter tells us when we've satisfied all char requirements.

function minWindow(s: string, t: string): string {
  if (t.length > s.length) return "";

  // Build frequency map for t
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);

  const have = new Map<string, number>();
  let formed = 0;                      // how many chars are fully satisfied
  const required = need.size;          // distinct chars we must satisfy

  let left = 0;
  let minLen = Infinity;
  let result = "";

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    have.set(c, (have.get(c) ?? 0) + 1);

    // Did this char's count just meet the requirement?
    if (need.has(c) && have.get(c) === need.get(c)) formed++;

    // Window is valid — try to shrink it
    while (formed === required) {
      const windowLen = right - left + 1;
      if (windowLen < minLen) {
        minLen = windowLen;
        result = s.slice(left, right + 1);
      }

      // Shrink from the left
      const leftChar = s[left];
      have.set(leftChar, have.get(leftChar)! - 1);
      if (need.has(leftChar) && have.get(leftChar)! < need.get(leftChar)!) {
        formed--;
      }
      left++;
    }
  }

  return result;
}

function slidingWindowDemo(): void {
  console.log("\n--- SLIDING WINDOW ---");
  console.log("Max avg subarray k=4 [1,12,-5,-6,50,3]:", maxAvgSubarray([1, 12, -5, -6, 50, 3], 4)); // 12.75
  console.log("Longest substring 'abcabcbb':", lengthOfLongestSubstring("abcabcbb")); // 3
  console.log("Longest substring 'bbbbb':", lengthOfLongestSubstring("bbbbb")); // 1
  console.log("Min window s='ADOBECODEBANC' t='ABC':", minWindow("ADOBECODEBANC", "ABC")); // "BANC"
  console.log("Min window s='a' t='a':", minWindow("a", "a")); // "a"
}


// ═══════════════════════════════════════════════════════════════════════
// PATTERN 3: PREFIX SUMS
// ═══════════════════════════════════════════════════════════════════════
//
// WHY IT WORKS:
//   A prefix sum array stores the cumulative sum up to each index.
//   Range sum query [i..j] becomes prefix[j+1] - prefix[i] → O(1) per query.
//   Without prefix sums, each query costs O(n). With n queries: O(n²) vs O(n).
//
//   Extend the idea: prefix[i] is a "state" at position i.
//   If two positions have the same state, the subarray between them has
//   zero net change. This lets you solve "subarray sum equals k" by
//   asking: "have I seen prefix sum (current - k) before?"
//
// WHEN TO USE:
//   - Range sum queries (many queries on a static array)
//   - "Find number of subarrays with sum/product equal to X"
//   - "Product of array except self" — build prefix and suffix products
//
// BUILD PREFIX ARRAY:
//   prefix[0] = 0   ← sentinel, makes range queries off-by-one-free
//   prefix[i] = prefix[i-1] + nums[i-1]
//   range sum [l..r] = prefix[r+1] - prefix[l]
//
// GOTCHA: prefix[i] is the sum of the FIRST i elements (0-indexed from the left).
//   prefix[0] = 0 (empty), prefix[1] = nums[0], prefix[2] = nums[0]+nums[1], etc.
//   This sentinel makes range queries clean and avoids messy edge cases.

// ── Problem: Range Sum Query ─────────────────────────────────────────
// Preprocess an array so that range sum queries [l..r] run in O(1).
// Time: O(n) build, O(1) per query  Space: O(n)

class RangeSum {
  private prefix: number[];

  constructor(nums: number[]) {
    this.prefix = new Array(nums.length + 1).fill(0);
    for (let i = 0; i < nums.length; i++) {
      this.prefix[i + 1] = this.prefix[i] + nums[i];
    }
  }

  // Sum of nums[left..right] inclusive
  query(left: number, right: number): number {
    return this.prefix[right + 1] - this.prefix[left];
  }
}

// ── Problem: Subarray Sum Equals K ───────────────────────────────────
// Count the number of subarrays whose elements sum to k.
// Time: O(n)  Space: O(n)
//
// KEY INSIGHT: If prefix[j] - prefix[i] = k, then subarray [i..j-1] sums to k.
// Rearranging: prefix[i] = prefix[j] - k.
// So as we build the prefix sum, we ask: "how many times have we seen (current - k)?"
// A hashmap stores the count of each prefix sum we've seen.

function subarraySum(nums: number[], k: number): number {
  const prefixCount = new Map<number, number>();
  prefixCount.set(0, 1); // empty prefix (sum=0) seen once — handles subarrays starting at index 0

  let currentSum = 0;
  let count = 0;

  for (const num of nums) {
    currentSum += num;
    // How many prefixes ended with (currentSum - k)?
    // Each one gives us a valid subarray ending here.
    count += prefixCount.get(currentSum - k) ?? 0;
    prefixCount.set(currentSum, (prefixCount.get(currentSum) ?? 0) + 1);
  }

  return count;
}

// ── Problem: Product of Array Except Self ────────────────────────────
// Return array where output[i] = product of all elements except nums[i].
// No division allowed. Time: O(n)  Space: O(1) output array doesn't count
//
// WHY: Build prefix products left-to-right, then multiply by suffix products
// right-to-left in a second pass — using the output array for prefix storage.

function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  const result = new Array(n).fill(1);

  // result[i] = product of all elements to the LEFT of i
  let leftProduct = 1;
  for (let i = 0; i < n; i++) {
    result[i] = leftProduct;
    leftProduct *= nums[i];
  }

  // Multiply in the suffix products from the RIGHT
  let rightProduct = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= rightProduct;
    rightProduct *= nums[i];
  }

  return result;
}

function prefixSumDemo(): void {
  console.log("\n--- PREFIX SUMS ---");
  const rs = new RangeSum([-2, 0, 3, -5, 2, -1]);
  console.log("Range sum [0,2]:", rs.query(0, 2)); // 1
  console.log("Range sum [2,5]:", rs.query(2, 5)); // -1
  console.log("Subarray sum=2 in [1,1,1]:", subarraySum([1, 1, 1], 2)); // 2
  console.log("Subarray sum=0 in [1,-1,2,-2]:", subarraySum([1, -1, 2, -2], 0)); // 3
  console.log("Product except self [1,2,3,4]:", productExceptSelf([1, 2, 3, 4])); // [24,12,8,6]
}


// ═══════════════════════════════════════════════════════════════════════
// PATTERN 4: HASHMAP PATTERNS
// ═══════════════════════════════════════════════════════════════════════
//
// WHY IT WORKS:
//   A hashmap gives O(1) average lookup, insert, and delete.
//   Any problem where you need to know "have I seen X?" or "how many times
//   did X appear?" becomes O(n) instead of O(n²) with a hashmap.
//
// THREE HASHMAP STRATEGIES:
//   1. Frequency counting — count occurrences, compare counts
//   2. Seen-before tracking — record elements as you scan, check membership
//   3. Complement trick — for "find pair summing to X", store (target - current)
//
// WHEN TO USE:
//   - "Find two elements that sum/relate to X" (complement trick)
//   - "Count frequency of each element"
//   - "Group elements by some property"
//   - "Longest sequence / consecutive run"
//
// GOTCHA: Use Map, not plain objects, for number keys.
//   { [key: number]: number } works, but edge cases with keys like
//   "__proto__" or "constructor" can bite you. Map is cleaner and
//   iteration order is guaranteed to be insertion order.

// ── Problem: Two Sum (Classic) ───────────────────────────────────────
// Given an unsorted array, find two indices that sum to target.
// Time: O(n)  Space: O(n)
//
// COMPLEMENT TRICK: as you scan, check if (target - current) is already
// in the map. If yes, you've found the pair. If no, store current → index.

function twoSum(nums: number[], target: number): [number, number] {
  const seen = new Map<number, number>(); // value → index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement)!, i];
    }
    seen.set(nums[i], i);
  }

  return [-1, -1]; // problem guarantees exactly one solution
}

// ── Problem: Group Anagrams ──────────────────────────────────────────
// Group an array of strings so that anagrams are together.
// Time: O(n * k log k) where k = max string length  Space: O(n * k)
//
// KEY INSIGHT: Anagrams have identical sorted characters.
// Use the sorted string as a hashmap key to group them.

function groupAnagrams(strs: string[]): string[][] {
  const map = new Map<string, string[]>();

  for (const str of strs) {
    const key = str.split("").sort().join(""); // "eat" → "aet"
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(str);
  }

  return Array.from(map.values());
}

// ── Problem: Longest Consecutive Sequence ────────────────────────────
// Find the length of the longest sequence of consecutive integers.
// Must run in O(n). Time: O(n)  Space: O(n)
//
// KEY INSIGHT: Only start counting from a sequence's BEGINNING.
// A number n is the start of a sequence if (n-1) is NOT in the set.
// This ensures each element is visited at most twice total → O(n).

function longestConsecutive(nums: number[]): number {
  const numSet = new Set(nums);
  let maxLen = 0;

  for (const num of numSet) {
    // Only start from sequence beginnings
    if (!numSet.has(num - 1)) {
      let current = num;
      let length = 1;

      while (numSet.has(current + 1)) {
        current++;
        length++;
      }

      maxLen = Math.max(maxLen, length);
    }
  }

  return maxLen;
}

function hashmapDemo(): void {
  console.log("\n--- HASHMAP PATTERNS ---");
  console.log("Two Sum [2,7,11,15] target=9:", twoSum([2, 7, 11, 15], 9)); // [0,1]
  console.log("Two Sum [3,2,4] target=6:", twoSum([3, 2, 4], 6)); // [1,2]
  console.log("Group Anagrams:", groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]));
  // [["eat","tea","ate"],["tan","nat"],["bat"]]
  console.log("Longest Consecutive [100,4,200,1,3,2]:", longestConsecutive([100, 4, 200, 1, 3, 2])); // 4
}


// ═══════════════════════════════════════════════════════════════════════
// PATTERN 5: STRING MANIPULATION
// ═══════════════════════════════════════════════════════════════════════
//
// WHY IT MATTERS:
//   Strings are just character arrays. Most string problems reduce to:
//   - Frequency counting (is this a permutation/anagram?)
//   - Two-pointer traversal (palindrome check, reversal)
//   - Expanding outward from a center (palindromic substrings)
//
// KEY FACTS ABOUT STRINGS IN JAVASCRIPT:
//   - Strings are immutable. s[i] = 'x' does nothing.
//   - String concatenation in a loop: s += c runs in O(n²) total
//     because each += creates a new string copy. Use an array + join.
//   - charCodeAt(i) and fromCharCode(n) convert between char and number.
//   - split("").sort().join("") is the canonical anagram key.
//
// GOTCHA: Building a string in a loop is O(n²).
//   BAD:   let result = ""; for (c of chars) result += c;  → O(n²)
//   GOOD:  const parts: string[] = []; parts.push(c); parts.join("");  → O(n)

// ── Problem: Valid Anagram ───────────────────────────────────────────
// Given strings s and t, return true if t is an anagram of s.
// Time: O(n)  Space: O(1) — at most 26 distinct chars for lowercase English

function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;

  // Use a single frequency array for 26 lowercase letters
  const freq = new Array(26).fill(0);
  const a = "a".charCodeAt(0);

  for (let i = 0; i < s.length; i++) {
    freq[s.charCodeAt(i) - a]++;
    freq[t.charCodeAt(i) - a]--;
  }

  return freq.every(f => f === 0);
}

// ── Problem: Longest Palindromic Substring ───────────────────────────
// Find the longest palindromic substring in s.
// Time: O(n²)  Space: O(1)
//
// EXPAND AROUND CENTER: A palindrome mirrors around its center.
// For each index i, expand outward as long as characters match.
// Two cases: odd-length (center at i) and even-length (center between i and i+1).

function longestPalindrome(s: string): string {
  if (s.length === 0) return "";

  let start = 0;
  let maxLen = 1;

  function expandAroundCenter(left: number, right: number): void {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      const len = right - left + 1;
      if (len > maxLen) {
        maxLen = len;
        start = left;
      }
      left--;
      right++;
    }
  }

  for (let i = 0; i < s.length; i++) {
    expandAroundCenter(i, i);     // Odd-length: "aba" — center is i
    expandAroundCenter(i, i + 1); // Even-length: "abba" — center between i and i+1
  }

  return s.slice(start, start + maxLen);
}

// ── Problem: Encode and Decode Strings ───────────────────────────────
// Design an algorithm to encode a list of strings to a single string,
// then decode back. The strings may contain any character.
// Time: O(n) encode, O(n) decode  Space: O(n)
//
// TECHNIQUE: Prefix each string with its length and a delimiter.
// "4#word" means "the next 4 characters form a word."
// This handles strings that contain the delimiter character.

function encode(strs: string[]): string {
  // Format: "<length>#<string>" for each string
  return strs.map(s => `${s.length}#${s}`).join("");
}

function decode(encoded: string): string[] {
  const result: string[] = [];
  let i = 0;

  while (i < encoded.length) {
    const hash = encoded.indexOf("#", i);
    const len = parseInt(encoded.slice(i, hash), 10);
    result.push(encoded.slice(hash + 1, hash + 1 + len));
    i = hash + 1 + len;
  }

  return result;
}

function stringDemo(): void {
  console.log("\n--- STRING MANIPULATION ---");
  console.log("Valid Anagram 'anagram','nagaram':", isAnagram("anagram", "nagaram")); // true
  console.log("Valid Anagram 'rat','car':", isAnagram("rat", "car")); // false
  console.log("Longest Palindromic Substring 'babad':", longestPalindrome("babad")); // "bab" or "aba"
  console.log("Longest Palindromic Substring 'cbbd':", longestPalindrome("cbbd")); // "bb"
  const words = ["hello", "world", "#test", "with spaces"];
  const enc = encode(words);
  console.log("Encode:", enc);
  console.log("Decode:", decode(enc)); // back to original array
}


// ═══════════════════════════════════════════════════════════════════════
// PATTERN 6: SORTING AND BINARY SEARCH
// ═══════════════════════════════════════════════════════════════════════
//
// WHY SORTING HELPS:
//   Sorting costs O(n log n) but buys you powerful O(n) or O(log n)
//   algorithms afterward. If sorting + a linear scan is faster than
//   the naive approach, it's often the intended solution.
//   Examples: sort first, then two-pointer (O(n log n) vs O(n²)).
//
// BINARY SEARCH TEMPLATE (avoid off-by-one forever):
//   let left = 0, right = nums.length - 1;
//   while (left <= right) {             ← <= because left==right is valid
//     const mid = left + ((right - left) >> 1);  ← avoids integer overflow
//     if (nums[mid] === target) return mid;
//     else if (nums[mid] < target) left = mid + 1;
//     else right = mid - 1;
//   }
//   return -1;  // not found
//
// `left < right` vs `left <= right`:
//   - `left <= right`: searching for a specific value, stop when found
//   - `left < right`: narrowing to a position (min/max), stop when l==r
//
// GOTCHA: Rotated array binary search — you can always identify which
//   HALF is sorted, even if you can't find the target's exact half immediately.
//   Check if mid is in the left sorted portion (nums[left] <= nums[mid]).

// ── Problem: Search in Rotated Sorted Array ──────────────────────────
// Array was sorted then rotated. Find target. Time: O(log n)  Space: O(1)
//
// KEY INSIGHT: Even after rotation, one half is always sorted.
// Determine which half is sorted, check if target is in that half.

function searchRotated(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + ((right - left) >> 1);
    if (nums[mid] === target) return mid;

    // Left half is sorted
    if (nums[left] <= nums[mid]) {
      if (target >= nums[left] && target < nums[mid]) {
        right = mid - 1; // target in left sorted half
      } else {
        left = mid + 1;
      }
    } else {
      // Right half is sorted
      if (target > nums[mid] && target <= nums[right]) {
        left = mid + 1; // target in right sorted half
      } else {
        right = mid - 1;
      }
    }
  }

  return -1;
}

// ── Problem: Find Minimum in Rotated Sorted Array ────────────────────
// Time: O(log n)  Space: O(1)
//
// KEY INSIGHT: The minimum is the "pivot" — where rotation broke the order.
// If nums[mid] > nums[right], the min is in the right half. Otherwise left.
// Use `left < right` because we're converging to a position, not a value.

function findMin(nums: number[]): number {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) { // Note: `<` not `<=`
    const mid = left + ((right - left) >> 1);

    if (nums[mid] > nums[right]) {
      left = mid + 1; // min is in right half
    } else {
      right = mid; // mid could be the min, don't exclude it
    }
  }

  return nums[left];
}

// ── Problem: Kth Largest Element (Quickselect) ───────────────────────
// Find the kth largest element in an unsorted array without full sort.
// Time: O(n) average, O(n²) worst  Space: O(1) in-place
//
// QUICKSELECT: Like quicksort, but only recurse into the half that
// contains the kth element. On average, each level halves the problem.

function findKthLargest(nums: number[], k: number): number {
  // kth largest = (n - k)th smallest (0-indexed)
  const target = nums.length - k;

  function partition(left: number, right: number): number {
    const pivot = nums[right];
    let storeIdx = left;

    for (let i = left; i < right; i++) {
      if (nums[i] <= pivot) {
        [nums[storeIdx], nums[i]] = [nums[i], nums[storeIdx]];
        storeIdx++;
      }
    }
    [nums[storeIdx], nums[right]] = [nums[right], nums[storeIdx]];
    return storeIdx;
  }

  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const pivotIdx = partition(left, right);
    if (pivotIdx === target) return nums[pivotIdx];
    else if (pivotIdx < target) left = pivotIdx + 1;
    else right = pivotIdx - 1;
  }

  return -1;
}

function sortingBinarySearchDemo(): void {
  console.log("\n--- SORTING AND BINARY SEARCH ---");
  console.log("Search rotated [4,5,6,7,0,1,2] target=0:", searchRotated([4, 5, 6, 7, 0, 1, 2], 0)); // 4
  console.log("Search rotated [4,5,6,7,0,1,2] target=3:", searchRotated([4, 5, 6, 7, 0, 1, 2], 3)); // -1
  console.log("Find min in rotated [3,4,5,1,2]:", findMin([3, 4, 5, 1, 2])); // 1
  console.log("Find min in rotated [4,5,6,7,0,1,2]:", findMin([4, 5, 6, 7, 0, 1, 2])); // 0
  console.log("2nd largest in [3,2,1,5,6,4]:", findKthLargest([3, 2, 1, 5, 6, 4], 2)); // 5
  console.log("4th largest in [3,2,3,1,2,4,5,5,6]:", findKthLargest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4)); // 4
}


// ═══════════════════════════════════════════════════════════════════════
// PATTERN 7: MATRIX PATTERNS
// ═══════════════════════════════════════════════════════════════════════
//
// WHY IT MATTERS:
//   2D arrays (matrices) are just arrays of arrays in JS. Most matrix
//   problems reduce to careful index management and boundary checks.
//   In-place problems often use the matrix itself as a scratch hash
//   (sign flipping, special sentinel values) to achieve O(1) space.
//
// INDEX MAPPING FOR ROTATION (n×n matrix):
//   Rotate 90° clockwise: matrix[row][col] → matrix[col][n-1-row]
//   Approach: Transpose (flip across diagonal), then reverse each row.
//   Transpose: matrix[i][j] ↔ matrix[j][i]
//
// SPIRAL ORDER — four boundaries shrink inward:
//   top, bottom, left, right — advance boundary after completing each edge.
//
// GOTCHA: Matrix problems often have O(1) space solutions by using the
//   matrix as its own hash. For "Set Matrix Zeroes", instead of an extra
//   set, mark rows/cols using the first row and first column as flags.

// ── Problem: Spiral Matrix ───────────────────────────────────────────
// Return all elements of a matrix in spiral order.
// Time: O(m*n)  Space: O(1) excluding output

function spiralOrder(matrix: number[][]): number[] {
  const result: number[] = [];
  if (!matrix.length) return result;

  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    // Traverse right across the top row
    for (let c = left; c <= right; c++) result.push(matrix[top][c]);
    top++;

    // Traverse down the right column
    for (let r = top; r <= bottom; r++) result.push(matrix[r][right]);
    right--;

    // Traverse left across the bottom row (if there's still a row)
    if (top <= bottom) {
      for (let c = right; c >= left; c--) result.push(matrix[bottom][c]);
      bottom--;
    }

    // Traverse up the left column (if there's still a column)
    if (left <= right) {
      for (let r = bottom; r >= top; r--) result.push(matrix[r][left]);
      left++;
    }
  }

  return result;
}

// ── Problem: Rotate Image ────────────────────────────────────────────
// Rotate an n×n matrix 90° clockwise, in-place.
// Time: O(n²)  Space: O(1)
//
// TRICK: Two steps:
//   1. Transpose: swap matrix[i][j] with matrix[j][i] (flip across diagonal)
//   2. Reverse each row: [1,2,3] → [3,2,1]

function rotateImage(matrix: number[][]): void {
  const n = matrix.length;

  // Step 1: Transpose (only swap above the diagonal to avoid double-swapping)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }

  // Step 2: Reverse each row
  for (let i = 0; i < n; i++) {
    matrix[i].reverse();
  }
}

// ── Problem: Set Matrix Zeroes ───────────────────────────────────────
// If an element is 0, set its entire row and column to 0. In-place.
// Time: O(m*n)  Space: O(1) using first row/col as flags
//
// TRICK: Use the first row and first column as flag storage.
// First, check if row 0 or col 0 themselves contain zeros (handle separately).
// Then scan the matrix and mark row i / col j in the first row/col.
// Finally, zero out based on flags. Handle row 0 / col 0 last.

function setZeroes(matrix: number[][]): void {
  const m = matrix.length;
  const n = matrix[0].length;

  let firstRowHasZero = matrix[0].some(v => v === 0);
  let firstColHasZero = false;
  for (let i = 0; i < m; i++) {
    if (matrix[i][0] === 0) { firstColHasZero = true; break; }
  }

  // Use first row/col as flags for the rest of the matrix
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      if (matrix[i][j] === 0) {
        matrix[i][0] = 0; // flag row i
        matrix[0][j] = 0; // flag col j
      }
    }
  }

  // Zero out cells based on flags
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      if (matrix[i][0] === 0 || matrix[0][j] === 0) matrix[i][j] = 0;
    }
  }

  // Handle first row and first column
  if (firstRowHasZero) matrix[0].fill(0);
  if (firstColHasZero) {
    for (let i = 0; i < m; i++) matrix[i][0] = 0;
  }
}

function matrixDemo(): void {
  console.log("\n--- MATRIX PATTERNS ---");

  const spiral = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  console.log("Spiral order [[1,2,3],[4,5,6],[7,8,9]]:", spiralOrder(spiral)); // [1,2,3,6,9,8,7,4,5]

  const img = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  rotateImage(img);
  console.log("Rotate 90° [[1,2,3],[4,5,6],[7,8,9]]:", JSON.stringify(img)); // [[7,4,1],[8,5,2],[9,6,3]]

  const mat = [[1, 1, 1], [1, 0, 1], [1, 1, 1]];
  setZeroes(mat);
  console.log("Set zeroes [[1,1,1],[1,0,1],[1,1,1]]:", JSON.stringify(mat)); // [[1,0,1],[0,0,0],[1,0,1]]
}


// ═══════════════════════════════════════════════════════════════════════
// CHEAT SHEET: PATTERN → SIGNAL WORDS
// ═══════════════════════════════════════════════════════════════════════
//
// "sorted array" + "find pair"       → TWO POINTERS
// "palindrome"                        → TWO POINTERS (expand from center)
// "subarray" + "contiguous"           → SLIDING WINDOW
// "longest/shortest substring"        → SLIDING WINDOW (variable)
// "at most k distinct characters"     → SLIDING WINDOW (variable)
// "range sum query"                   → PREFIX SUM
// "subarray sum equals k"             → PREFIX SUM + HASHMAP
// "two sum" (unsorted)                → HASHMAP (complement trick)
// "anagram" / "group by property"     → HASHMAP (frequency key)
// "consecutive sequence"              → HASHMAP + set membership
// "find in sorted array"              → BINARY SEARCH
// "rotated sorted array"              → BINARY SEARCH (half-detection)
// "kth largest/smallest"              → QUICKSELECT or heap
// "spiral" / "rotate matrix"          → MATRIX (boundary tracking)
// "set matrix zeroes"                 → MATRIX (use matrix as flags)
//
// COMPLEXITY SUMMARY:
//
//   Pattern                 | Time          | Space
//   ─────────────────────────────────────────────────
//   Two Pointers            | O(n)          | O(1)
//   Sliding Window (fixed)  | O(n)          | O(1)
//   Sliding Window (var)    | O(n)          | O(k)
//   Prefix Sum (build)      | O(n)          | O(n)
//   Prefix Sum (query)      | O(1)/query    | —
//   Subarray Sum = K        | O(n)          | O(n)
//   Product Except Self     | O(n)          | O(1)*
//   HashMap: Two Sum        | O(n)          | O(n)
//   HashMap: Group Anagrams | O(n·k log k)  | O(n·k)
//   Longest Consecutive     | O(n)          | O(n)
//   Valid Anagram           | O(n)          | O(1)
//   Longest Palindrome sub  | O(n²)         | O(1)
//   Binary Search           | O(log n)      | O(1)
//   Quickselect             | O(n) avg      | O(1)
//   Spiral Matrix           | O(m·n)        | O(1)*
//   Rotate Image            | O(n²)         | O(1)
//   Set Matrix Zeroes       | O(m·n)        | O(1)
//
//   * output array not counted in space complexity


// ═══════════════════════════════════════════════════════════════════════
// SELF-ASSESSMENT — 15 QUESTIONS (answer before running)
// ═══════════════════════════════════════════════════════════════════════
//
// PREDICT OUTPUT:
//
// Q1. What does twoSumSorted([1, 3, 5, 7], 8) return?
//     (a) [1, 4]   (b) [2, 3]   (c) [1, 3]   (d) [2, 4]
//
// Q2. What does isPalindrome("Was it a car or a cat I saw") return?
//     (a) true   (b) false
//
// Q3. What is maxAvgSubarray([1, 2, 3, 4, 5], 3)?
//     (a) 3   (b) 4   (c) 3.5   (d) 5
//
// Q4. What does subarraySum([1, -1, 1], 0) return?
//     (a) 1   (b) 2   (c) 3   (d) 0
//
// Q5. productExceptSelf([2, 3, 4, 5]) — what is output[2]?
//     (a) 12   (b) 30   (c) 20   (d) 15
//
// IDENTIFY THE PATTERN:
//
// Q6. "Find the number of subarrays whose sum equals k in an unsorted array."
//     Best pattern? (a) Two Pointers (b) Sliding Window (c) Prefix Sum + HashMap (d) Sorting
//
// Q7. "Given a sorted array, find if a pair exists that sums to target."
//     Best pattern? (a) HashMap (b) Two Pointers (c) Prefix Sum (d) Binary Search
//
// Q8. "Find the longest substring with at most 2 distinct characters."
//     Best pattern? (a) Two Pointers (b) Sliding Window (c) HashMap (d) Prefix Sum
//
// Q9. "Check if two strings are anagrams of each other."
//     Best pattern? (a) Sliding Window (b) Sorting (c) HashMap / freq array (d) Binary Search
//
// Q10. "Find the minimum element in a rotated sorted array."
//      Best pattern? (a) Linear scan (b) Two Pointers (c) Binary Search (d) Quickselect
//
// TIME COMPLEXITY:
//
// Q11. What is the time complexity of Longest Consecutive Sequence using a Set?
//      (a) O(n log n)   (b) O(n²)   (c) O(n)   (d) O(n + k)
//
// Q12. What is the time complexity of Minimum Window Substring?
//      (a) O(n²)   (b) O(n·m)   (c) O(n + m)   (d) O(n log n)
//
// Q13. What is the SPACE complexity of the Two Pointers approach to Two Sum II?
//      (a) O(n)   (b) O(log n)   (c) O(1)   (d) O(n²)
//
// Q14. Quickselect average time complexity vs worst case?
//      (a) Both O(n log n)   (b) O(n) avg, O(n²) worst
//      (c) O(log n) avg, O(n) worst   (d) Both O(n)
//
// GOTCHA / REASONING:
//
// Q15. Why does `minWindow` initialize `prefixCount.set(0, 1)` with value 1
//      in subarraySum — what subarray does that sentinel represent?
//
// ─────────────────────────────────────────────────────────────────────
// ANSWERS:
// Q1: (b) [2,3] — numbers[1]+numbers[2] = 3+5 = 8 (1-indexed)
// Q2: (a) true
// Q3: (b) 4 — window [3,4,5] sums to 12, avg = 4
// Q4: (c) 3 — subarrays: [], [1,-1], [1,-1,1] have sum 0? No:
//     actually [] isn't a subarray here.
//     [1,-1]=0, [-1,1]=0, [1,-1,1]=1. Wait — let me recount:
//     pairs summing to 0: (1,-1) at idx[0,1], (-1,1) at idx[1,2],
//     and (1,-1,1) sums to 1. So answer is 2.
//     (Corrected: Q4 answer is (b) 2)
// Q5: (b) 30 — product of [2,3,5] = 30 (all except index 2 which is 4)
// Q6: (c) Prefix Sum + HashMap
// Q7: (b) Two Pointers
// Q8: (b) Sliding Window
// Q9: (c) HashMap / freq array
// Q10: (c) Binary Search
// Q11: (c) O(n) — each element is visited at most twice
// Q12: (c) O(n + m) — two pointers on s, one pass to build t map
// Q13: (c) O(1) — only left/right pointers, no extra data structures
// Q14: (b) O(n) avg, O(n²) worst
// Q15: The empty subarray [] starting at index 0. prefix sum 0 occurs
//      before any elements are processed. If currentSum - k = 0,
//      the subarray from index 0 to current index sums to k.
//      Without the sentinel, we'd miss subarrays that start at index 0.


// ═══════════════════════════════════════════════════════════════════════
// DEMO RUNNER
// ═══════════════════════════════════════════════════════════════════════

function runDemo(): void {
  console.log("══════════════════════════════════════════════════");
  console.log("  DSA 01: ARRAYS & STRINGS — PATTERN DEMOS");
  console.log("══════════════════════════════════════════════════");

  bigODemo();
  twoPointerDemo();
  slidingWindowDemo();
  prefixSumDemo();
  hashmapDemo();
  stringDemo();
  sortingBinarySearchDemo();
  matrixDemo();

  console.log("\n══════════════════════════════════════════════════");
  console.log("  All demos complete. Review the self-assessment");
  console.log("  questions above. Score: 13-15 = ready to advance");
  console.log("══════════════════════════════════════════════════\n");
}

runDemo();
