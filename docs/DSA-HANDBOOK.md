# DSA Interview Handbook (SDE-1 / Junior)

A complete, beginner→interview reference in JavaScript. Every topic covers: concept, intuition, visual, complexity, patterns, template code, dry run, common mistakes, edge cases, interview tips, graded practice problems, FAQ, revision notes, and a cheat sheet.

**How to use this handbook**
- Study in the numbered order — each part builds on the previous one.
- For every topic: read Concept→Intuition→Template, hand-run the Dry Run, then attempt the Practice Problems **before** looking anything up. Solutions are intentionally omitted (attempt-first); one worked canonical example per topic lives in its Dry Run.
- The night before an interview, read only the **Revision Notes** and **Cheat Sheet** of each topic.
- Scope note: this targets the SDE-1 / Junior bar. Advanced variants (segment trees, advanced DP-on-trees/graphs, string automata) are out of scope by design.

---

## ⭐ Priority Guide — What You Must Complete (read this first)

This handbook is large. **You do not need all 29 topics to be interview-ready for an SDE-1 / junior frontend or full-stack role.** Every topic is tagged with a priority tier (also shown on its heading):

| Tier | Meaning | Do it when |
|---|---|---|
| ✅ **MUST-DO (core minimum)** | The non-negotiable foundation. This is the "never freeze on a fundamentals question" bar and matches your own `JOB-READINESS-PLAN` DSA scope. | **First. Finish all of these before applying.** |
| 🔶 **RECOMMENDED (do after core)** | Common enough that they show up in stronger interviews. Broadens your coverage noticeably. | After every ✅ is solid. |
| ⭐ **STRETCH (optional / higher bar)** | Only needed for product-company / higher-bar loops, or if you have spare time. Safe to skip for a first switch. | Last, or skip. |

### ✅ The required minimum (20 core topics — this is your target)
Complexity · Arrays · Strings · Hash Maps · Hash Sets · Two Pointers · Sliding Window · Prefix Sum · Binary Search · Sorting · Recursion · Linked Lists · Stacks · Queues · Trees (General) · Binary Trees · BST · Graphs (Representation) · DFS · BFS

**If you only do the ✅ list well — hand-solving each topic's Easy + a couple of Medium problems and able to state Big-O — you clear the DSA bar for the roles you're targeting.**

### 🔶 Next, if time allows
Backtracking · Heaps · Dynamic Programming (start with 1D) · Bit Manipulation

### ⭐ Stretch / optional (safe to skip for now)
Tries · Topological Sort · Union-Find (DSU) · Greedy · Math & Number Theory

> **Suggested minimum-bar plan:** do the ✅ topics in numbered order, ~1 topic per study session, attempting that topic's practice problems before moving on. That's the smallest complete path to interview-ready.

---

## Table of Contents

_Legend: ✅ must-do · 🔶 recommended · ⭐ stretch_

**Part 1 — Foundations & Sequences**
1. Complexity Analysis & Big-O ✅
2. Arrays ✅
3. Strings ✅

**Part 2 — Hashing & Window Techniques**
4. Hash Maps ✅
5. Hash Sets ✅
6. Two Pointers ✅
7. Sliding Window ✅
8. Prefix Sum ✅

**Part 3 — Searching & Sorting**
9. Binary Search ✅
10. Sorting ✅

**Part 4 — Recursion & Backtracking**
11. Recursion ✅
12. Backtracking 🔶

**Part 5 — Linear Structures**
13. Linked Lists ✅
14. Stacks ✅
15. Queues ✅

**Part 6 — Trees, Heaps & Tries**
16. Trees (General) ✅
17. Binary Trees ✅
18. Binary Search Trees (BST) ✅
19. Heaps 🔶
20. Tries ⭐

**Part 7 — Graphs**
21. Graphs (Representation) ✅
22. DFS (Depth-First Search) ✅
23. BFS (Breadth-First Search) ✅
24. Topological Sort ⭐
25. Union-Find (DSU) ⭐

**Part 8 — Algorithmic Paradigms & Math**
26. Greedy Algorithms ⭐
27. Dynamic Programming 🔶
28. Bit Manipulation 🔶
29. Math & Number Theory ⭐

---


# Part 1 — Foundations & Sequences

## 1. Complexity Analysis & Big-O  —  ✅ **MUST-DO (core minimum)**

### Concept

Complexity analysis is how we describe the *cost* of an algorithm — how its running
time (or memory) grows as the input gets bigger — **without** running it on a specific
machine. Instead of saying "this takes 3 milliseconds", we say "this does about `n`
operations for an input of size `n`". That way the description survives faster CPUs,
different languages, and warm/cold caches.

We care about three questions:

- **Time complexity** — how the number of steps grows with input size `n`.
- **Space complexity** — how the extra memory grows with `n`.
- **Growth rate** — not the exact count, but the *shape* of the curve as `n → ∞`.

Big-O is the vocabulary interviewers expect you to speak fluently.

### Intuition

Imagine you have a phone book with `n` names.

- Reading the **first** name is 1 step no matter how big the book is → **O(1)**.
- Reading **every** name once is `n` steps → **O(n)**.
- Finding a name by repeatedly halving the book (it's sorted) is `log₂ n` steps → **O(log n)**.
- Comparing **every** name to **every other** name is `n × n` steps → **O(n²)**.

Big-O keeps only the term that dominates as `n` gets huge and drops constants and
lower-order terms, because those stop mattering at scale:

```
3n² + 50n + 900   →   O(n²)
```

At `n = 1,000,000`, the `n²` term (a trillion) utterly swamps the `50n` (50 million)
and the `+900`. So we keep `n²` and throw the rest away.

The three Greek symbols:

- **Big-O (O)** — *upper bound* ("no worse than"). The worst case. This is what we
  quote 95% of the time in interviews.
- **Big-Omega (Ω)** — *lower bound* ("no better than"). The best case.
- **Big-Theta (Θ)** — *tight bound* ("exactly this shape"). When upper and lower
  bounds match.

Example: linear search is `Ω(1)` (found on first try), `O(n)` (found last / not present),
and we usually just say it is `O(n)` because we plan for the worst.

### Visual

Growth of common classes as `n` increases (rows are roughly "steps required"):

```
 steps
   ^
   |                                             n!          2^n
   |                                          *            *
   |                                       *           *
   |                                    *          *
   |                                 *         *              n^2
   |                              *        *              *
   |                           *       *            *
   |                        *      *          *               n log n
   |                     *     *        *            .  .  .  .  n
   |                  *    *      *   .  .  .  .  .  .  .
   |               * *   * .  .  .  .           _ _ _ _ _ _  log n
   |            **  .  .           _ _ _ _ _ _ _
   |         *.  _ _ _ _ _ _ _ _ _                        ______ 1
   +----------------------------------------------------------------> n
```

Read it as: flatter = better. `O(1)` is a flat floor; `O(log n)` barely rises;
`O(2^n)` and `O(n!)` shoot to the ceiling almost immediately (unusable past small `n`).

Concrete feel — approximate steps at each size:

```
 n        log n   n        n log n     n^2            2^n
 10       ~3      10       ~33         100            1,024
 100      ~7      100      ~664        10,000         ~1.3e30
 1,000    ~10     1,000    ~9,966      1,000,000      astronomically huge
 1,000,000 ~20    1e6      ~2e7        1e12           don't even think about it
```

### Time & Space Complexity

Common classes, from best to worst, with a canonical example:

| Class        | Name          | Typical source                                   | 1e6 feel        |
|--------------|---------------|--------------------------------------------------|-----------------|
| `O(1)`       | Constant      | array index, hash lookup, push/pop               | instant         |
| `O(log n)`   | Logarithmic   | binary search, balanced-tree op, heap push/pop   | ~20 steps       |
| `O(n)`       | Linear        | single pass over input                           | ~1e6 steps      |
| `O(n log n)` | Linearithmic  | good sorts (merge/heap/Timsort), divide & conquer| ~2e7 steps      |
| `O(n²)`      | Quadratic     | nested loop over same input, bubble sort         | ~1e12 (slow)    |
| `O(2^n)`     | Exponential   | naive recursion over subsets, naive Fibonacci    | infeasible      |
| `O(n!)`      | Factorial     | generating all permutations, brute-force TSP     | infeasible      |

Rule of thumb for interview constraints: if `n ≤ ~20` an exponential/factorial answer
may be intended; `n ≤ ~5,000` allows `O(n²)`; `n` up to `1e5–1e6` demands
`O(n log n)` or `O(n)`; `n ≥ 1e9` demands `O(log n)` or `O(1)`.

### Common Interview Patterns

You don't compute complexity from scratch every time — you *recognize* shapes:

- **Single loop `0..n`** → `O(n)`.
- **Nested loops, both `0..n`** → `O(n²)`. Three levels → `O(n³)`.
- **Loop where the index halves/doubles** (`i *= 2`, or shrinking search space) → `O(log n)`.
- **Sort, then one pass** → `O(n log n)` (the sort dominates).
- **Divide in half + linear work per level** → `O(n log n)` (merge sort).
- **Divide in half + constant work per level** → `O(log n)` (binary search).
- **Recursion branching into 2 calls with no memo** → often `O(2^n)`.
- **Two different inputs of sizes `n` and `m`** → keep both: `O(n + m)` or `O(n·m)`.

### Template Code

Not a "template" in the reusable-skeleton sense, but the mental procedures you run.
Below are annotated snippets showing how each answer is derived.

```js
// O(1) — work does not depend on n.
function first(arr) {
  return arr[0];               // one index operation, regardless of arr.length
}

// O(n) — one pass over the input.
function sum(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) { // runs arr.length times
    total += arr[i];                     // O(1) body
  }
  return total;                          // n * O(1) = O(n)
}

// O(n^2) — nested loop over the same input.
function hasDuplicatePairSum(arr, target) {
  for (let i = 0; i < arr.length; i++) {        // n iterations
    for (let j = i + 1; j < arr.length; j++) {  // up to n iterations each
      if (arr[i] + arr[j] === target) return true;
    }
  }
  return false;                                 // ~ n*(n-1)/2 = O(n^2)
}

// O(log n) — the search space halves each step.
function countHalvings(n) {
  let steps = 0;
  while (n > 1) {   // n -> n/2 -> n/4 -> ... -> 1
    n = Math.floor(n / 2);
    steps++;
  }
  return steps;     // log2(n) iterations = O(log n)
}

// O(n log n) — outer work n, inner loop halves: classic sort shape.
function nLogN(n) {
  let ops = 0;
  for (let i = 0; i < n; i++) {          // n times
    for (let j = 1; j < n; j *= 2) ops++; // log n times
  }
  return ops;                            // O(n log n)
}
```

Analyzing **recursion** with a recurrence relation (the Master-Theorem shortcut):

```
T(n) = a * T(n / b) + f(n)
        |        |        |
        |        |        +-- work done outside the recursive calls (per level)
        |        +----------- factor the input shrinks by each call
        +-------------------- number of recursive calls made
```

- Merge sort: `T(n) = 2·T(n/2) + O(n)` → **O(n log n)**.
- Binary search: `T(n) = 1·T(n/2) + O(1)` → **O(log n)**.
- Naive Fibonacci: `T(n) = T(n-1) + T(n-2) + O(1)` → **O(2^n)** (branches, doesn't shrink by division).

### Dry Run

Let's fully analyze `hasDuplicatePairSum` above on `arr = [3, 5, 2, 8]`, `target = 10`.

The inner loop runs a shrinking number of times as `i` advances:

```
i=0 (arr[i]=3): j runs over indexes 1,2,3  -> 3 comparisons
   3+5=8  no
   3+2=5  no
   3+8=11 no
i=1 (arr[i]=5): j runs over indexes 2,3     -> 2 comparisons
   5+2=7  no
   5+8=13 no
i=2 (arr[i]=2): j runs over index 3         -> 1 comparison
   2+8=10 MATCH -> return true
```

Comparison count in the *worst* case (no match) is `3 + 2 + 1 = 6` for `n = 4`,
which is `n(n-1)/2 = 4·3/2 = 6`. That formula is `(n² - n)/2` → drop the constant
`1/2` and the lower-order `-n` → **O(n²)**. Space used is a couple of loop variables
regardless of `n`, so **O(1)** space.

### Common Mistakes

- **Keeping constants / lower-order terms**: writing `O(2n)` or `O(n² + n)`. Simplify
  to `O(n)` and `O(n²)`.
- **Adding when you should multiply (or vice-versa)**: two *sequential* loops are
  `O(n) + O(n) = O(n)`; two *nested* loops are `O(n) × O(n) = O(n²)`.
- **Assuming a nested loop is always `O(n²)`**: if the inner loop runs a *fixed* number
  of times (say 26 letters) it's `O(n)`, not `O(n²)`.
- **Ignoring hidden costs**: `arr.includes(x)` inside a loop is `O(n)` per call, turning
  an innocent-looking loop into `O(n²)`. `str += c` in a loop can be `O(n²)` too (see Strings).
- **Confusing best case with typical case**: quoting `Ω` when the interviewer wants worst-case `O`.
- **Forgetting the recursion stack in space complexity**: a recursion `n` deep is `O(n)` space
  even if it allocates nothing.

### Edge Cases

- **Empty input** (`n = 0`): loops run zero times — still valid, complexity formula holds.
- **`n = 1`**: often the base case; make sure your analysis and code both handle it.
- **Two inputs**: don't collapse `O(n + m)` to `O(n)` unless you can justify `m ≤ n`.
- **Amortized vs worst-case single op**: a single dynamic-array push is worst-case `O(n)`
  (on resize) but amortized `O(1)` (see below).
- **Input-dependent early exit**: linear search is `O(n)` worst case even though it may
  return early — analyze the worst case unless asked otherwise.

### Interview Tips

- **Narrate the derivation out loud**: "One loop over `n`, constant work inside, so
  `O(n)` time; I only use two pointers, so `O(1)` extra space." Interviewers grade the
  reasoning, not just the letter.
- **Always state both time AND space.** Candidates forget space constantly.
- **Anchor to the input constraints**: "`n` is up to `1e5`, so `O(n²)` is ~1e10 — too
  slow; I need `O(n log n)` or better." This shows you connect theory to feasibility.
- **Mention the brute force first, then improve it** — it demonstrates range and makes
  your optimization legible.
- **Know that `log` is base 2 in CS**, and that `O(log n)` is essentially "the number of
  times you can halve `n`".

### Complexity exercises: given code, state Big-O

*(This foundational topic uses exercises in place of the usual practice-problem list.)*

**Beginner**

- **Single loop**: `for (i=0;i<n;i++) sum+=a[i];` → State time & space.
  *Insight:* one pass, constant space → `O(n)` time, `O(1)` space.
- **Fixed inner loop**: `for (i=0;i<n;i++) for (k=0;k<100;k++) work();` → State time.
  *Insight:* inner loop bound is a constant → `O(n)`, not `O(n²)`.
- **Halving loop**: `while (n>1) n=Math.floor(n/2);` → State time.
  *Insight:* search space halves → `O(log n)`.

**Medium**

- **Triangular nested loop**: `for (i=0;i<n;i++) for (j=i;j<n;j++) work();` → State time.
  *Insight:* `n+(n-1)+…+1 = n(n+1)/2` → still `O(n²)`.
- **Two sequential loops over different inputs** of size `n` and `m`. → State time.
  *Insight:* sequential adds → `O(n + m)`.
- **Loop with `j *= 2` inside a loop over `n`.** → State time.
  *Insight:* inner is `O(log n)`, outer `O(n)` → `O(n log n)`.

**Hard**

- **Recurrence `T(n)=2T(n/2)+O(n)`** → State closed form.
  *Insight:* Master theorem case → `O(n log n)`.
- **Naive recursive Fibonacci** → State time.
  *Insight:* branching `T(n)=T(n-1)+T(n-2)` → `O(φ^n) ≈ O(2^n)`; memoized → `O(n)`.
- **Generate all permutations of `n` items** → State time.
  *Insight:* `n!` permutations, each `O(n)` to build → `O(n · n!)`.

### Frequently Asked Interview Questions

**Q: What's the difference between O, Ω, and Θ?**
O is the upper bound (worst case), Ω the lower bound (best case), Θ a tight bound when
both match. We usually quote O.

**Q: Why do we drop constants and lower-order terms?**
Big-O describes growth as `n → ∞`, where the dominant term outpaces everything else;
constants depend on hardware/implementation and aren't the algorithm's fundamental scaling.

**Q: What is amortized complexity?**
The average cost per operation across a sequence, even if individual operations
occasionally cost more. Example: dynamic-array push is amortized `O(1)`.

**Q: Does `O(n)` always beat `O(n²)`?**
Asymptotically yes, but for small `n` a low-constant `O(n²)` can beat a high-constant
`O(n)`. Big-O is about scaling, not small inputs.

**Q: Is `O(2n)` the same as `O(n)`?**
Yes — constants are dropped. Both are linear.

**Q: How do you find complexity of a recursive function?**
Write its recurrence `T(n)=a·T(n/b)+f(n)` and solve it (Master theorem or a recursion tree).

### Revision Notes

- Big-O = worst-case upper bound; drop constants and lower-order terms.
- Class ladder (best→worst): `1 < log n < n < n log n < n² < 2^n < n!`.
- Sequential loops **add**; nested loops **multiply**.
- Halving/doubling index ⇒ `log n`. Sort-then-scan ⇒ `n log n`.
- Recursion depth counts toward **space**.
- Recurrence: `2T(n/2)+O(n)` ⇒ `n log n`; `T(n/2)+O(1)` ⇒ `log n`.
- Map `n` to feasibility: `1e5`⇒need `n log n`; `≤20`⇒exponential OK.
- Always state time **and** space.

### Cheat Sheet

```
Simplify:   3n^2 + 20n + 5   ->  O(n^2)   (keep dominant term, drop constants)

Loop shapes:
  i++ over n .................. O(n)
  nested i,j over n .......... O(n^2)
  i *= 2  /  n /= 2 .......... O(log n)
  sort + single scan ......... O(n log n)
  recurse(2 halves)+O(n) ..... O(n log n)
  recurse(1 half)+O(1) ....... O(log n)
  branch recursion, no memo .. O(2^n)
  all permutations ........... O(n!)

Add vs multiply:  A then B => O(A + B) | A inside B => O(A * B)
Space:  extra structures + recursion-stack depth
Amortized push (dynamic array) = O(1)
```

---

## 2. Arrays  —  ✅ **MUST-DO (core minimum)**

### Concept

An array is an ordered, indexed collection of elements stored so that any element can be
reached directly by its position (index). It is the most fundamental data structure —
almost everything else (strings, stacks, queues, heaps, hash-table buckets) is built on
top of arrays.

In a *true* (low-level) array, elements sit in one **contiguous** block of memory, all the
same size, so the address of element `i` is a single arithmetic step from the base
address. JavaScript's `Array` is technically a dynamic, resizable, object-like structure,
but engines optimize numeric-keyed arrays to behave like contiguous arrays, so for
interview reasoning we treat it as a **dynamic array**.

### Intuition

Think of a row of numbered lockers, all the same size, glued together in a hallway:

- You can walk **straight** to locker `#5` because you know each locker's width and where
  the row starts — one calculation, no scanning. That's **random access, O(1)**.
- To **insert** a new locker in the middle, everyone to the right must shuffle down one
  spot to make room — that shuffling is what costs `O(n)`.
- To **delete** a locker in the middle, everyone to the right shuffles back to close the
  gap — again `O(n)`.
- Adding at the **end** is cheap (usually `O(1)`), because nobody has to move.

The memory address formula for a contiguous array:

```
address(i) = base_address + i * element_size
```

Because it's a single multiply-and-add, indexing is constant time no matter how large the
array — this is the array's superpower.

### Visual

Contiguous layout and the cost of a middle insert:

```
Index:      0     1     2     3     4
          +-----+-----+-----+-----+-----+
Array:    | 10  | 20  | 30  | 40  | 50  |
          +-----+-----+-----+-----+-----+
addr:     100   104   108   112   116        (4 bytes each; addr(i)=100+4*i)

Insert 99 at index 2  ->  elements 30,40,50 must each shift right:

          +-----+-----+-----+-----+-----+-----+
          | 10  | 20  | 99  | 30  | 40  | 50  |
          +-----+-----+-----+-----+-----+-----+
                        ^     \___ shifted ___/
                     inserted   (O(n) work)
```

Delete at index 1 (`20`) — everything after shifts left to fill the gap:

```
          +-----+-----+-----+-----+           +-----+-----+-----+
          | 10  | 20  | 30  | 40  |    ->     | 10  | 30  | 40  |
          +-----+-----+-----+-----+           +-----+-----+-----+
                  X  <-- removed, then 30,40 shift left (O(n))
```

### Time & Space Complexity

| Operation                         | Complexity | Why                                             |
|-----------------------------------|------------|-------------------------------------------------|
| Access by index `arr[i]`          | `O(1)`     | direct address arithmetic                       |
| Update by index `arr[i] = x`      | `O(1)`     | direct write                                    |
| Search (unsorted) `indexOf`       | `O(n)`     | may scan every element                          |
| Search (sorted) via binary search | `O(log n)` | halve the range each step                       |
| Insert / delete at **end**        | `O(1)`*    | amortized; occasional resize (see below)        |
| Insert / delete at **front**      | `O(n)`     | every element shifts                            |
| Insert / delete in **middle**     | `O(n)`     | elements after the point shift                  |
| Iterate all                       | `O(n)`     | visit each once                                 |

`*` Amortized. Space for the array itself is `O(n)`.

### Common Interview Patterns

- **Two pointers** (`left`/`right`) — converge from both ends (palindrome check, two-sum
  on sorted array, reverse in place, container-with-most-water).
- **Sliding window** — a moving `[left, right]` range for subarray problems (max sum of
  size `k`, longest substring without repeats).
- **Fast & slow pointers** — for cycle/midpoint style problems, and in-place partitioning.
- **Prefix sums** — precompute cumulative sums for `O(1)` range-sum queries.
- **In-place overwrite with a write pointer** — remove duplicates / move zeroes without
  extra space (a "read pointer" scans, a "write pointer" places kept elements).
- **Kadane's algorithm** — running max for maximum-subarray.
- **Sort first** — unlock two-pointer or greedy strategies.

### Template Code

```js
// --- Two pointers: reverse an array IN PLACE (O(n) time, O(1) space) ---
function reverseInPlace(arr) {
  let left = 0;
  let right = arr.length - 1;
  while (left < right) {
    // swap the two ends, then step inward
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++;
    right--;
  }
  return arr;
}

// --- Write-pointer: remove a value in place, return new logical length ---
function removeValue(arr, val) {
  let write = 0;                       // next slot to place a kept element
  for (let read = 0; read < arr.length; read++) {
    if (arr[read] !== val) {           // keep it
      arr[write] = arr[read];
      write++;
    }
  }
  return write;                        // arr[0..write-1] is the result
}

// --- Prefix sums: O(n) build, O(1) range-sum queries ---
function buildPrefix(arr) {
  const prefix = new Array(arr.length + 1).fill(0);
  for (let i = 0; i < arr.length; i++) {
    prefix[i + 1] = prefix[i] + arr[i];  // prefix[k] = sum of first k elements
  }
  return prefix;
}
function rangeSum(prefix, l, r) {        // inclusive sum of arr[l..r]
  return prefix[r + 1] - prefix[l];      // O(1)
}

// --- Sliding window: max sum of any subarray of size k (O(n)) ---
function maxSumWindow(arr, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += arr[i]; // first window
  let best = sum;
  for (let right = k; right < arr.length; right++) {
    sum += arr[right] - arr[right - k];      // slide: add new, drop old
    best = Math.max(best, sum);
  }
  return best;
}
```

### Dry Run

Fully worked canonical example — `removeValue([3, 2, 2, 3, 4], 3)` (remove all `3`s):

```
Start: arr = [3, 2, 2, 3, 4], val = 3, write = 0

read=0 arr[0]=3 == val -> skip.                 write stays 0
read=1 arr[1]=2 != val -> arr[0]=2, write=1     arr=[2,2,2,3,4]
read=2 arr[2]=2 != val -> arr[1]=2, write=2     arr=[2,2,2,3,4]
read=3 arr[3]=3 == val -> skip.                 write stays 2
read=4 arr[4]=4 != val -> arr[2]=4, write=3     arr=[2,2,4,3,4]

Return write = 3.  Result lives in arr[0..2] = [2, 2, 4].
(Positions 3..4 are leftover garbage we ignore.)
```

Two pointers move independently: `read` always advances; `write` only advances when we
keep an element. That's the whole trick behind in-place filtering.

### Common Mistakes

- **Off-by-one on bounds**: using `<= arr.length` (out of range) or `arr.length` as a
  valid index. The last index is `arr.length - 1`.
- **Mutating while iterating** with `splice` inside a `for` loop — indexes shift under you
  and you skip elements. Iterate backward or use a write pointer.
- **Forgetting `splice`/`shift`/`unshift` are `O(n)`**, not `O(1)`. Using `shift()` in a
  loop silently makes it `O(n²)`.
- **Shallow copy confusion**: `const b = a` copies the reference, not the data; mutating
  `b` mutates `a`. Use `[...a]` or `a.slice()` for a shallow copy.
- **Sparse arrays / holes**: `new Array(3)` has length 3 but empty slots; `map` skips
  holes. Prefer `new Array(3).fill(0)`.
- **Comparing arrays with `===`**: that compares references, not contents.

### Edge Cases

- **Empty array** (`length === 0`): loops don't run; make sure return values still make sense.
- **Single element**: two-pointer `left < right` never enters the loop — correct for reverse,
  but check window sizes (`k > length`).
- **All elements equal / all removed**: write pointer ends at `0` or `n`.
- **Negative numbers**: fine for sums; watch assumptions in max/min seeds (seed with
  `-Infinity`, not `0`).
- **`k` larger than array** in windows: guard it.
- **Duplicates**: relevant for "remove duplicates from sorted array" style problems.

### Interview Tips

- **Lead with the constraint-to-complexity link**: "n is 1e5, so I want a single-pass
  `O(n)` two-pointer approach rather than the `O(n²)` brute force."
- **Say "in place, O(1) extra space"** out loud when you achieve it — it's a common bonus ask.
- **Name your pointers meaningfully** (`left/right`, `read/write`, `slow/fast`) so the
  interviewer can follow your invariant.
- **State your loop invariant**: e.g. "everything left of `write` is a kept element." This
  is what separates a memorized answer from real understanding.
- **Clarify whether you may mutate the input** before you do.

### Practice Problems

**Beginner**

- **Two Sum** — return indices of two numbers summing to a target. *Insight:* hash map of
  value→index for `O(n)`; brute force is `O(n²)`. Target: `O(n)` time, `O(n)` space.
- **Maximum Subarray** — largest contiguous-subarray sum. *Insight:* Kadane's running max.
  Target: `O(n)` / `O(1)`.
- **Move Zeroes** — push all zeroes to the end, keep order. *Insight:* write pointer.
  Target: `O(n)` / `O(1)`.
- **Best Time to Buy/Sell Stock** — one buy, one later sell, max profit. *Insight:* track
  min-so-far. Target: `O(n)` / `O(1)`.

**Medium**

- **Product of Array Except Self** — output[i] = product of all others, no division.
  *Insight:* prefix + suffix products. Target: `O(n)` / `O(1)` extra.
- **Container With Most Water** — max area between two lines. *Insight:* two pointers from
  ends, move the shorter. Target: `O(n)` / `O(1)`.
- **3Sum** — all unique triplets summing to zero. *Insight:* sort + two pointers per anchor.
  Target: `O(n²)` / `O(1)`.
- **Subarray Sum Equals K** — count subarrays summing to `k`. *Insight:* prefix sum + hash
  map of counts. Target: `O(n)` / `O(n)`.

**Hard**

- **Trapping Rain Water** — total water trapped between bars. *Insight:* two pointers with
  running left/right max. Target: `O(n)` / `O(1)`.
- **First Missing Positive** — smallest missing positive int. *Insight:* index-as-hash,
  place `k` at position `k-1`. Target: `O(n)` / `O(1)`.
- **Maximum Sliding Window** — max of each window of size `k`. *Insight:* monotonic deque.
  Target: `O(n)` / `O(k)`.

### Frequently Asked Interview Questions

**Q: Why is array access O(1)?**
Elements are contiguous and equally sized, so the address of index `i` is one
`base + i * size` computation — no scanning.

**Q: Why are insert/delete in the middle O(n)?**
All elements after the point must shift by one to keep the block contiguous.

**Q: What is a dynamic array and why is push amortized O(1)?**
A dynamic array over-allocates capacity; most pushes are `O(1)`, and the occasional
full-copy resize (doubling) is spread out so the average is `O(1)`. (See below.)

**Q: Array vs linked list?**
Array: `O(1)` random access, `O(n)` middle insert/delete, cache-friendly. Linked list:
`O(n)` access, `O(1)` insert/delete *given the node*, no contiguous memory.

**Q: Is JavaScript's Array a real array?**
Not strictly — it's a dynamic, resizable object, but engines optimize dense numeric arrays
into contiguous storage, so we reason about it as a dynamic array.

**Q: When would you sort first?**
When sorting unlocks two-pointer/greedy/binary-search strategies and the extra
`O(n log n)` is affordable.

### Dynamic arrays & amortized push (deep-dive)

A dynamic array keeps a `length` (used slots) and a larger `capacity` (allocated slots).
When you push into a full array, it allocates a bigger block (typically **double**),
copies everything over, then adds the new element:

```
cap=4, len=4  [a][b][c][d]              push(e) -> full!
allocate cap=8, copy 4 elems, then set  [a][b][c][d][e][ ][ ][ ]   len=5
```

Copying is `O(n)` but happens rarely. Over `n` pushes the total copy work is
`1 + 2 + 4 + … + n ≈ 2n`, i.e. `O(n)` total, so **amortized `O(1)` per push**. That's why
we say push is `O(1)` even though a single push can occasionally be `O(n)`.

### Revision Notes

- Contiguous memory ⇒ index access is `O(1)` via `base + i*size`.
- Middle/front insert & delete are `O(n)` (shifting).
- End push/pop are amortized `O(1)`; `shift`/`unshift`/`splice` are `O(n)`.
- Dynamic array doubles capacity ⇒ amortized `O(1)` push, `O(n)` total copies.
- Core patterns: two pointers, sliding window, prefix sums, write pointer, Kadane.
- Seed max with `-Infinity`, not `0`, when negatives are possible.
- `const b = a` shares the reference; use `a.slice()`/`[...a]` to copy.
- `===` on arrays compares references, not contents.

### Cheat Sheet

```
Access/Update arr[i] ......... O(1)
Push/Pop (end) ............... O(1) amortized
Shift/Unshift (front) ........ O(n)
Splice (middle) .............. O(n)
Search unsorted / sorted ..... O(n) / O(log n)

Patterns:
  two pointers .... left=0, right=n-1; move inward
  sliding window .. sum += a[r] - a[r-k]
  prefix sum ...... pre[i+1]=pre[i]+a[i]; range=pre[r+1]-pre[l]
  write pointer ... if keep: a[write++]=a[read]
  Kadane .......... cur=max(a[i],cur+a[i]); best=max(best,cur)

Copy: a.slice() or [...a]   |  Compare contents: not === (element-wise)
```

---

## 3. Strings  —  ✅ **MUST-DO (core minimum)**

### Concept

A string is an ordered sequence of characters. Conceptually it behaves like an array of
characters, but in JavaScript strings are **primitive and immutable** — once created, a
string's contents can never be changed in place. Any operation that "modifies" a string
actually builds and returns a **new** string.

Under the hood, JS strings are sequences of UTF-16 code units. For interview purposes,
`str.length` is the number of code units, `str[i]` (or `str.charAt(i)`) reads a character,
and `str.charCodeAt(i)` gives its numeric code — which is what powers frequency counting,
anagram checks, and character-math tricks.

### Intuition

Because strings are immutable, think of them as **read-only arrays**. You can look at any
character in `O(1)`, but you cannot poke a new character into the middle. If you want to
transform a string, the idiomatic move is:

```
string  --split/spread-->  array (mutable)  --work on it-->  join back to a string
```

The single most important performance consequence: **building a string by repeated
concatenation in a loop can be O(n²)**, because each `+=` may create a brand-new string and
copy all prior characters. The fix is to **push pieces into an array and `join('')` once at
the end**, which is `O(n)`.

Character math is the other pillar. Letters have consecutive character codes, so:

```
'a'.charCodeAt(0) === 97      'z' === 122
'A'.charCodeAt(0) === 65      'Z' === 90
index of a letter = char.charCodeAt(0) - 97   // 'a'->0 ... 'z'->25
```

This lets you use a fixed-size array of 26 counters as a tiny hash map for lowercase
letters — `O(1)` space, no object overhead.

### Visual

Immutability — `s[0] = 'H'` silently does nothing; you must rebuild:

```
   s = "hello"     (immutable)
        index: 0   1   2   3   4
             +---+---+---+---+---+
             | h | e | l | l | o |     <- cannot overwrite a slot
             +---+---+---+---+---+

   To "change" index 0 to 'H':
     s = 'H' + s.slice(1)   ->  new string "Hello"   (old one untouched)
```

Efficient build — collect in an array, join once:

```
   Bad  (O(n^2)):  out = ""; loop: out += piece   (copies growing string each time)

   Good (O(n)):    parts = [];
                   loop: parts.push(piece)   ->  ["a"]["b"]["c"] ...
                   result = parts.join("")   ->  "abc"   (single pass at the end)
```

Frequency array as a 26-slot hash for "aabb":

```
   char 'a' -> index 0, 'b' -> index 1
   freq:  [ 2, 2, 0, 0, ... , 0 ]
            a  b  c  d       z
```

### Time & Space Complexity

| Operation                              | Complexity | Note                                          |
|----------------------------------------|------------|-----------------------------------------------|
| Index / `charAt` / `charCodeAt`        | `O(1)`     | random access by position                     |
| `length`                               | `O(1)`     | stored                                        |
| Concatenate two strings (`a + b`)      | `O(n + m)` | builds a new string                           |
| `+=` in a loop (naive build)           | `O(n²)`    | copies the growing prefix each time           |
| Build via array + `join('')`           | `O(n)`     | the correct way                               |
| `slice` / `substring`                  | `O(k)`     | `k` = length of the slice                     |
| `includes` / `indexOf` (substring)     | `O(n·m)`   | naive search (m = pattern length)             |
| `split` / spread to array              | `O(n)`     | one pass                                       |
| Compare two strings (`===`)            | `O(n)`     | worst case compares each char                 |
| Reverse (`split.reverse.join`)         | `O(n)`     | plus `O(n)` space                             |

Space for a string of length `n` is `O(n)`.

### Common Interview Patterns

- **Frequency counting** — `Map` or a 26-length array for anagrams, permutations, first
  unique char.
- **Two pointers** — palindrome checks, reversing, comparing from both ends.
- **Sliding window** — longest substring without repeating chars, minimum window substring.
- **Character math** — `charCodeAt` arithmetic for shifts (Caesar cipher), digit parsing,
  bucketing.
- **Build-with-array** — assemble output pieces, `join('')` at the end.
- **Hashing / grouping** — sorted string or char-count signature as a map key (group anagrams).
- **In-place-ish on a char array** — convert to array when the problem demands mutation.

### Template Code

```js
// --- Frequency map with a 26-slot array (lowercase a-z) ---
function charCounts(str) {
  const freq = new Array(26).fill(0);
  for (const ch of str) {
    freq[ch.charCodeAt(0) - 97]++;   // 'a' -> 0 ... 'z' -> 25
  }
  return freq;
}

// --- Are two strings anagrams? (O(n) time, O(1) space: fixed 26) ---
function isAnagram(a, b) {
  if (a.length !== b.length) return false;   // quick reject
  const freq = new Array(26).fill(0);
  for (let i = 0; i < a.length; i++) {
    freq[a.charCodeAt(i) - 97]++;            // count a
    freq[b.charCodeAt(i) - 97]--;            // discount b
  }
  return freq.every(c => c === 0);           // all balanced?
}

// --- Palindrome check with two pointers (O(n) time, O(1) space) ---
function isPalindrome(str) {
  let left = 0;
  let right = str.length - 1;
  while (left < right) {
    if (str[left] !== str[right]) return false;
    left++;
    right--;
  }
  return true;
}

// --- Efficient string building: array + join (O(n), NOT += in a loop) ---
function repeatVowelsUpper(str) {
  const parts = [];                          // collect pieces here
  for (const ch of str) {
    parts.push('aeiou'.includes(ch) ? ch.toUpperCase() : ch);
  }
  return parts.join('');                     // one O(n) join at the end
}

// --- Reverse a string (strings are immutable, so go via array) ---
function reverseString(str) {
  return str.split('').reverse().join('');   // O(n) time, O(n) space
}
```

### Dry Run

Fully worked canonical example — `isAnagram("anagram", "nagaram")`:

```
Lengths equal (7 == 7) -> proceed. freq = [0]*26.

i=0: a('a'-> idx 0) +1, b('n'->13) -1   freq[0]=1,  freq[13]=-1
i=1: a('n'->13) +1,   b('a'->0)  -1     freq[13]=0, freq[0]=0
i=2: a('a'->0) +1,    b('g'->6)  -1     freq[0]=1,  freq[6]=-1
i=3: a('g'->6) +1,    b('a'->0)  -1     freq[6]=0,  freq[0]=0
i=4: a('r'->17) +1,   b('r'->17) -1     freq[17]=0
i=5: a('a'->0) +1,    b('a'->0)  -1     freq[0]=0
i=6: a('m'->12) +1,   b('m'->12) -1     freq[12]=0

Every counter is 0 -> return true.  ("anagram" and "nagaram" are anagrams.)
```

Note how one pass over both strings simultaneously (one `+`, one `-`) keeps it `O(n)` with
a single fixed-size counter array — no sorting needed.

### Common Mistakes

- **Trying to mutate in place**: `str[0] = 'X'` fails silently. You must rebuild the string.
- **`+=` in a loop** for large strings — accidental `O(n²)`. Use an array + `join`.
- **`sort()` mis-sorts numbers-as-strings** and default `sort()` on chars is lexicographic —
  fine for chars, but remember `.sort()` mutates and returns the array.
- **`length` vs code points**: emoji and other astral characters are 2 UTF-16 code units, so
  `"😀".length === 2`. Use `[...str]` or `for...of` for code-point iteration.
- **Off-by-one in two-pointer palindrome**: loop must be `left < right`, not `<=`.
- **Case / whitespace / punctuation** not normalized when the problem says "ignore" them.
- **`charCodeAt` on the wrong base**: subtract `97` for lowercase, `65` for uppercase — mixing
  them corrupts indexes.

### Edge Cases

- **Empty string** (`""`): length 0; a palindrome by convention; loops don't run.
- **Single character**: always a palindrome; anagram only of itself.
- **Case sensitivity**: `'A' !== 'a'` — normalize with `.toLowerCase()` if required.
- **Non-letter characters**: spaces, digits, punctuation break the "26 letters" assumption —
  use a `Map` instead of a 26-array.
- **Unicode / emoji**: `.length` counts code units, not visible characters.
- **Very long strings**: this is where naive `+=` concatenation blows up to `O(n²)`.

### Interview Tips

- **Call out immutability early**: "Strings are immutable in JS, so I'll convert to an array
  (or collect pieces) and rebuild." Signals you know the language.
- **Justify the 26-array vs Map choice**: 26-array is `O(1)` space and fast for lowercase
  letters; a `Map` generalizes to any character set.
- **Mention the `O(n²)` concatenation trap** and how you avoid it — interviewers love this.
- **Two strings ⇒ keep both sizes**: comparison and concatenation are `O(n + m)`.
- **Normalize inputs explicitly** (case, trimming) and say why, rather than assuming.

### String vs array (when to reach for which)

| Aspect            | String                          | Array                              |
|-------------------|---------------------------------|------------------------------------|
| Mutability        | Immutable (rebuild to change)   | Mutable in place                   |
| Index access      | `O(1)` read only                | `O(1)` read & write                |
| Build efficiently | array + `join('')`              | `push` (amortized `O(1)`)          |
| Best for          | text you read/compare/slice     | data you transform in place        |
| Convert           | `str.split('')` / `[...str]`    | `arr.join('')`                     |

Rule of thumb: **read/compare → keep as string; transform character-by-character → go to an
array, then `join` back.**

### Practice Problems

**Beginner**

- **Valid Palindrome** — ignore non-alphanumerics and case. *Insight:* two pointers with
  skipping. Target: `O(n)` / `O(1)`.
- **Reverse String** — reverse a char array in place. *Insight:* two pointers swap.
  Target: `O(n)` / `O(1)`.
- **Valid Anagram** — are two strings anagrams? *Insight:* 26-array frequency count.
  Target: `O(n)` / `O(1)`.
- **First Unique Character** — index of first non-repeating char. *Insight:* freq map, then
  scan. Target: `O(n)` / `O(1)`.

**Medium**

- **Longest Substring Without Repeating Characters** — length of longest such substring.
  *Insight:* sliding window + last-seen map. Target: `O(n)` / `O(min(n,charset))`.
- **Group Anagrams** — bucket strings that are anagrams. *Insight:* sorted string or
  char-count signature as map key. Target: `O(n·k log k)` / `O(n·k)`.
- **Longest Palindromic Substring** — find it. *Insight:* expand around each center.
  Target: `O(n²)` / `O(1)`.
- **String to Integer (atoi)** — parse with rules. *Insight:* careful state machine +
  overflow clamp. Target: `O(n)` / `O(1)`.

**Hard**

- **Minimum Window Substring** — smallest window of `s` containing all chars of `t`.
  *Insight:* sliding window + need/have counts. Target: `O(n + m)` / `O(charset)`.
- **Longest Substring with At Most K Distinct** — *Insight:* window + freq map, shrink when
  distinct > k. Target: `O(n)` / `O(k)`.
- **Valid Number** — decide if a string is a valid number. *Insight:* deterministic state
  machine. Target: `O(n)` / `O(1)`.

### Frequently Asked Interview Questions

**Q: Are JavaScript strings mutable?**
No — they are immutable primitives. Operations return new strings; you can't change a
character in place.

**Q: Why can concatenating in a loop be O(n²)?**
Each `+=` may allocate a new string and copy the entire prefix, so total work is
`1 + 2 + … + n = O(n²)`. Collect pieces in an array and `join('')` once for `O(n)`.

**Q: How do you count characters efficiently?**
A 26-length array indexed by `charCodeAt(0) - 97` for lowercase letters (`O(1)` space), or a
`Map` for arbitrary characters.

**Q: How do you check for an anagram?**
Compare character frequencies — one balanced pass with a counter array (`O(n)`), which beats
sorting both strings (`O(n log n)`).

**Q: What's the difference between `slice`, `substring`, and `substr`?**
`slice`/`substring` take start/end indices (slice allows negatives); `substr` (deprecated)
takes start + length.

**Q: Does `.length` equal the number of visible characters?**
Not always — it counts UTF-16 code units, so emoji/astral characters count as 2. Use
`[...str]` for true code points.

### Revision Notes

- JS strings are **immutable** — rebuild to "change" them.
- Never `+=` in a loop for big strings (`O(n²)`); use array + `join('')` (`O(n)`).
- Index/`charAt`/`charCodeAt` are `O(1)`; comparison and concat are `O(n)`/`O(n+m)`.
- Letter index trick: `ch.charCodeAt(0) - 97` (lowercase) or `- 65` (uppercase).
- 26-array = `O(1)`-space frequency counter for a-z; `Map` for general charset.
- Anagram = balanced frequency pass (`O(n)`), no sort needed.
- Palindrome / reverse ⇒ two pointers, loop `left < right`.
- `.length` counts UTF-16 code units, not visible glyphs.

### Cheat Sheet

```
Immutable: s[i]='x' does NOTHING. Rebuild: s = a + s.slice(1)

Char math:  idx = ch.charCodeAt(0) - 97   ('a'=97,'A'=65,'0'=48)
Freq (a-z): const f = new Array(26).fill(0); f[ch.charCodeAt(0)-97]++
Freq (any): const m = new Map(); m.set(ch,(m.get(ch)||0)+1)

Build:   parts=[]; parts.push(x); parts.join('')   // O(n), not += 
Reverse: s.split('').reverse().join('')            // O(n)
Palindrome: left=0,right=n-1; while(left<right) compare, move inward

Complexity: index O(1) | concat O(n+m) | naive loop build O(n^2) | includes O(n*m)
```

---

## Part 1 — Recommended Practice Order

Practice these in the following order — each stage makes the next one easier to reason about:

1. **Complexity Analysis & Big-O (Topic 1) first.** This is the lens for everything else.
   Until you can look at a loop and instantly say "that's `O(n)`" or "that nested loop is
   `O(n²)`, too slow", you can't judge whether an array or string solution is good enough.
   Do the "given code, state Big-O" exercises until the common shapes are automatic.

2. **Arrays (Topic 2) second.** Arrays are the substrate for almost every other structure,
   and they introduce the workhorse patterns you'll reuse everywhere: two pointers, sliding
   window, prefix sums, and the in-place write-pointer. Master these here and later topics
   (strings, stacks, heaps, sorting) will feel familiar. Grind the Beginner set (Two Sum,
   Maximum Subarray, Move Zeroes) before touching Medium.

3. **Strings (Topic 3) last in this part.** Strings reuse the array patterns (two pointers,
   sliding window, frequency counting) but add JS-specific concerns — immutability, the
   `O(n²)` concatenation trap, and `charCodeAt` character math. Because they build directly
   on array intuition, doing them after arrays means you're only learning the *new* twist
   each time, not the pattern from scratch.

Within each topic: do **Beginner → Medium → Hard**, and after every problem, say the time
and space complexity out loud and justify it — that keeps Topic 1 sharp while you build the
rest.


---


# Part 2 — Hashing & Window Techniques

## 4. Hash Maps  —  ✅ **MUST-DO (core minimum)**

### Concept
A hash map is a data structure that stores **key → value** pairs and lets you look up, insert, and delete a value by its key in (on average) constant time. In JavaScript you get two flavours: the plain **object** (`{}`) and the built-in **`Map`**. Both are backed by hashing under the hood.

Think of it as a labelled locker room: instead of scanning every locker to find your stuff, you know the locker number (the hash of your key) and go straight to it.

### Intuition
Why is lookup "instant"? A **hash function** turns your key (a string, a number) into an integer, and that integer is reduced (usually modulo the table size) into an index in an internal array (a "bucket"). Because you compute the index directly from the key, you don't search — you jump.

```
key "cat"  --hash-->  90210  --% 16-->  bucket 2
key "dog"  --hash-->  11947  --% 16-->  bucket 11
```

The magic is that finding the bucket costs the same whether you have 10 keys or 10 million. That is the whole reason hash maps dominate interviews: they trade memory for turning O(n) scans into O(1) lookups.

**Collisions**: two different keys can hash to the same bucket ("cat" and "car" both land in bucket 2). Engines resolve this by storing a small list (chaining) or probing nearby slots. As long as the table stays sparse enough (a low *load factor*), collisions are rare and lookups stay O(1) average. When the table fills up, the engine *resizes* and rehashes everything — amortized still O(1).

### Visual
Frequency counting the string `"aabbc"`:

```
input:   a   a   b   b   c
                 |
                 v  build freq map
         +-----+-------+
         | key | value |
         +-----+-------+
         |  a  |   2   |
         |  b  |   2   |
         |  c  |   1   |
         +-----+-------+

internal buckets (conceptual, size 8):
 [0] ->
 [1] -> ("b",2)
 [2] ->
 [3] -> ("a",2) -> ("c",1)   <-- collision: chained list
 ...
```

### Time & Space Complexity
| Operation        | Average | Worst* | Notes |
|------------------|---------|--------|-------|
| Insert / set     | O(1)    | O(n)   | Worst when many collisions or a resize triggers |
| Lookup / get     | O(1)    | O(n)   | Worst if all keys collide into one bucket |
| Delete           | O(1)    | O(n)   | Same collision caveat |
| Iterate all keys | O(n)    | O(n)   | `Map` preserves insertion order |
| Space            | O(n)    | O(n)   | Stores every key + value |

\*Worst case is theoretical (adversarial keys). For interview purposes, assume **O(1) average** and say so.

### Common Interview Patterns
- **Frequency / counting**: count occurrences of chars, numbers, words (anagrams, majority element).
- **Complement lookup**: "have I seen `target - x` before?" (Two Sum).
- **Index map**: store `value → index` to detect distance/order (first repeating, longest substring).
- **Grouping / bucketing**: group anagrams by sorted-key, group by category.
- **Caching / memoization**: store computed results by input key.
- **Seen-before / dedup pairing** with the value carrying extra info (count, last index).

### Template Code
```js
// ---- Map (preferred for algorithmic work) ----
const freq = new Map();
for (const x of arr) {
  freq.set(x, (freq.get(x) ?? 0) + 1); // ?? handles the "first time" case
}
freq.get(k);        // value or undefined
freq.has(k);        // boolean membership
freq.delete(k);     // remove
freq.size;          // count of entries
for (const [key, val] of freq) { /* insertion order */ }

// ---- Index map (value -> index) ----
const indexOf = new Map();
arr.forEach((x, i) => indexOf.set(x, i)); // last index wins

// ---- Plain object as a map (string/number keys only) ----
const count = Object.create(null); // null-proto avoids inherited-key surprises
for (const x of arr) count[x] = (count[x] || 0) + 1;
```

### Dry Run
**Worked example — Two Sum** on `nums = [2, 7, 11, 15]`, `target = 9`. Return indices of the two numbers summing to target.

```js
function twoSum(nums, target) {
  const seen = new Map(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
```

| i | nums[i] | need = 9 - nums[i] | seen before? | action                 | seen after      |
|---|---------|--------------------|--------------|------------------------|-----------------|
| 0 | 2       | 7                  | no           | store 2→0              | {2:0}           |
| 1 | 7       | 2                  | **yes (0)**  | return **[0, 1]**      | —               |

One pass, each op O(1) average → **O(n) time, O(n) space**. Beats the brute force O(n²) double loop.

### Common Mistakes
- Using `freq.get(x) + 1` without defaulting → `NaN` on first insert. Use `(freq.get(x) ?? 0) + 1`.
- Using a plain object and hitting **prototype keys** (`"constructor"`, `"__proto__"`). Prefer `Map` or `Object.create(null)`.
- Object keys are **always strings** — `obj[1]` and `obj["1"]` collide; `Map` keeps `1` and `"1"` distinct.
- Storing the wrong side in a value→index map, then returning stale/overwritten indices.
- Forgetting `Map` uses **SameValueZero** equality: object keys compare by reference, not by contents (`{a:1}` ≠ another `{a:1}`).
- Iterating an object with `for...in` and picking up inherited enumerable props (use `Object.keys` / `Map`).

### Edge Cases
- Empty input → empty map, return default (`[]`, `0`, etc.).
- Single element → complement/pair patterns must not match an element with itself unless allowed.
- Duplicates → decide whether count matters or "seen" is enough.
- Negative numbers and `0` as keys work fine in `Map`; as object keys they stringify.
- `NaN` as a key: `Map` treats all `NaN` as equal (SameValueZero) — usable as a key.
- Very large key space → watch memory (space is O(n)).

### Interview Tips
- Say the phrase: *"I'll trade space for time with a hash map to get O(1) average lookups."*
- Always state **average O(1)** and acknowledge the theoretical worst case if asked.
- Default to `Map` in JS interviews; justify it (real key types, size, insertion order, no prototype traps).
- When you write the double loop first, immediately name what repeated work the map removes.

### Practice Problems
**Beginner**
- **Two Sum** — indices of two numbers summing to target. *Complement map, O(n).*
- **Valid Anagram** — are two strings anagrams? *Char frequency map compare, O(n).*
- **Contains Duplicate** — any value appears twice? *Seen set/map, O(n).*
- **First Unique Character** — first non-repeating char index. *Frequency map + second pass, O(n).*

**Medium**
- **Group Anagrams** — group words that are anagrams. *Sorted-string key → list, O(n·k log k).*
- **Top K Frequent Elements** — k most frequent. *Freq map + bucket/heap, O(n).*
- **Subarray Sum Equals K** — count subarrays summing to k. *Prefix sum + count map, O(n).*
- **Longest Consecutive Sequence** — longest run of consecutive ints. *Hash set of nums, O(n).*

**Hard**
- **LRU Cache** — get/put in O(1). *Map (insertion order) or map + doubly linked list.*
- **Minimum Window Substring** — smallest window containing all target chars. *Freq map + sliding window, O(n).*

### Frequently Asked Interview Questions
- **Q: Map vs plain object — which and why?** A: `Map` for algorithms: any key type, `.size`, insertion-order iteration, no prototype pollution, faster for frequent add/delete. Object for small fixed string-keyed records or JSON.
- **Q: How does a hash map get O(1)?** A: A hash function maps the key to a bucket index directly, so no scanning. Average O(1) given a good hash and low load factor.
- **Q: What is a collision and how is it handled?** A: Two keys hashing to the same bucket; resolved by chaining (list per bucket) or open addressing (probe). Kept rare by resizing.
- **Q: When is it O(n)?** A: Pathological collisions (all keys same bucket) or the moment a resize rehashes everything (amortized still O(1)).
- **Q: Are object keys ordered?** A: Integer-like keys sort ascending, string keys keep insertion order — subtle. `Map` is cleanly insertion-ordered.

### Revision Notes
- Hash map = key→value, **O(1) average** get/set/delete, O(n) space.
- In JS prefer **`Map`**; plain object stringifies keys and risks prototype traps.
- `(m.get(k) ?? 0) + 1` is the frequency-count idiom.
- Two Sum pattern: store what you've seen, look up the complement.
- Collisions handled by chaining/probing; kept rare by load factor + resize.
- Worst case O(n), but say **average O(1)** in interviews.

### Cheat Sheet
```js
const m = new Map();
m.set(k, v); m.get(k); m.has(k); m.delete(k); m.size;
for (const [k, v] of m) {}
// frequency: m.set(x, (m.get(x) ?? 0) + 1)
// two-sum:   if (m.has(target - x)) return [m.get(target - x), i]; m.set(x, i);
```
| Need | Reach for |
|------|-----------|
| Count things | `Map` value = count |
| Find pair/complement | `Map` value→index |
| Group things | `Map` key→array |

---

## 5. Hash Sets  —  ✅ **MUST-DO (core minimum)**

### Concept
A hash set stores a collection of **unique values** with O(1) average membership tests, insertion, and deletion. It's a hash map that only cares about keys — there are no values. In JavaScript this is the built-in **`Set`**.

Use it to answer one question fast: *"Have I already seen this?"*

### Intuition
A set is a map where the value is irrelevant — you only track presence. Same hashing machinery, same O(1) average behaviour. The two things a set gives you cleanly:
1. **Membership**: "is `x` in the collection?" without scanning.
2. **Deduplication**: adding a value that's already present is a no-op, so the set naturally holds distinct items.

If you find yourself doing `arr.includes(x)` inside a loop (that's O(n) each time → O(n²) total), a set turns it into O(1) each → O(n) total. That swap is one of the most common optimizations interviewers want to see.

### Visual
Dedup `[3, 1, 3, 2, 1]` → distinct `{3, 1, 2}`:

```
stream: 3   1   3   2   1
        |   |   |   |   |
        v   v   v   v   v
set:  {3} {3,1} {3,1} {3,1,2} {3,1,2}
        +   +   skip   +      skip
```

Membership check `has(2)` → hash 2 → jump to its bucket → present → `true`, no scan.

### Time & Space Complexity
| Operation      | Average | Worst | Notes |
|----------------|---------|-------|-------|
| add            | O(1)    | O(n)  | Duplicate add is a no-op |
| has (member?)  | O(1)    | O(n)  | The headline feature |
| delete         | O(1)    | O(n)  | |
| iterate        | O(n)    | O(n)  | Insertion order preserved |
| build from arr | O(n)    | O(n)  | `new Set(arr)` |
| Space          | O(n)    | O(n)  | One slot per unique value |

### Common Interview Patterns
- **Seen-before / cycle-of-visits**: track visited nodes, indices, or states.
- **Dedup**: `[...new Set(arr)]` to get unique values.
- **Fast membership** inside a loop instead of `includes`/`indexOf`.
- **Set operations**: intersection, union, difference between two collections.
- **Existence for O(n) tricks**: e.g. Longest Consecutive Sequence checks `has(x-1)` to find run starts.

### Template Code
```js
const seen = new Set();
seen.add(x);       // insert (dup = no-op)
seen.has(x);       // membership, O(1) avg
seen.delete(x);    // remove
seen.size;         // count of distinct

// dedup an array
const unique = [...new Set(arr)];

// build from array for fast lookups
const pool = new Set(arr);
if (pool.has(target)) { /* ... */ }

// set operations
const A = new Set(a), B = new Set(b);
const inter = [...A].filter(x => B.has(x)); // intersection
const uni   = new Set([...a, ...b]);        // union
const diff  = [...A].filter(x => !B.has(x));// A minus B
```

### Dry Run
**Worked example — Contains Duplicate** on `[1, 2, 3, 1]`:

```js
function containsDuplicate(nums) {
  const seen = new Set();
  for (const x of nums) {
    if (seen.has(x)) return true; // already present -> duplicate
    seen.add(x);
  }
  return false;
}
```

| step | x | seen.has(x)? | action        | seen after |
|------|---|--------------|---------------|------------|
| 1    | 1 | no           | add 1         | {1}        |
| 2    | 2 | no           | add 2         | {1,2}      |
| 3    | 3 | no           | add 3         | {1,2,3}    |
| 4    | 1 | **yes**      | return `true` | —          |

Single pass, O(1) ops → **O(n) time, O(n) space**.

### Common Mistakes
- Using `Set` when you actually need to **store data per key** — that's a `Map`, not a `Set`.
- Expecting `Set` to dedup **objects by value** — it dedups by reference; two distinct `{x:1}` objects are both kept.
- `set.contains(x)` — the method is **`has`**, not `contains` (that's arrays-in-other-languages muscle memory).
- Converting to a set to dedup then relying on a specific order other than insertion order.
- Using an array's `includes` inside a loop and forgetting it re-introduces O(n²).
- Forgetting `Set` uses SameValueZero: `NaN` dedups correctly, `+0`/`-0` treated equal.

### Edge Cases
- Empty input → empty set, size 0.
- All duplicates → set collapses to one element.
- Mixed types → `1` and `"1"` are distinct members.
- Objects/arrays as members → compared by reference.
- Large input → O(n) memory; fine but state it.

### Interview Tips
- Reach for a set the instant you hear **"unique," "distinct," "seen," or "already visited."**
- If you wrote `arr.includes(x)` in a loop, say aloud: *"this is O(n²); a Set makes membership O(1)."*
- Clarify whether the interviewer wants dedup **by value or by identity** for objects.

### Practice Problems
**Beginner**
- **Contains Duplicate** — any repeat? *Seen set, O(n).*
- **Intersection of Two Arrays** — common distinct elements. *Two sets, O(n+m).*
- **Missing Number** — find missing in 0..n. *Set membership or sum trick, O(n).*
- **Unique Email Addresses** — count distinct normalized emails. *Set of normalized strings.*

**Medium**
- **Longest Consecutive Sequence** — longest run of consecutive ints. *Set + only start runs at values with no `x-1`, O(n).*
- **Happy Number** — detect cycle in digit-square sums. *Set of seen states (or fast/slow), O(log n) states.*
- **Single Number** — the one non-duplicated value. *Set toggle or XOR (XOR is O(1) space).*

**Hard**
- **Substring with Concatenation of All Words** — windows matching a multiset of words. *Set/map of words + sliding window.*

### Frequently Asked Interview Questions
- **Q: Set vs Map — when each?** A: `Set` when you only need presence/uniqueness; `Map` when each key carries associated data (a count, an index, an object).
- **Q: How do you dedup an array in JS?** A: `[...new Set(arr)]`, O(n).
- **Q: Does `Set` dedup objects?** A: Only by reference — same object instance. Distinct objects with equal contents both stay.
- **Q: Set membership complexity?** A: O(1) average, O(n) worst, like any hash structure.
- **Q: Is `Set` ordered?** A: Yes — insertion order on iteration.

### Revision Notes
- `Set` = unique values, O(1) average `add`/`has`/`delete`.
- Method is `has`, not `contains`.
- `[...new Set(arr)]` dedups in O(n).
- Replaces `includes`-in-a-loop to kill O(n²).
- Dedups objects by **reference**, not value.
- Choose `Set` for presence, `Map` for presence + data.

### Cheat Sheet
```js
const s = new Set(arr);
s.add(x); s.has(x); s.delete(x); s.size;
const unique = [...new Set(arr)];
```
| Question in prompt | Tool |
|--------------------|------|
| "unique / distinct" | `Set` |
| "have I seen it?" | `Set` |
| "how many times / which index?" | `Map` |

---

## 6. Two Pointers  —  ✅ **MUST-DO (core minimum)**

### Concept
Two pointers is a technique where you keep **two indices** into a sequence and move them under some rule, so you examine the structure in one pass instead of with nested loops. The two classic flavours:
- **Opposite ends**: `left` starts at 0, `right` at the end; they move toward each other.
- **Same direction**: both start near the front; one races ahead (`fast`) while the other lags (`slow`).

### Intuition
When data is **sorted** (or has monotonic structure), you don't need to test every pair. If `nums[left] + nums[right]` is too big, the only way to shrink the sum is to move `right` left — moving `left` would only grow it. That single deduction lets you discard a whole column of the O(n²) pair matrix per step, collapsing it to O(n).

For same-direction problems, the two pointers maintain an **invariant boundary**: everything behind `slow` is "already processed/kept," and `fast` scans ahead deciding what to bring back. This powers in-place partitioning and dedup without extra arrays.

The **fast/slow** variant (Floyd's) exploits that a faster runner laps a slower one on a circular track — used to detect cycles in linked lists.

### Visual
Opposite-ends, find a pair summing to 6 in sorted `[1,2,4,7,9]`:

```
idx:   0   1   2   3   4
val:  [1   2   4   7   9]
       L               R      1+9=10 > 6  -> move R left
       L           R          1+7= 8 > 6  -> move R left
       L       R              1+4= 5 < 6  -> move L right
           L   R              2+4= 6 == 6 -> found (indices 1,2)
```

Same-direction in-place (move zeros to end of `[0,1,0,3]`):

```
[0 1 0 3]
 s
 f          nums[f]=0 skip, f++
[0 1 0 3]
 s   f      nums[f]=1 !=0 -> swap(s,f), s++
[1 0 0 3]
   s   f    ... continue
```

### Time & Space Complexity
| Variant                 | Time  | Space | Notes |
|-------------------------|-------|-------|-------|
| Opposite ends (sorted)  | O(n)  | O(1)  | Single sweep inward |
| + sort first            | O(n log n) | O(1)/O(log n) | Sort dominates |
| Same-direction partition| O(n)  | O(1)  | In-place |
| Fast/slow cycle detect  | O(n)  | O(1)  | No extra set needed |

Each pointer moves at most n steps total, so the loop is linear.

### Common Interview Patterns
- **Sorted-array pair/triple sums**: Two Sum II, 3Sum, 4Sum (fix one, two-pointer the rest).
- **In-place partitioning / removal**: remove duplicates from sorted array, move zeroes, Dutch-flag sort.
- **Palindrome / reverse**: compare/swap from both ends.
- **Merging**: merge two sorted arrays from the back.
- **Fast/slow**: linked-list cycle detection, find middle, find cycle start.
- **Container problems**: Container With Most Water (greedy shrink of shorter side).

### Template Code
```js
// ---- Opposite ends: find pair summing to target in SORTED array ----
function twoSumSorted(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;   // need bigger -> move left up
    else right--;               // need smaller -> move right down
  }
  return [];
}

// ---- Same direction: in-place remove value / partition ----
function removeElement(nums, val) {
  let slow = 0;                 // next write position
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== val) {
      nums[slow] = nums[fast];  // keep it
      slow++;
    }
  }
  return slow;                  // new logical length
}

// ---- Fast/slow: detect cycle in a linked list ----
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;           // 1 step
    fast = fast.next.next;      // 2 steps
    if (slow === fast) return true;
  }
  return false;
}
```

### Dry Run
**Worked example — Valid Palindrome** on `"abba"` (compare ends inward):

```js
function isPalindrome(s) {
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++; right--;
  }
  return true;
}
```

| left | right | s[left] | s[right] | equal? | action        |
|------|-------|---------|----------|--------|---------------|
| 0    | 3     | a       | a        | yes    | left→1,right→2|
| 1    | 2     | b       | b        | yes    | left→2,right→1|
| 2    | 1     | —       | —        | loop ends (`left<right` false) | return `true` |

Each char visited once → **O(n) time, O(1) space**.

### Common Mistakes
- Using two pointers on an **unsorted** array for pair sums — the shrink logic requires sorted order (or sort first).
- Loop condition `left <= right` vs `left < right`: for pairs of *distinct* indices use `<`; when a middle element can be its own thing, use `<=`.
- **Skipping duplicates** wrong in 3Sum → duplicate triples in the answer. Advance both pointers past equal values.
- In fast/slow, checking `fast.next.next` without first checking `fast && fast.next` → null dereference.
- Mutating the array while also reading original values you still need.
- Off-by-one on the "write pointer" — `slow` is the next write index, so return `slow` (a length), not `slow-1`, unless you mean an index.

### Edge Cases
- Empty array / string → loop never runs, return default.
- Single element → opposite-ends loop skipped; same-direction keeps it.
- All duplicates → dedup/partition must handle runs.
- No valid pair → return `[]`/`-1`.
- Linked list of length 0 or 1, or with the cycle at the head.
- Negative numbers: opposite-ends sum logic still holds as long as sorted.

### Interview Tips
- Explicitly state the **precondition** ("this works because the array is sorted") — interviewers watch for it.
- Narrate the **invariant** for same-direction: "everything left of `slow` is finalized."
- For sum problems, mention brute force O(n²) first, then "sorting + two pointers gives O(n log n)."
- For cycle detection, contrast with the O(n)-space `Set` approach and highlight O(1) space as the win.

### Practice Problems
**Beginner**
- **Two Sum II (sorted)** — pair summing to target in sorted array. *Opposite ends, O(n).*
- **Valid Palindrome** — ignore non-alphanumerics, case. *Ends inward, O(n).*
- **Reverse String** — in place. *Swap ends, O(n)/O(1).*
- **Remove Duplicates from Sorted Array** — in place, return new length. *Slow/fast write, O(n).*
- **Move Zeroes** — push zeros to end, keep order. *Slow/fast swap, O(n).*

**Medium**
- **3Sum** — triples summing to zero, no dups. *Sort + fix i + two-pointer, O(n²).*
- **Container With Most Water** — max area between lines. *Ends inward, move shorter side, O(n).*
- **Sort Colors (Dutch flag)** — sort 0/1/2 in place. *Three pointers, O(n).*
- **Linked List Cycle** — detect a cycle. *Fast/slow, O(1) space.*
- **Find the Middle of a Linked List** — *Fast/slow, one pass.*

**Hard**
- **Trapping Rain Water** — water trapped between bars. *Two pointers with left/right max, O(n)/O(1).*
- **4Sum** — quadruples summing to target. *Sort + two nested + two-pointer, O(n³).*
- **Linked List Cycle II** — find cycle start node. *Floyd's + reset one pointer, O(1) space.*

### Frequently Asked Interview Questions
- **Q: When do two pointers apply?** A: When the input is sorted or monotonic, or when you can maintain an invariant boundary in one pass — pair sums, partitioning, palindromes, merging.
- **Q: Why does the sorted-pair-sum shrink work?** A: If sum > target, the largest element can't be in any valid pair with anything larger, so decrement `right`; symmetric for `left`.
- **Q: Fast/slow vs hash set for cycles?** A: Both O(n) time; fast/slow is O(1) space, the set is O(n). Prefer fast/slow.
- **Q: How do you avoid duplicate triples in 3Sum?** A: Sort, then skip equal neighbours for the fixed index and after finding a match.
- **Q: What invariant does same-direction maintain?** A: Everything before `slow` is already processed/valid; `fast` explores and feeds `slow`.

### Revision Notes
- Two flavours: **opposite ends** (sorted, shrink) and **same direction** (invariant boundary).
- Opposite-ends sum: `sum<target → left++`, `sum>target → right--`.
- Same-direction: `slow` = write index, `fast` = scan index.
- Fast/slow (Floyd's) = O(1)-space cycle detection.
- Precondition is usually **sorted**; sorting costs O(n log n).
- Skip duplicates carefully in kSum problems.
- Almost always O(1) extra space.

### Cheat Sheet
```js
// sorted pair sum
let l=0, r=n-1;
while (l<r){ const s=a[l]+a[r]; if(s===t)return[l,r]; s<t?l++:r--; }

// in-place keep
let slow=0;
for(let fast=0; fast<n; fast++) if(keep(a[fast])) a[slow++]=a[fast];

// fast/slow
while(fast&&fast.next){ slow=slow.next; fast=fast.next.next; if(slow===fast)/*cycle*/; }
```

---

## 7. Sliding Window  —  ✅ **MUST-DO (core minimum)**

### Concept
A sliding window keeps a **contiguous range** `[left, right]` over an array or string and slides it across the input, maintaining some running summary (a sum, a count, a frequency map) so you never recompute the whole range from scratch. It's the go-to for "best/longest/shortest contiguous subarray or substring" problems.

- **Fixed window**: the size `k` never changes — it slides by adding the new element and dropping the oldest.
- **Variable window**: `right` expands to include more; `left` shrinks when a constraint breaks.

### Intuition
Brute force checks every subarray: O(n²) or worse. But adjacent windows overlap almost entirely — sliding from `[0..k-1]` to `[1..k]` only adds one element and removes one. So instead of re-summing, you **update incrementally in O(1)** per step. Total work becomes O(n).

For variable windows the key idea is an **invariant**: "the window is always valid." You grow the window (move `right`) greedily; the moment it violates the constraint (too many distinct chars, sum too big), you shrink from the left (move `left`) until it's valid again. Each pointer only ever moves forward, so even though there are two nested-looking moves, each element enters and leaves the window at most once → O(n) amortized.

### Visual
**Fixed** window sum, `k=3` over `[2,1,5,1,3]`:

```
[2 1 5] 1 3    sum=8   <- initial window
 2 [1 5 1] 3   sum=8-2+1 = 7
 2 1 [5 1 3]   sum=7-1+3 = 9   <- max
      window slides right: +new  -old
```

**Variable** window — longest substring without repeating chars in `"abcabc"`:

```
a b c a b c
L                 window "a"
L R               grow -> "abc" (all unique, len 3)
  L R (dup 'a')   shrink left past first 'a' -> "bca"
      ...         window never holds a duplicate; track max len = 3
```

### Time & Space Complexity
| Variant          | Time | Space | Notes |
|------------------|------|-------|-------|
| Fixed window     | O(n) | O(1)  | Each element added/removed once |
| Variable window  | O(n) | O(k)  | `left`/`right` each move ≤ n; map holds ≤ k distinct |
| Brute force (compare) | O(n²)/O(n³) | — | What you're beating |

"Amortized O(n)": the inner shrink loop is not per-iteration cost — across the whole run `left` advances at most n times total.

### Common Interview Patterns
- **Fixed k**: max/min/average of subarray of size k; max sum; count of anagrams of a pattern.
- **Longest window** satisfying a constraint: longest substring with ≤ k distinct, longest without repeats.
- **Shortest window** satisfying a constraint: minimum window substring, smallest subarray with sum ≥ target.
- **At most K → exactly K** trick: `exactly(K) = atMost(K) - atMost(K-1)` for counting subarrays.
- **Frequency-matched windows**: permutation in string, find all anagrams.

### Template Code
```js
// ---- Fixed-size window (size k) ----
function maxSumWindow(nums, k) {
  let sum = 0, best = -Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];               // add incoming
    if (right >= k - 1) {             // window is full
      best = Math.max(best, sum);
      sum -= nums[right - (k - 1)];   // drop outgoing
    }
  }
  return best;
}

// ---- Variable window: longest subarray/substring satisfying a constraint ----
function longestValid(s) {
  const need = new Map();             // window state (e.g. char counts)
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    // 1) include s[right]
    need.set(s[right], (need.get(s[right]) ?? 0) + 1);
    // 2) shrink while window is INVALID
    while (/* constraint violated */ need.get(s[right]) > 1) {
      need.set(s[left], need.get(s[left]) - 1);
      left++;
    }
    // 3) window is valid here -> record answer
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

### Dry Run
**Worked example — Longest Substring Without Repeating Characters** on `"abba"`:

```js
function lengthOfLongestSubstring(s) {
  const count = new Map();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    count.set(c, (count.get(c) ?? 0) + 1);
    while (count.get(c) > 1) {           // duplicate -> shrink
      const l = s[left];
      count.set(l, count.get(l) - 1);
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

| right | c | window before shrink | shrink? | window after | best |
|-------|---|----------------------|---------|--------------|------|
| 0 | a | "a"      | no  | "a"  | 1 |
| 1 | b | "ab"     | no  | "ab" | 2 |
| 2 | b | "abb"    | yes → drop 'a','b' until one 'b' → left=2 | "b" | 2 |
| 3 | a | "ba"     | no  | "ba" | 2 |

Answer **2**. Each index enters once, `left` advances only forward → **O(n) time, O(min(n, charset)) space**.

### Common Mistakes
- Recomputing the window sum/count from scratch each step → back to O(n²). The point is **incremental** update.
- Forgetting to **drop the outgoing element** in a fixed window (`sum -= nums[right-k+1]`).
- Off-by-one on window size: window length is `right - left + 1`; full-fixed check is `right >= k - 1`.
- Shrinking with an `if` when the constraint can be violated by more than one unit — use a `while`.
- Recording the answer at the wrong time (before the window is made valid again).
- Using `left++` but forgetting to decrement/clean the state for the element you removed.
- Mishandling the empty map default (`?? 0`).

### Edge Cases
- Empty input → return 0 / default.
- `k` larger than array length (fixed window never fills) → guard/return default.
- All identical characters → variable window may stay size 1.
- All unique → window equals whole array.
- Negative numbers break the "sum ≥ target shrink" monotonicity for *some* problems — sliding window needs the shrink to be monotonic (works for non-negative sums; for negatives use prefix sum + map instead).
- Single element.

### Interview Tips
- Recognize the trigger words: **"contiguous," "subarray," "substring," "longest/shortest," "at most k."**
- Say: *"Windows overlap, so I update in O(1) per step instead of re-scanning → O(n)."*
- Justify amortized O(n): "`left` and `right` each move forward at most n times."
- State the **invariant** clearly: what makes the window valid, when you shrink.
- If sums can be negative, flag that sliding window may not apply and pivot to prefix sum + hashmap.

### Practice Problems
**Beginner**
- **Maximum Average Subarray I** — max average of size k. *Fixed window sum, O(n).*
- **Maximum Sum Subarray of Size K** — *Fixed window, O(n).*
- **Contains Duplicate II** — duplicate within distance k. *Fixed window set, O(n).*

**Medium**
- **Longest Substring Without Repeating Characters** — *Variable window + last-seen map, O(n).*
- **Longest Repeating Character Replacement** — longest window after ≤ k replacements. *Window + maxFreq, O(n).*
- **Permutation in String** — does s2 contain a permutation of s1? *Fixed window freq match, O(n).*
- **Find All Anagrams in a String** — all start indices. *Fixed window freq, O(n).*
- **Minimum Size Subarray Sum** — shortest subarray with sum ≥ target. *Variable window shrink, O(n).*
- **Fruit Into Baskets** — longest subarray with ≤ 2 distinct. *At-most-k window, O(n).*

**Hard**
- **Minimum Window Substring** — smallest window containing all of t's chars. *Variable window + need/have counts, O(n).*
- **Sliding Window Maximum** — max of each size-k window. *Monotonic deque, O(n).*
- **Subarrays with K Different Integers** — exactly K distinct. *atMost(K)-atMost(K-1), O(n).*

### Frequently Asked Interview Questions
- **Q: How do you know to use a sliding window?** A: Contiguous subarray/substring + an optimization ("longest/shortest/max/at most k"). Non-contiguous or needing every pair → different technique.
- **Q: Fixed vs variable window?** A: Fixed size k slides by add-one/drop-one; variable grows with `right` and shrinks with `left` when a constraint breaks.
- **Q: Why is it O(n) if there's a nested while?** A: Amortized — `left` advances at most n times over the whole run, not per outer step.
- **Q: When does sliding window fail?** A: When the shrink condition isn't monotonic — e.g. negative numbers with sum constraints. Use prefix sum + hashmap then.
- **Q: How do you count subarrays with exactly K?** A: `atMost(K) - atMost(K-1)`.

### Revision Notes
- Window = `[left, right]`, length `right - left + 1`.
- Fixed: add incoming, drop `nums[right-k+1]` once full.
- Variable: expand `right` always, shrink `left` **while invalid**.
- Update state incrementally → O(n), not O(n²).
- Amortized O(n): each pointer moves forward ≤ n total.
- Trigger words: contiguous, longest/shortest, at most k.
- Negatives + sum constraint → prefer prefix sum + map.

### Cheat Sheet
```js
// fixed
let sum=0,best=-Infinity;
for(let r=0;r<n;r++){ sum+=a[r]; if(r>=k-1){best=Math.max(best,sum); sum-=a[r-k+1];} }

// variable (longest valid)
let l=0,best=0;
for(let r=0;r<n;r++){ add(a[r]); while(invalid()){ remove(a[l]); l++; } best=Math.max(best,r-l+1); }
```
| Want | Window move |
|------|-------------|
| longest valid | shrink only when invalid |
| shortest valid | shrink while still valid, record min |
| fixed k | add r, drop r-k+1 |

---

## 8. Prefix Sum  —  ✅ **MUST-DO (core minimum)**

### Concept
A prefix sum (a.k.a. cumulative sum) is a precomputed array where `prefix[i]` holds the sum of all elements **before** index `i`. Once built, the sum of any range `[i, j]` is a single subtraction — O(1) — instead of re-adding the elements each time. It turns repeated range-sum queries from O(n) each into O(1) each after an O(n) setup.

### Intuition
If you know the running total up to `j+1` and the running total up to `i`, then everything in between is just the difference:

```
sum(i..j) = prefix[j+1] - prefix[i]
```

It's the discrete version of "distance = odometer_end − odometer_start." The odometer (prefix array) is filled once; every trip length is then a subtraction.

The **superpower combo** is prefix sum **+ a hash map**: as you sweep left to right you keep the running sum, and you ask "have I seen a running sum equal to `current - k` before?" If yes, the subarray between those two points sums to exactly `k`. This handles negatives (where sliding window fails) and counts subarrays in O(n).

### Visual
Array and its prefix (`prefix[0]=0`, `prefix[i]=prefix[i-1]+arr[i-1]`):

```
index:      0   1   2   3   4
arr:      [ 3   1   4   1   5 ]
prefix: [0   3   4   8   9  14]
          ^                  ^
       prefix[0]         prefix[5]

sum of arr[1..3] (values 1,4,1 = 6)
   = prefix[4] - prefix[1]
   = 9 - 3
   = 6   ✓
```

Prefix + map for "sum == k":

```
running sum:  ... reaches S at index j
if (S - k) was a previous running sum at index i
   then arr[i..j-1] sums to k
```

### Time & Space Complexity
| Operation                         | Time | Space | Notes |
|-----------------------------------|------|-------|-------|
| Build prefix array                | O(n) | O(n)  | One pass; O(1) space if you overwrite in place |
| Range sum query (after build)     | O(1) | —     | One subtraction |
| m queries (naive)                 | O(n·m) | —   | What prefix sum beats |
| m queries (prefix)                | O(n + m) | O(n) | Setup + O(1) each |
| Subarray-sum-equals-k (prefix+map)| O(n) | O(n)  | One pass |
| 2D prefix build / query           | O(m·n) / O(1) | O(m·n) | Rectangle sum in O(1) |

### Common Interview Patterns
- **Many range-sum queries** on a static array → precompute prefix.
- **Subarray sum equals k** (count or existence) → prefix + hashmap of seen sums.
- **Subarray divisible by k / longest with sum k** → hashmap keyed by `sum % k` or by sum.
- **Running/cumulative metrics**: equilibrium index, pivot index, product-except-self (prefix + suffix).
- **2D region sums**: immutable matrix range sum with a 2D prefix table.
- **Difference array** (inverse): apply many range updates in O(1) each, then one pass.

### Template Code
```js
// ---- 1D prefix sum + O(1) range queries ----
function buildPrefix(arr) {
  const prefix = new Array(arr.length + 1).fill(0);
  for (let i = 0; i < arr.length; i++) {
    prefix[i + 1] = prefix[i] + arr[i]; // prefix[i] = sum of arr[0..i-1]
  }
  return prefix;
}
// inclusive sum of arr[i..j]:
const rangeSum = (prefix, i, j) => prefix[j + 1] - prefix[i];

// ---- Subarray sum equals k (count of subarrays) ----
function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]); // running sum 0 seen once (empty prefix)
  let sum = 0, count = 0;
  for (const x of nums) {
    sum += x;
    count += seen.get(sum - k) ?? 0;         // subarrays ending here summing to k
    seen.set(sum, (seen.get(sum) ?? 0) + 1);  // record this running sum
  }
  return count;
}

// ---- 2D prefix (brief): rectangle sum in O(1) ----
// pre[r+1][c+1] = sum of matrix[0..r][0..c]
// sum of rect (r1,c1)-(r2,c2) =
//   pre[r2+1][c2+1] - pre[r1][c2+1] - pre[r2+1][c1] + pre[r1][c1]
```

### Dry Run
**Worked example — Subarray Sum Equals K** on `nums = [1, 2, 3]`, `k = 3`. Expected count = 2 (`[1,2]` and `[3]`).

```
seen = {0:1}, sum=0, count=0

x=1: sum=1;  need sum-k = 1-3 = -2; seen[-2]? no  -> count=0
     record sum=1  -> seen={0:1, 1:1}

x=2: sum=3;  need 3-3 = 0;  seen[0]=1  -> count += 1 = 1   (subarray [1,2])
     record sum=3  -> seen={0:1, 1:1, 3:1}

x=3: sum=6;  need 6-3 = 3;  seen[3]=1  -> count += 1 = 2   (subarray [3])
     record sum=6  -> seen={0:1, 1:1, 3:1, 6:1}

return 2 ✓
```

The seed `{0:1}` is what lets a prefix that *itself* equals k count (subarray starting at index 0). One pass → **O(n) time, O(n) space**.

### Common Mistakes
- **Off-by-one** on the prefix convention. Using the `prefix[0]=0`, length `n+1` form makes `sum(i..j)=prefix[j+1]-prefix[i]` clean — pick one convention and stick to it.
- Forgetting to seed the map with `{0:1}` in subarray-sum-k → misses subarrays that start at index 0.
- **Incrementing the map before checking** the complement when counting subarrays where a zero-length or self-overlap matters (order: check `sum-k`, then record `sum`).
- Assuming sliding window works with **negative numbers** — it doesn't for sum constraints; prefix + map does.
- Integer sums overflowing in other languages (JS numbers are fine up to 2^53, but mention it).
- Mixing inclusive/exclusive indices in range queries.

### Edge Cases
- Empty array → prefix is `[0]`, all range sums of empty range = 0.
- Single element.
- `k = 0` → counts subarrays summing to zero (needs correct map seeding).
- Negative numbers and zeros → the reason to use prefix+map over sliding window.
- All elements equal → many repeated prefix sums; the map's counts matter.
- Large arrays → O(n) space for prefix/map.

### Interview Tips
- Trigger phrase: **"range sum," "sum equals k," "subarray sum," or many queries on a static array.**
- Say: *"I'll precompute prefix sums so each query is O(1); build is O(n)."*
- For sum-equals-k, explicitly explain the `{0:1}` seed — interviewers love that detail.
- Contrast with sliding window: *"sliding window needs monotonic sums; with negatives I switch to prefix + hashmap."*
- Mention 2D prefix and difference arrays as extensions to show range.

### Practice Problems
**Beginner**
- **Running Sum of 1d Array** — output cumulative sums. *Direct prefix, O(n).*
- **Range Sum Query - Immutable** — many range queries, static array. *Prefix array, O(1)/query.*
- **Find Pivot Index** — index where left sum == right sum. *Prefix + total, O(n).*

**Medium**
- **Subarray Sum Equals K** — count subarrays summing to k. *Prefix + count map, O(n).*
- **Continuous Subarray Sum** — subarray (len ≥ 2) with sum multiple of k. *Prefix mod + first-index map, O(n).*
- **Contiguous Array** — longest subarray with equal 0s and 1s. *Map 0→-1, prefix of ±1, O(n).*
- **Product of Array Except Self** — prefix product × suffix product. *Two-pass prefix, O(n), no division.*
- **Subarray Sums Divisible by K** — count subarrays with sum % k == 0. *Prefix mod counts, O(n).*

**Hard**
- **Range Sum Query 2D - Immutable** — rectangle sums in O(1). *2D prefix table, O(m·n) build.*
- **Maximum Size Subarray Sum Equals k** — longest such subarray. *Prefix + first-seen index map, O(n).*
- **Count of Range Sum** — # of range sums in [lower, upper]. *Prefix sums + merge sort / BIT, O(n log n).*

### Frequently Asked Interview Questions
- **Q: What problem does prefix sum solve?** A: Turns repeated range-sum queries from O(n) each into O(1) after an O(n) precompute.
- **Q: Range sum formula?** A: `sum(i..j) = prefix[j+1] - prefix[i]` with the `prefix[0]=0` convention.
- **Q: Why prefix + hashmap for sum==k?** A: Running sum `S`; a prior running sum `S-k` means the slice between them sums to k. Map stores counts of each running sum → O(n).
- **Q: Why seed the map with `{0:1}`?** A: Represents the empty prefix so subarrays starting at index 0 are counted.
- **Q: Prefix sum vs sliding window?** A: Sliding window needs monotonic behaviour (usually non-negative); prefix+map handles negatives and counts all subarrays.
- **Q: How does 2D prefix work?** A: Inclusion-exclusion: `pre[r2+1][c2+1] - pre[r1][c2+1] - pre[r2+1][c1] + pre[r1][c1]`.

### Revision Notes
- `prefix[i]` = sum of elements before `i`; build O(n), query O(1).
- Range sum = `prefix[j+1] - prefix[i]` (use the `+1`/zero-seed convention).
- Subarray-sum-k = running sum + hashmap of seen sums; seed `{0:1}`.
- Order matters: check `sum-k`, then record `sum`.
- Handles negatives (sliding window doesn't for sums).
- 2D prefix = inclusion-exclusion, rectangle sum in O(1).
- Difference array = inverse trick for range updates.

### Cheat Sheet
```js
// build (zero-seeded)
const p=[0]; for(const x of a) p.push(p[p.length-1]+x);
// range [i..j] inclusive:
p[j+1]-p[i];

// subarray sum == k (count)
const seen=new Map([[0,1]]); let s=0,c=0;
for(const x of a){ s+=x; c+=seen.get(s-k)??0; seen.set(s,(seen.get(s)??0)+1); }
```
| Task | Approach |
|------|----------|
| many range sums | prefix array, O(1)/query |
| count subarrays sum=k | prefix + count map |
| longest subarray sum=k | prefix + first-index map |
| rectangle sum | 2D prefix (incl-excl) |

---

## Part 2 — Recommended Practice Order

Practice these in the order below — each rung builds the mental tools the next one assumes.

1. **Hash Maps (4)** — Start here. Frequency counting and complement-lookup are the most reused ideas in all of DSA, and Two Sum is the canonical "trade space for time" insight every other topic leans on.
2. **Hash Sets (5)** — A quick, natural follow-on: a set is just a map you strip down to presence. Cements *when* you need associated data (Map) versus *just* membership (Set), and drills the "kill the O(n²) `includes`" reflex.
3. **Two Pointers (6)** — Your first pass over data *without* extra hashing. Learn the sorted-array shrink logic, the same-direction write-pointer invariant, and fast/slow for cycles. This builds the "one linear sweep with moving indices" muscle.
4. **Sliding Window (7)** — A specialization of same-direction two pointers plus a running summary (often a hash map from step 1). Doing it after both hashing *and* two pointers means every piece is already familiar; you only learn the expand/shrink invariant.
5. **Prefix Sum (8)** — Finish here. It stands alone conceptually but reaches its full power *combined with a hash map* (subarray-sum-equals-k), so it deliberately closes the loop back to topic 4 — and it's precisely the tool for the cases where sliding window (topic 7) breaks (negative numbers). Ending on prefix sum reinforces choosing the right technique per constraint.

**Rhythm:** for each topic, do all Beginner problems until the template is automatic, then 2–3 Medium, then one Hard to stretch. Re-read the topic's Revision Notes and Cheat Sheet before moving on.


---


# Part 3 — Searching & Sorting

## 9. Binary Search  —  ✅ **MUST-DO (core minimum)**

### Concept
Binary search finds a target inside a **sorted** collection by repeatedly cutting the search range in half. Instead of scanning every element (O(n)), you look at the middle element, decide whether the answer is to the left or the right, throw away the other half, and repeat. Each step halves the work, so you reach the answer in O(log n) comparisons.

The idea generalizes far beyond "find a number in an array": any time you can ask a **monotonic yes/no question** ("is this value big enough?") over an ordered range, binary search finds the boundary between the "no" region and the "yes" region.

### Intuition
Think of looking up a word in a physical dictionary. You don't start at page 1 — you flip to the middle, see whether your word comes before or after, and jump into that half. You keep halving until one page remains.

The key requirement is **order / monotonicity**: everything to the left of the answer must fail the test and everything to the right must pass it (or vice versa). If the data isn't sorted (or the predicate isn't monotonic), binary search gives garbage, because "look left or right" is only meaningful when one direction is guaranteed to contain the target.

Halving `n` down to `1` takes `log2(n)` steps. For a million elements that's ~20 comparisons; for a billion, ~30. That logarithmic shrink is the whole point.

### Visual
Search for `target = 7` in a sorted array. `lo`, `hi`, `mid` shown each round.

```
index:  0   1   2   3   4   5   6   7
value: [1,  3,  5,  7,  9, 11, 13, 15]

Round 1: lo=0, hi=7, mid=3 -> a[3]=7 == 7  -> FOUND at index 3
```

Now search for `target = 9`:

```
Round 1: lo=0 hi=7 mid=3  a[3]=7  < 9  -> go right, lo=mid+1=4
                  L           M              R
        [1,  3,  5,  7,  9, 11, 13, 15]
Round 2: lo=4 hi=7 mid=5  a[5]=11 > 9  -> go left, hi=mid-1=4
                          L   M       R
Round 3: lo=4 hi=4 mid=4  a[4]=9  == 9 -> FOUND at index 4
```

The window `[lo, hi]` shrinks each round until it lands on the target or collapses (`lo > hi`) meaning "not present".

### Time & Space Complexity

| Operation | Best | Average | Worst |
|---|---|---|---|
| Search (exact match) | O(1) (hits mid immediately) | O(log n) | O(log n) |
| Find boundary (first/last true) | O(log n) | O(log n) | O(log n) |
| Space (iterative) | O(1) | O(1) | O(1) |
| Space (recursive) | O(log n) call stack | O(log n) | O(log n) |

Justification: each iteration discards half the remaining elements, so the range size goes `n -> n/2 -> n/4 -> ... -> 1`, which is `log2(n)` steps. No extra data structures are needed, so iterative space is O(1).

### Common Interview Patterns
- **Exact match**: "Does `x` exist? Return its index." Classic sorted-array lookup.
- **Boundary / first-true**: "First index >= target", "leftmost/rightmost occurrence of a duplicate", `lower_bound` / `upper_bound`, insert position.
- **Binary search on the answer**: the array of answers is implicit and monotonic. "Minimum capacity to ship in D days", "Koko eating bananas", "split array largest sum", "smallest divisor". You binary-search the *answer value*, using a feasibility check as the predicate.
- **Rotated / modified sorted arrays**: search in a rotated sorted array, find minimum in rotated array — one half is always sorted.
- **Search in 2D matrix**: treat a row-sorted, column-sorted matrix as one flattened sorted array.
- **Peak finding**: binary search using the slope direction as the monotonic signal.

### Template Code
Memorize **two** skeletons. The first for exact match; the second — the more powerful one — for "find the boundary".

```js
// TEMPLATE 1: Exact match. Returns index of target, or -1 if absent.
// Invariant: if target exists, it is within the inclusive range [lo, hi].
function binarySearch(a, target) {
  let lo = 0;
  let hi = a.length - 1;              // inclusive right bound
  while (lo <= hi) {                  // <=  because [lo, hi] is inclusive
    // Avoid (lo + hi) overflow in fixed-width langs; harmless-but-good habit in JS.
    const mid = lo + ((hi - lo) >> 1);
    if (a[mid] === target) return mid;
    else if (a[mid] < target) lo = mid + 1;   // target is to the right
    else hi = mid - 1;                          // target is to the left
  }
  return -1;                          // range collapsed: not found
}
```

```js
// TEMPLATE 2: "First TRUE" boundary search (the workhorse).
// Given a monotonic predicate that is F F F ... F T T ... T over the range,
// return the index of the FIRST element where pred(x) is true (or n if none).
// This one template covers lower_bound, upper_bound, insert position, etc.
function firstTrue(a, pred) {
  let lo = 0;
  let hi = a.length;                 // EXCLUSIVE right bound -> answer can be n
  while (lo < hi) {                  // <   because [lo, hi) is half-open
    const mid = lo + ((hi - lo) >> 1);
    if (pred(a[mid])) hi = mid;      // mid might be the answer; keep it in range
    else lo = mid + 1;              // mid fails; answer is strictly right
  }
  return lo;                         // lo === hi === first index where pred holds
}

// Derived helpers from the ONE template:
const lowerBound = (a, x) => firstTrue(a, v => v >= x); // first index with a[i] >= x
const upperBound = (a, x) => firstTrue(a, v => v >  x); // first index with a[i] >  x
// exact match via boundary:
function contains(a, x) {
  const i = lowerBound(a, x);
  return i < a.length && a[i] === x;
}
```

```js
// TEMPLATE 3: Binary search on the ANSWER space (implicit array of candidates).
// Find the smallest value in [loAns, hiAns] that satisfies feasible().
// feasible must be monotonic: once true, it stays true for larger values.
function minFeasible(loAns, hiAns, feasible) {
  let lo = loAns, hi = hiAns;        // inclusive answer range
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (feasible(mid)) hi = mid;     // mid works, try smaller
    else lo = mid + 1;              // mid too small, go bigger
  }
  return lo;                         // smallest feasible answer
}
```

### Dry Run
**Worked canonical example: leftmost occurrence of a duplicate** using `lowerBound`.
`a = [1, 2, 2, 2, 4, 7]`, find first index where `a[i] >= 2`. Predicate `pred(v) = v >= 2` produces `F T T T T T`.

```
a:      [1, 2, 2, 2, 4, 7]      pred: F  T  T  T  T  T
index:   0  1  2  3  4  5             0  1  2  3  4  5

Start: lo=0, hi=6 (n, exclusive)

Iter 1: lo=0 hi=6  mid = 0 + (6-0>>1) = 3   a[3]=2  pred(2)=true  -> hi=mid=3
        window now [0,3)
Iter 2: lo=0 hi=3  mid = 0 + (3-0>>1) = 1   a[1]=2  pred(2)=true  -> hi=mid=1
        window now [0,1)
Iter 3: lo=0 hi=1  mid = 0 + (1-0>>1) = 0   a[0]=1  pred(1)=false -> lo=mid+1=1
        window now [1,1)  -> lo === hi, loop ends
Return lo = 1   ==> first index with value >= 2 is index 1  (correct: leftmost 2)
```

Notice how `pred(mid)==true` keeps `mid` inside the range (`hi = mid`, not `mid-1`). That is the single most important detail of the boundary template — it prevents skipping the true answer.

**Binary-search-on-answer example (Koko eating bananas, sketch):** piles `[3,6,7,11]`, hours `h=8`. Feasibility `canFinish(speed)` = sum of `ceil(pile/speed)` <= 8, which is monotonic in `speed` (faster eating -> fewer or equal hours -> once feasible, stays feasible). Call `minFeasible(1, max(piles)=11, canFinish)` to get the minimum eating speed. The array being searched is the *conceptual* list of speeds `1..11`, never materialized.

### Common Mistakes
- **Wrong loop condition for the wrong bound style.** Inclusive `[lo, hi]` needs `while (lo <= hi)`; half-open `[lo, hi)` needs `while (lo < hi)`. Mixing them causes off-by-one or missed elements.
- **`mid` overflow.** `mid = (lo + hi) / 2` can overflow in fixed-width integer languages. Use `lo + ((hi - lo) >> 1)`. In JS numbers are 64-bit floats so true overflow is rare, but this is the habit interviewers want to see. Note `>>` only works safely for indices below 2^31.
- **Infinite loop from a non-shrinking update.** In the boundary template, writing `hi = mid - 1` on the true branch can skip the answer, and writing `lo = mid` (instead of `lo = mid + 1`) on the false branch never advances when `mid === lo`, looping forever. Every branch must strictly shrink the window.
- **Assuming sorted / monotonic data.** Binary search on unsorted data or a non-monotonic predicate silently returns wrong answers.
- **Off-by-one on the answer of a boundary search.** After the loop, `lo` is the first-true index; forgetting to bounds-check `lo < n` before reading `a[lo]` causes an out-of-range read when nothing satisfies the predicate.
- **Using floating mid without `Math.floor`.** In JS, `(lo+hi)/2` yields a fraction; index it and you get `undefined`. Always floor.

### Edge Cases
- **Empty array**: `hi = -1` (Template 1) so loop body never runs -> returns -1; `hi = 0` (Template 2) -> returns 0. Both correct.
- **Single element**: verify it can both match and be rejected.
- **Target smaller than all / larger than all**: boundary search returns `0` or `n` respectively — often exactly the "insert position" you want.
- **Duplicates**: exact-match Template 1 returns *some* index (not necessarily first/last). Use lower/upper bound when you need a specific occurrence.
- **Answer-space search**: choose `lo`/`hi` bounds carefully so the true answer is inside `[lo, hi]`; a too-tight upper bound excludes the answer.
- **Negative numbers / large indices**: fine as long as sorted; watch `>>` for indices >= 2^31.

### Interview Tips
- Say the invariant out loud: "The answer, if it exists, always lives in `[lo, hi]`; I shrink that window each step, so it terminates in O(log n)."
- State your bound convention *before* coding ("inclusive hi, so `<=`") — it prevents the most common bug and shows discipline.
- Derive complexity aloud: "Each iteration halves the range, `n -> n/2 -> ... -> 1`, so `log2(n)` iterations."
- When a problem says "minimize the maximum" or "find the smallest X such that...", pattern-match immediately to **binary search on the answer** and describe the monotonic feasibility check.
- Prefer the **first-true** template as your default; it subsumes exact match, insert position, and both bounds, so you carry one mental skeleton instead of five.

### Practice Problems
**Beginner**
- **Binary Search** — return index of target in a sorted array, else -1. Pattern: Template 1 exact match. Target: O(log n).
- **Search Insert Position** — index where target is or would be inserted. Pattern: lower_bound / first-true. Target: O(log n).
- **First Bad Version** — find the first failing version given an `isBad(v)` API. Pattern: first-true boundary on a predicate. Target: O(log n).
- **Sqrt(x)** — integer square root. Pattern: binary search on answer (largest `k` with `k*k <= x`). Target: O(log x).

**Medium**
- **Find First and Last Position of Element in Sorted Array** — leftmost & rightmost index of target. Pattern: lower_bound + upper_bound. Target: O(log n).
- **Search in Rotated Sorted Array** — target index in a rotated sorted array. Pattern: one half is always sorted; decide which half is monotonic. Target: O(log n).
- **Find Minimum in Rotated Sorted Array** — the pivot/min. Pattern: compare mid to hi to locate the unsorted half. Target: O(log n).
- **Koko Eating Bananas** — min eating speed to finish in h hours. Pattern: binary search on answer with monotonic feasibility. Target: O(n log maxPile).
- **Capacity To Ship Packages Within D Days** — min ship capacity. Pattern: binary search on answer. Target: O(n log sum).
- **Search a 2D Matrix** — target in a fully-sorted matrix. Pattern: flatten indices, binary search once. Target: O(log(m*n)).

**Hard**
- **Median of Two Sorted Arrays** — median in O(log(min(m,n))). Pattern: binary search on the partition point. Target: O(log(min(m,n))).
- **Split Array Largest Sum** — split into k subarrays minimizing the largest subarray sum. Pattern: binary search on the answer (max-sum), feasibility = "fits in <= k pieces". Target: O(n log sum).
- **Find K-th Smallest Pair Distance** — Pattern: binary search on distance + counting pairs with two pointers. Target: O(n log n + n log maxDist).

### Frequently Asked Interview Questions
- **Q: Why must the array be sorted?** A: Binary search discards a half based on a monotonic comparison. Without order there's no guarantee the target is in the chosen half.
- **Q: Iterative vs recursive?** A: Same O(log n) time; iterative uses O(1) space, recursive uses O(log n) stack. Prefer iterative.
- **Q: How do you avoid the overflow bug?** A: Compute `mid = lo + (hi - lo) / 2` instead of `(lo + hi) / 2`.
- **Q: When does binary search not apply?** A: Unsorted data, or a predicate that isn't monotonic (true/false regions interleave).
- **Q: What's "binary search on the answer"?** A: When the answer lies in a numeric range and feasibility is monotonic, you binary-search candidate answers using a check function instead of searching an array.
- **Q: Difference between lower_bound and upper_bound?** A: lower_bound = first index with `a[i] >= x`; upper_bound = first index with `a[i] > x`. Their difference is the count of `x`.

### Revision Notes
- Two skeletons only: exact-match (`lo<=hi`, inclusive) and first-true (`lo<hi`, half-open).
- First-true rule: `pred(mid)` true -> `hi = mid`; false -> `lo = mid + 1`. Return `lo`.
- Every branch must shrink the window, or you loop forever.
- `mid = lo + ((hi - lo) >> 1)` to dodge overflow.
- Answer-space search: needs a monotonic feasibility check + correct `[lo, hi]` answer bounds.
- lower_bound(x): first `>= x`; upper_bound(x): first `> x`; count of x = upper - lower.
- Bounds-check `lo < n` before reading `a[lo]` after a boundary search.
- O(log n) time, O(1) space iterative.

### Cheat Sheet
```js
// Exact match (inclusive [lo,hi], lo<=hi):
let lo=0, hi=n-1;
while (lo<=hi){ const m=lo+((hi-lo)>>1);
  if(a[m]===t) return m; else if(a[m]<t) lo=m+1; else hi=m-1; }
return -1;

// First-true boundary (half-open [lo,hi), lo<hi):  << memorize this one
let lo=0, hi=n;
while (lo<hi){ const m=lo+((hi-lo)>>1);
  if (pred(a[m])) hi=m; else lo=m+1; }
return lo;  // first index where pred holds (or n)

// lowerBound: pred = v>=x   |  upperBound: pred = v>x
// answer-space: replace a[m] with m, pred with feasible(m)
```

---

## 10. Sorting  —  ✅ **MUST-DO (core minimum)**

### Concept
Sorting arranges elements into a defined order (ascending by default). It is the workhorse pre-processing step for countless algorithms: sorted data unlocks binary search, two-pointer sweeps, greedy scheduling, deduplication, and interval merging. You should understand the two families:

- **Comparison sorts** (merge sort, quicksort, heapsort, insertion sort) order elements by comparing pairs. They work on any type with a defined ordering and are bounded below by **O(n log n)** in the worst case.
- **Non-comparison sorts** (counting sort, radix sort, bucket sort) exploit the *structure* of the keys (e.g. small integer range) to beat O(n log n), reaching O(n + k) or O(n·d) under specific constraints.

### Intuition
**Why the O(n log n) lower bound for comparison sorts?** Each comparison yields one bit of information (less / greater). To pin down the correct order you must distinguish among all `n!` possible permutations. A binary decision tree distinguishing `n!` outcomes needs at least `log2(n!)` levels, and by Stirling's approximation `log2(n!) ≈ n log2 n`. So *any* algorithm that only compares elements needs Ω(n log n) comparisons in the worst case. Non-comparison sorts sidestep this because they don't compare — they use the key's value directly as an index, gaining information faster than one bit per operation.

**Merge sort** intuition: a single element is already sorted; merging two already-sorted lists is cheap and linear. So split until trivial, then merge upward — divide and conquer.

**Quicksort** intuition: pick a pivot, shove smaller elements left and larger right (partition); the pivot is now in its final place. Recurse on each side. No merge step needed — the work happens on the way *down*.

### Visual
Merge sort on `[5, 2, 4, 1]` — split down, merge up:

```
                [5, 2, 4, 1]
                 /         \
            [5, 2]        [4, 1]          <- split
            /    \        /    \
          [5]   [2]     [4]   [1]         <- base cases (size 1 = sorted)
            \    /        \    /
            [2, 5]        [1, 4]          <- merge pairs
                 \         /
                [1, 2, 4, 5]              <- final merge
```

Quicksort partition of `[3, 7, 1, 6, 2]` with pivot = last element `2` (Lomuto):

```
pivot = 2. i = boundary of "<= pivot" region (starts at lo-1).
scan j -> move any value <= 2 to the left region.

[3, 7, 1, 6 | 2]   1 <= 2  -> swap into place
after partition: [1 | 2 | 7, 6, 3]
                  ^   ^   ^-- all > pivot
                  |   pivot in FINAL position (index 1)
                  all <= pivot
recurse on [1] and on [7, 6, 3]
```

### Time & Space Complexity

| Algorithm | Best | Average | Worst | Space | Stable? |
|---|---|---|---|---|---|
| Merge sort | O(n log n) | O(n log n) | O(n log n) | O(n) aux | Yes |
| Quicksort | O(n log n) | O(n log n) | O(n²) (bad pivots) | O(log n) stack (avg) | No |
| Heapsort | O(n log n) | O(n log n) | O(n log n) | O(1) | No |
| Insertion sort | O(n) (nearly sorted) | O(n²) | O(n²) | O(1) | Yes |
| Counting sort | O(n + k) | O(n + k) | O(n + k) | O(n + k) | Yes |
| Radix sort (LSD) | O(d·(n + b)) | O(d·(n + b)) | O(d·(n + b)) | O(n + b) | Yes |

`k` = range of key values; `d` = number of digits; `b` = base/radix. Justification for merge/quick: the recursion tree has ~log n levels and each level touches all n elements = n log n. Quicksort degrades to O(n²) when the pivot repeatedly splits 1-vs-(n-1) (e.g. already-sorted input with a naive last-element pivot).

### Common Interview Patterns
- **"Sort first, then sweep"**: sort to enable two-pointer / greedy / dedup logic (3Sum, merge intervals, meeting rooms, largest number).
- **Custom comparator**: sort objects by multiple keys, or by a derived value (e.g. sort by frequency, by end time).
- **Counting / bucket sort**: when values live in a small known range or you need O(n) (sort colors / Dutch national flag, top-K frequent).
- **Merge sort byproducts**: count inversions, merge k sorted lists, external sort of data too big for RAM.
- **Quickselect**: quicksort's partition without full recursion to find the k-th smallest in O(n) average.
- **Stability-dependent** problems: multi-pass sorting where earlier order must be preserved (radix relies on a stable inner sort).

### Template Code
```js
// MERGE SORT — stable, guaranteed O(n log n), O(n) extra space.
function mergeSort(a) {
  if (a.length <= 1) return a;                 // base case: 0 or 1 elem is sorted
  const mid = a.length >> 1;
  const left  = mergeSort(a.slice(0, mid));    // sort left half
  const right = mergeSort(a.slice(mid));       // sort right half
  return merge(left, right);                   // combine two sorted halves
}

function merge(left, right) {
  const out = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    // '<=' (not '<') keeps equal elements in left-first order => STABLE
    if (left[i] <= right[j]) out.push(left[i++]);
    else out.push(right[j++]);
  }
  // one side is exhausted; append the remainder of the other
  while (i < left.length)  out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}
```

```js
// QUICKSORT — in-place, avg O(n log n), Lomuto partition.
// Randomized pivot avoids the O(n^2) trap on sorted/adversarial input.
function quickSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return a;                       // 0 or 1 element: done
  const p = partition(a, lo, hi);               // pivot lands at final index p
  quickSort(a, lo, p - 1);                       // sort left of pivot
  quickSort(a, p + 1, hi);                        // sort right of pivot
  return a;
}

function partition(a, lo, hi) {
  // randomize pivot, then swap it to the end (Lomuto expects pivot at hi)
  const r = lo + Math.floor(Math.random() * (hi - lo + 1));
  [a[r], a[hi]] = [a[hi], a[r]];
  const pivot = a[hi];
  let i = lo - 1;                               // i = last index of "<= pivot" zone
  for (let j = lo; j < hi; j++) {
    if (a[j] <= pivot) {                        // element belongs left
      i++;
      [a[i], a[j]] = [a[j], a[i]];              // swap it into the left zone
    }
  }
  [a[i + 1], a[hi]] = [a[hi], a[i + 1]];        // put pivot right after left zone
  return i + 1;                                 // pivot's final resting index
}
```

```js
// COUNTING SORT — O(n + k) for integer keys in [0, k]. Stable version.
function countingSort(a, k) {
  const count = new Array(k + 1).fill(0);
  for (const x of a) count[x]++;                // tally occurrences
  for (let v = 1; v <= k; v++) count[v] += count[v - 1]; // prefix sums = positions
  const out = new Array(a.length);
  for (let i = a.length - 1; i >= 0; i--) {     // iterate BACKWARD to stay stable
    const x = a[i];
    out[--count[x]] = x;
  }
  return out;
}
```

### Dry Run
**Worked canonical example: merge sort on `[5, 2, 4, 1]`.**

```
mergeSort([5,2,4,1])
  mid=2
  left  = mergeSort([5,2])
            mid=1
            left  = mergeSort([5]) -> [5]        (base case)
            right = mergeSort([2]) -> [2]        (base case)
            merge([5],[2]):
              i=0 j=0: 5 <= 2? no -> push 2 (j=1, right done)
              drain left -> push 5
              => [2,5]
  right = mergeSort([4,1])
            left  = [4], right = [1]
            merge([4],[1]):
              4 <= 1? no -> push 1 (right done)
              drain left -> push 4
              => [1,4]
  merge([2,5],[1,4]):
     i=0 j=0: 2 <= 1? no -> push 1 (j=1)
     i=0 j=1: 2 <= 4? yes-> push 2 (i=1)
     i=1 j=1: 5 <= 4? no -> push 4 (j=2, right done)
     drain left -> push 5
     => [1,2,4,5]   DONE
```

Comparisons total ~5 for n=4, matching the ~n log n = 4·2 = 8 upper bound. Every merge is linear and there are log n = 2 merge levels.

### Common Mistakes
- **Quicksort with a fixed pivot** (always first/last): degrades to O(n²) on already-sorted or reverse-sorted input. Randomize or use median-of-three.
- **Off-by-one in partition / merge bounds**: `hi` inclusive vs exclusive, forgetting to drain the leftover side in merge.
- **Breaking stability in merge** by using `<` where equal-key order matters — use `<=` so left elements win ties.
- **Counting sort with negative or huge-range keys**: only valid for a small, known non-negative range; otherwise the `count` array blows up memory.
- **Mutating input when the caller expects a copy** (or vice versa): merge sort here returns a new array; quicksort sorts in place. Be explicit about which.
- **JS `sort` without a comparator** on numbers (see below) — the single most common real-world sorting bug.
- **Deep recursion**: quicksort on an adversarial input can overflow the stack; recurse into the smaller side first / cap depth.

### Edge Cases
- **Empty / single element**: base cases must return immediately (`length <= 1`).
- **All duplicates**: Lomuto quicksort can hit O(n²) on all-equal arrays; three-way (Dutch flag) partition fixes this.
- **Already sorted / reverse sorted**: worst case for naive-pivot quicksort; best case (O(n)) for insertion sort.
- **Negative numbers**: fine for comparison sorts; break plain counting sort (offset the keys or use a map).
- **Stability required**: pick merge/counting/insertion sort, not plain quicksort/heapsort.
- **Large keys, few elements**: counting/radix can be *worse* than a comparison sort because `k` or `d` dominates.

### Interview Tips
- Lead with the trade-off table: "Merge sort — stable, guaranteed n log n, but O(n) space. Quicksort — in place and cache-friendly, average n log n, but n² worst case and unstable. Heapsort — n log n and O(1) space but unstable and poor cache behavior."
- Be ready to *prove* the O(n log n) lower bound via the decision-tree / `log2(n!)` argument — interviewers love it.
- Know **when to abandon comparison sorts**: small integer range -> counting sort; fixed-width integers/strings -> radix sort.
- Mention **quickselect** when asked for k-th smallest/largest — average O(n), no full sort needed.
- If asked "which does your language use?": JS engines (V8) use **TimSort** (a stable, adaptive merge/insertion hybrid) for `Array.prototype.sort`.
- Always clarify **stability** and **in-place** requirements before coding — they change the algorithm choice.

### Practice Problems
**Beginner**
- **Sort an Array** — sort integers, implement (not the built-in). Pattern: merge sort or randomized quicksort. Target: O(n log n).
- **Sort Colors (Dutch National Flag)** — sort an array of 0/1/2 in one pass. Pattern: three-way partition / counting sort. Target: O(n), O(1).
- **Merge Sorted Array** — merge two sorted arrays in place. Pattern: two pointers from the back. Target: O(m + n).

**Medium**
- **Kth Largest Element in an Array** — Pattern: quickselect (partition without full recursion) or a size-k heap. Target: O(n) average.
- **Sort Characters By Frequency** — reorder a string by descending char frequency. Pattern: count + bucket/comparator sort. Target: O(n).
- **Largest Number** — arrange numbers to form the largest concatenation. Pattern: custom comparator `(a,b) => (b+a) - (a+b)` on string concatenation. Target: O(n log n).
- **Merge Intervals** — merge overlapping intervals. Pattern: sort by start, then sweep. Target: O(n log n).
- **Meeting Rooms II** — min rooms needed. Pattern: sort starts & ends, sweep. Target: O(n log n).
- **Top K Frequent Elements** — Pattern: bucket sort by frequency or a heap. Target: O(n).

**Hard**
- **Count of Smaller Numbers After Self** — count inversions to the right. Pattern: modified merge sort (count during merge) or BIT. Target: O(n log n).
- **Maximum Gap** — max gap between successive sorted elements in O(n). Pattern: bucket sort / pigeonhole. Target: O(n).
- **Merge k Sorted Lists** — Pattern: min-heap of heads, or pairwise merge sort. Target: O(N log k).

### Frequently Asked Interview Questions
- **Q: Why is O(n log n) a lower bound for comparison sorts?** A: There are `n!` orderings; a comparison tree distinguishing them needs `log2(n!) ≈ n log n` height, so at least that many comparisons in the worst case.
- **Q: Merge sort vs quicksort — when each?** A: Merge sort when you need stability or guaranteed n log n (or for linked lists / external sort). Quicksort for in-memory arrays where average speed and low space matter; it's usually faster in practice due to cache locality.
- **Q: What makes a sort stable, and why care?** A: Stable = equal keys keep their original relative order. It matters for multi-key sorting and is required by radix sort's inner pass.
- **Q: How do you make quicksort O(n log n) reliably?** A: Randomize the pivot (or median-of-three), and use three-way partition for many duplicates. This makes worst case astronomically unlikely, not impossible.
- **Q: When is a non-comparison sort worth it?** A: When keys are integers in a small range (counting) or fixed-width digits/strings (radix), giving O(n + k) or O(n·d).
- **Q: What algorithm does JS use?** A: TimSort (stable, adaptive) in V8, but only when you pass a comparator for numbers.

### Revision Notes
- Comparison-sort floor is Ω(n log n) via `log2(n!)`.
- Merge: stable, O(n log n) always, O(n) space; use `<=` in merge for stability.
- Quicksort: in place, avg O(n log n), worst O(n²) with bad pivots — RANDOMIZE the pivot.
- Heapsort: O(n log n), O(1) space, unstable.
- Counting sort: O(n + k), stable, integers in a small range only; iterate backward to keep stability.
- Radix (LSD): O(d·(n + b)); relies on a stable inner sort per digit.
- Quickselect finds k-th element in O(n) average.
- JS `.sort()` is lexicographic by default — ALWAYS pass a numeric comparator for numbers.
- Sort-then-sweep unlocks two pointers, greedy, dedup, interval merging.

### Cheat Sheet
```js
// ---- JS Array.prototype.sort GOTCHAS ----
[10, 2, 1].sort();                 // -> [1, 10, 2]  WRONG: default = string/lexicographic!
[10, 2, 1].sort((a, b) => a - b);  // -> [1, 2, 10]  ascending numeric  (correct)
[10, 2, 1].sort((a, b) => b - a);  // -> [10, 2, 1]  descending numeric
arr.sort((a, b) => a.age - b.age || a.name.localeCompare(b.name)); // multi-key
// - Comparator MUST return a NUMBER (<0, 0, >0); returning a boolean is a bug.
// - .sort() mutates in place AND returns the array; copy first if you need the original:
const sorted = [...arr].sort((a,b)=>a-b);
// - As of ES2019, .sort is guaranteed STABLE.
// - Strings: default sort is by UTF-16 code unit ("Z" < "a"); use localeCompare for human order.

// ---- Which sort? ----
// Need stable / guaranteed n log n  -> merge sort
// In place, fast average, memory-tight -> randomized quicksort
// Small integer range               -> counting sort  O(n+k)
// Fixed-width ints/strings           -> radix sort     O(d(n+b))
// k-th element only                  -> quickselect    O(n) avg
```

---

## Part 3 — Recommended Practice Order

Practice in this sequence; each step builds the intuition the next one leans on.

1. **Binary Search — exact match (Template 1) first.** It's the smallest, most self-contained skeleton. Nail "Binary Search" and "Search Insert Position" until the `lo <= hi` invariant is automatic. This is the fastest confidence win and appears constantly.
2. **Binary Search — the first-true boundary template (Template 2).** Once exact match feels trivial, internalize the boundary template via "First Bad Version" and "Find First and Last Position". This template subsumes lower/upper bound and is the one you'll reuse most in real interviews.
3. **Binary Search on the answer space (Template 3).** Do "Koko Eating Bananas" and "Capacity to Ship Packages". This is where binary search stops being "array lookup" and becomes a general optimization tool — high signal for medium/hard rounds.
4. **Sorting fundamentals — implement merge sort and randomized quicksort by hand.** Do this before the applied problems so you truly understand stability, partitioning, and the n log n lower bound. Dry-run each on paper.
5. **JS `.sort()` fluency and comparators.** Drill the comparator gotchas ("Largest Number", "Sort Characters By Frequency") — these catch real candidates far more often than algorithm knowledge does.
6. **Sort-then-sweep applications.** "Merge Intervals", "Meeting Rooms II", "Sort Colors" — connect sorting to the two-pointer/greedy patterns from earlier parts.
7. **Advanced blends last.** "Kth Largest" (quickselect), "Count of Smaller Numbers After Self" (merge-sort inversions), "Median of Two Sorted Arrays" (binary search on partitions). These deliberately fuse both topics of this part and are the strongest interview differentiators.

Rationale: searching before sorting is intentional — binary search's payoff *depends on* sorted input, so understanding "why sorted matters" motivates the sorting section, and the final blended problems reward having both toolkits sharp.


---


# Part 4 — Recursion & Backtracking

## 11. Recursion  —  ✅ **MUST-DO (core minimum)**

### Concept
Recursion is when a function solves a problem by **calling itself on a smaller version of the same problem** until the problem becomes so small it can be answered directly. Every recursive function has two parts:

- **Base case** — the smallest input where you already know the answer and stop recursing. This is the "off switch."
- **Recursive case** — how you reduce the problem toward the base case and combine the sub-answer.

If a problem can be defined in terms of itself ("factorial of n is n times factorial of n-1"), recursion expresses it almost word for word.

### Intuition
Think of recursion as **delegation**. You (the boss) don't solve the whole problem. You do one tiny step, then hand the smaller remaining problem to a clone of yourself, trusting that clone to return the correct answer. This is the **"recursive leap of faith"**: assume `solve(n-1)` already works, then figure out only how to go from `n-1`'s answer to `n`'s answer.

Two questions to always answer:
1. **When do I stop?** (base case — must be reachable, or you recurse forever)
2. **How does each call get closer to stopping?** (the input must shrink toward the base case)

Mental model: a stack of sticky notes. Each call writes down its half-finished work, pushes a new note for the sub-call, and only finishes its own note once the sub-call's note comes back with an answer.

### Visual
Factorial `fact(4)` — the calls go **down** (winding), the answers come back **up** (unwinding):

```
fact(4)                          <- called first
 = 4 * fact(3)                   winding down (pushing frames)
        = 3 * fact(2)
               = 2 * fact(1)
                      = 1        <- BASE CASE, stop
               = 2 * 1   = 2     unwinding (popping frames, multiplying)
        = 3 * 2   = 6
 = 4 * 6   = 24                  <- final answer
```

The **call stack** at the deepest point (each box is a stack frame with its own local `n`):

```
top ->  | fact(1) | n=1 |   returns 1
        | fact(2) | n=2 |   waiting for fact(1)
        | fact(3) | n=3 |   waiting for fact(2)
bottom->| fact(4) | n=4 |   waiting for fact(3)
```

Frames are pushed on the way down and popped (with their return values) on the way up. Depth here = 4, so O(n) stack space.

### Time & Space Complexity
Complexity of a recursion = **(number of calls) × (work per call)**, and stack space = **max depth of the tree**.

| Example | Recurrence | Time | Space (stack) |
|---|---|---|---|
| Factorial / linear recursion | T(n)=T(n-1)+O(1) | O(n) | O(n) |
| Binary search (recursive) | T(n)=T(n/2)+O(1) | O(log n) | O(log n) |
| Merge sort | T(n)=2T(n/2)+O(n) | O(n log n) | O(n) |
| Naive Fibonacci | T(n)=T(n-1)+T(n-2)+O(1) | O(2ⁿ) (≈φⁿ) | O(n) |
| Fib with memoization | each n solved once | O(n) | O(n) |
| Binary tree traversal | T(n)=2T(n/2)+O(1) | O(n) | O(h), h=height |

**Master theorem (light):** for `T(n) = a·T(n/b) + O(n^d)` compare `d` with `log_b(a)`:
- `d > log_b a` → O(n^d)  (top-level work dominates)
- `d = log_b a` → O(n^d · log n)  (e.g. merge sort: a=2,b=2,d=1 → n log n)
- `d < log_b a` → O(n^{log_b a})  (leaves dominate)

### Common Interview Patterns
- **Linear recursion**: one call per step (factorial, sum of list, reverse string).
- **Binary/tree recursion**: two+ calls per step (Fibonacci, tree traversals, divide-and-conquer sorts).
- **Divide and conquer**: split → solve halves → merge (merge sort, quick sort, binary search).
- **Recursion on data structures**: linked lists (`solve(node.next)`) and trees (`solve(node.left)`, `solve(node.right)`).
- **Accumulator pattern**: pass partial results down as an argument instead of building them up on the way back.
- **Recursion ↔ iteration**: any recursion can be rewritten with an explicit stack; tail recursion maps cleanly to a loop.

### Template Code
```js
// GENERIC RECURSION SKELETON
function solve(input) {
  // 1) BASE CASE(S): smallest input(s) with a known answer.
  if (/* input is smallest */) return /* known answer */;

  // 2) RECURSIVE CASE: shrink the problem, trust the recursive call,
  //    then combine its result with the current step's work.
  const sub = solve(/* smaller input */);
  return /* combine current step with sub */;
}

// Example A — factorial (linear recursion)
function factorial(n) {
  if (n <= 1) return 1;            // base case
  return n * factorial(n - 1);     // recursive case
}

// Example B — sum of an array from index i (accumulator-free)
function sumFrom(arr, i = 0) {
  if (i === arr.length) return 0;  // base: past the end
  return arr[i] + sumFrom(arr, i + 1);
}

// Example C — Fibonacci with MEMOIZATION (top-down DP)
function fib(n, memo = new Map()) {
  if (n <= 1) return n;            // base cases: fib(0)=0, fib(1)=1
  if (memo.has(n)) return memo.get(n);
  const val = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, val);                // cache so each n is computed once
  return val;
}

// Example D — TAIL RECURSION (recursive call is the very last action)
function factorialTail(n, acc = 1) {
  if (n <= 1) return acc;          // answer already accumulated in acc
  return factorialTail(n - 1, acc * n); // nothing left to do after the call
}

// Converting recursion -> iteration using an explicit stack
function factorialIter(n) {
  let acc = 1;
  for (let i = n; i > 1; i--) acc *= i;
  return acc;
}
```

### Dry Run
Trace `fib(5)` **with memoization** (Example C). Calls resolve left-subtree first:

```
fib(5) -> fib(4) + fib(3)
  fib(4) -> fib(3) + fib(2)
    fib(3) -> fib(2) + fib(1)
      fib(2) -> fib(1) + fib(0) = 1 + 0 = 1   memo{2:1}
      fib(1) = 1 (base)
    fib(3) = 1 + 1 = 2                          memo{2:1, 3:2}
    fib(2) -> HIT memo = 1                       (no recompute!)
  fib(4) = 2 + 1 = 3                             memo{...,4:3}
  fib(3) -> HIT memo = 2                          (no recompute!)
fib(5) = 3 + 2 = 5
```

Without memo, `fib(3)` and `fib(2)` would be recomputed many times → exponential. With memo each of `fib(0..5)` is computed exactly once → O(n).

### Common Mistakes
- **Missing / unreachable base case** → infinite recursion → stack overflow.
- **Not shrinking the input** (e.g. calling `solve(n)` instead of `solve(n-1)`) → infinite recursion.
- **Off-by-one in the base case** (`n < 1` vs `n <= 1`) giving wrong results for small inputs.
- **Sharing mutable state incorrectly** across calls (e.g. one `memo`/array accidentally reset each call because it's a default param created per call — fine for memo since it's threaded through, but a bug if you *rebuild* it inside).
- **Combining before recursing** vs after — mixing up pre-order vs post-order logic.
- **Recomputing overlapping subproblems** (naive Fibonacci) instead of memoizing.
- **Returning nothing** on the recursive branch (forgetting `return` before the recursive call).

### Edge Cases
- **n = 0 or 1** — must be handled by the base case directly.
- **Empty array / null node** — base case should return the identity value (0 for sums, `null`/`true` etc.).
- **Negative input** — decide behaviour (guard, throw, or treat as base) so it doesn't recurse forever.
- **Very large n** — risk of stack overflow (JS default stack ~10k–15k frames); prefer iteration or an explicit stack.
- **Duplicate subproblems** — memoize to avoid exponential blow-up.

### Interview Tips
- Say the two parts out loud: **"Base case is ___; recursive case reduces the problem by ___."**
- Derive complexity by **drawing the recursion tree**: count nodes (total calls) and depth (stack space), or apply the Master theorem for divide-and-conquer.
- Mention the **recursive leap of faith** — trust the sub-call is correct, only verify the base case and the combine step.
- Note the **space cost of the call stack** — interviewers love when you say "recursion adds O(depth) space that iteration avoids."
- If asked to optimize, reach for **memoization** (overlapping subproblems) or **convert to iteration** (deep recursion / tail recursion).
- JS does **not** guarantee tail-call optimization (only historically in strict-mode Safari), so a deep tail recursion still overflows — mention this; it shows platform awareness.

### Practice Problems
**Beginner**
- *Factorial* — compute n!. Pattern: linear recursion, base `n<=1`. Target O(n).
- *Sum of Digits* — sum digits of an integer. Pattern: `n%10 + sum(n/10)`, base `n===0`. O(log₁₀ n).
- *Reverse a String* — reverse recursively. Pattern: `rev(rest) + first`. O(n).
- *Power (x^n)* — naive. Pattern: `x * pow(x, n-1)`, base `n===0`→1. O(n).

**Medium**
- *Fibonacci Number* — nth Fibonacci. Pattern: memoize overlapping subproblems. O(n).
- *Fast Power (Pow(x,n))* — exponentiation by squaring. Pattern: `pow(x,n/2)²`, halve n. O(log n).
- *Merge Sort* — sort via divide and conquer. Pattern: split, sort halves, merge. O(n log n).
- *Binary Search (recursive)* — search sorted array. Pattern: recurse on one half. O(log n).
- *Tower of Hanoi* — move n disks. Pattern: move n-1, move largest, move n-1. O(2ⁿ) moves.

**Hard**
- *Recursion depth / call-stack simulation* — convert a deep recursion to an explicit stack to avoid overflow.
- *K-th Symbol in Grammar* — derive value without building the row. Pattern: recurse on parent bit. O(n).

### Frequently Asked Interview Questions
- **Q: What is the difference between recursion and iteration?** A: Both repeat work; recursion uses the call stack (extra O(depth) space) and expresses self-similar problems cleanly, iteration uses a loop with O(1) control space. Any recursion can be converted to iteration with an explicit stack.
- **Q: What causes a stack overflow?** A: Recursion that never reaches its base case, or a valid recursion whose depth exceeds the runtime's stack limit.
- **Q: What is tail recursion?** A: When the recursive call is the last operation in the function (nothing is done with its result). It can theoretically reuse the current frame (O(1) stack), but JS engines generally don't do this optimization.
- **Q: What is memoization?** A: Caching results of subproblems so each distinct input is computed once — turns exponential overlapping recursion into linear.
- **Q: How do you find the complexity of a recursive function?** A: Write the recurrence, then draw the recursion tree (calls × work) or apply the Master theorem for divide-and-conquer.

### Revision Notes
- Every recursion = **base case + recursive case**; base case must be reachable and the input must shrink.
- **Recursive leap of faith**: trust `solve(smaller)` works; only design the combine step + base case.
- Time = calls × work-per-call; **stack space = max depth**.
- **Memoize** when subproblems overlap (Fibonacci) to go exponential → linear.
- **Tail recursion** = recursive call is the last action; JS does *not* reliably optimize it.
- Master theorem: merge sort `2T(n/2)+O(n)` = **O(n log n)**.
- Deep recursion risks **stack overflow** — convert to a loop / explicit stack.

### Cheat Sheet
```
BASE CASE first, then RECURSE on smaller input, then COMBINE.
Linear     T(n)=T(n-1)+O(1)      -> O(n) time, O(n) stack
Halving    T(n)=T(n/2)+O(1)      -> O(log n)
D&C merge  T(n)=2T(n/2)+O(n)     -> O(n log n)
Naive fib  T(n)=T(n-1)+T(n-2)    -> O(2^n)  (memoize -> O(n))
Overflow risk => memoize or convert to iteration (explicit stack).
```

---

## 12. Backtracking  —  🔶 **RECOMMENDED (do after core)**

### Concept
Backtracking is a **systematic brute-force** technique for problems that ask you to build a solution one **choice** at a time (subsets, permutations, board placements, paths). You **choose** an option, **explore** the consequences recursively, then **unchoose** (undo the choice) so you can try the next option. It explores a **decision tree** and abandons ("prunes") any branch as soon as it can't possibly lead to a valid solution.

It's recursion with a twist: you don't just call yourself — you **mutate a shared partial solution, recurse, then restore it**.

### Intuition
Imagine walking a maze while dropping breadcrumbs. At each junction you pick a direction (**choose**), walk forward (**explore**). If you hit a dead end, you walk back to the junction and pick up your breadcrumb (**unchoose**), then try the next direction. You never keep two paths in memory — just the single current path plus the ability to rewind.

The key insight vs plain brute force: **pruning**. If a partial choice already violates a constraint (e.g. two queens attacking), you stop immediately instead of completing the whole arrangement — cutting off an entire subtree of dead options.

### Visual
Decision tree for **subsets of `[1,2,3]`** — at each element decide *skip* or *include*:

```
                          [] pick from index 0
                 skip 1 /            \ include 1
              []                        [1]
        skip2/  \incl2            skip2/   \incl2
       []        [2]             [1]         [1,2]
     s/ \i      s/ \i          s/  \i       s/   \i
    []  [3]   [2] [2,3]      [1] [1,3]   [1,2] [1,2,3]
```

Each leaf is one subset (2³ = 8 total). The path from root to a node is the current partial solution. Backtracking = walking down (choose) and back up (unchoose) this tree.

**N-Queens pruning** (4×4): once a queen is placed, whole columns/diagonals are cut before we ever recurse into them:

```
row0: . Q . .      row1 can't use col1 or diagonals of it
row1: . . . Q      -> only some cols survive; invalid ones pruned early
```

### Time & Space Complexity
Backtracking is usually **exponential** — you're enumerating a combinatorial space — but pruning cuts the constant/branches dramatically.

| Problem | Search space | Time | Space (excl. output) |
|---|---|---|---|
| Subsets | each of n items in/out | O(2ⁿ · n) | O(n) recursion depth |
| Permutations | orderings of n | O(n! · n) | O(n) |
| Combinations C(n,k) | choose k of n | O(C(n,k) · k) | O(k) |
| N-Queens | placements | O(n!) with pruning | O(n) |
| Combination Sum | tree of sums | exponential, pruned | O(target/min) depth |

The `· n` / `· k` factor is the cost of **copying a completed solution** into the results list. Space is dominated by the recursion depth (the length of the current path), plus the output.

### Common Interview Patterns
- **Subsets / power set** — include-or-exclude each element.
- **Permutations** — try each unused element in each position (track a `used[]`).
- **Combinations** — pick k items, use a `start` index to avoid reusing/reordering.
- **Combination Sum / partitioning** — build up toward a target, prune when exceeded.
- **Grid/board search** — N-Queens, Sudoku, word search, rat-in-a-maze (4-directional DFS with visited marks).
- **String building** — generate parentheses, letter combinations of a phone number, palindrome partitioning.
- **Constraint satisfaction** — validity check + prune early (the heart of efficient backtracking).

### Template Code
```js
// ===== THE GENERAL BACKTRACKING TEMPLATE (memorize this) =====
function backtrack(state, choices, result) {
  // 1) GOAL: is the current state a complete valid solution?
  if (isComplete(state)) {
    result.push([...state]);   // COPY the state (it will keep mutating!)
    return;
  }

  // 2) Try every candidate choice from here.
  for (const choice of choices) {
    if (!isValid(state, choice)) continue; // 3) PRUNE invalid branches early

    state.push(choice);                    // CHOOSE
    backtrack(state, nextChoices(choices, choice), result); // EXPLORE
    state.pop();                           // UNCHOOSE (backtrack / restore)
  }
}

// ---- Concrete: SUBSETS of nums ----
function subsets(nums) {
  const res = [], path = [];
  const dfs = (start) => {
    res.push([...path]);                 // every node is a valid subset
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);                // choose
      dfs(i + 1);                        // explore (i+1 avoids reuse)
      path.pop();                        // unchoose
    }
  };
  dfs(0);
  return res;
}

// ---- Concrete: PERMUTATIONS of nums ----
function permute(nums) {
  const res = [], path = [], used = Array(nums.length).fill(false);
  const dfs = () => {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;             // prune: already in path
      used[i] = true;  path.push(nums[i]);   // choose
      dfs();                                 // explore
      path.pop();      used[i] = false;      // unchoose
    }
  };
  dfs();
  return res;
}

// ---- Concrete: COMBINATIONS (choose k of 1..n) ----
function combine(n, k) {
  const res = [], path = [];
  const dfs = (start) => {
    if (path.length === k) { res.push([...path]); return; }
    // prune: not enough numbers left to reach size k
    for (let i = start; i <= n - (k - path.length) + 1; i++) {
      path.push(i);        // choose
      dfs(i + 1);          // explore
      path.pop();          // unchoose
    }
  };
  dfs(1);
  return res;
}

// ---- Concrete: N-QUEENS (count / collect valid boards) ----
function solveNQueens(n) {
  const res = [], cols = new Set(), diag = new Set(), anti = new Set();
  const board = Array.from({ length: n }, () => Array(n).fill('.'));
  const dfs = (row) => {
    if (row === n) { res.push(board.map(r => r.join(''))); return; }
    for (let col = 0; col < n; col++) {
      // prune: same column, or same diagonal (row-col) / anti-diagonal (row+col)
      if (cols.has(col) || diag.has(row - col) || anti.has(row + col)) continue;
      cols.add(col); diag.add(row - col); anti.add(row + col);
      board[row][col] = 'Q';                       // choose
      dfs(row + 1);                                // explore next row
      board[row][col] = '.';                       // unchoose
      cols.delete(col); diag.delete(row - col); anti.delete(row + col);
    }
  };
  dfs(0);
  return res;
}
```

### Dry Run
Trace `subsets([1,2])`. `path` mutates; `res` collects **copies**:

```
dfs(0): push [] copy            res = [ [] ]
  i=0: choose 1  path=[1]
    dfs(1): push [1] copy       res = [ [], [1] ]
      i=1: choose 2 path=[1,2]
        dfs(2): push [1,2] copy res = [ [], [1], [1,2] ]
          (loop i=2 doesn't run, start>last)
        unchoose 2 -> path=[1]
    return, unchoose 1 -> path=[]
  i=1: choose 2  path=[2]
    dfs(2): push [2] copy       res = [ [], [1], [1,2], [2] ]
      (no further)
    unchoose 2 -> path=[]
return
```

Result: `[[], [1], [1,2], [2]]` — all 2² = 4 subsets. Notice the **choose → recurse → unchoose** rhythm keeps `path` correct across every branch.

### Common Mistakes
- **Pushing the state by reference** instead of a copy: `res.push(path)` — every entry ends up pointing to the *same* array that later becomes empty. Use `res.push([...path])`.
- **Forgetting to unchoose** (`path.pop()` / clearing `used`) — state leaks into sibling branches, producing wrong/duplicate results.
- **Wrong start index** in combinations/subsets: reusing `start` instead of `i+1` allows repeats or reorderings.
- **Not pruning** — technically correct but times out; add validity checks and early cutoffs.
- **Duplicate results with duplicate inputs** — must sort first and skip `nums[i]===nums[i-1]` at the same tree level.
- **Mutating results after collecting** — modifying `board` cells without restoring before/after push.
- **Off-by-one in the base case** (`path.length === k` vs `> k`).

### Edge Cases
- **Empty input** — subsets should return `[[]]`; permutations `[[]]`; combinations of k=0 → `[[]]`.
- **Single element** — one non-empty subset plus the empty set.
- **Duplicates in input** — dedupe by sorting + skipping equal siblings.
- **k = 0 or k = n** in combinations — degenerate but valid.
- **n = 0 or 1 for N-Queens** — n=1 has 1 solution; n=2, n=3 have 0 solutions (good to state aloud).
- **Large n** — exponential blow-up; interviewer usually caps n small; mention the growth.

### Interview Tips
- Say the mantra: **"choose, explore, unchoose."** Draw the decision tree first — it makes the code obvious.
- Explicitly point out **where you prune** ("I skip this column because a queen already attacks it") — pruning is what separates good candidates.
- Always mention the **copy-on-collect** (`[...path]`) — a very common bug interviewers watch for.
- Derive complexity from the **tree shape**: branching factor and depth → `2ⁿ`, `n!`, or `C(n,k)`; add the copy cost factor.
- Distinguish backtracking from plain DFS: backtracking **undoes** its choice on the way back up.
- For dedup problems, state "sort, then skip equal siblings at the same depth" before coding.

### Practice Problems
**Beginner**
- *Subsets* — all subsets of a set. Pattern: include/exclude via `start` index. O(2ⁿ·n).
- *Combinations* — all k-length combos of 1..n. Pattern: `start` index + size check, prune. O(C(n,k)·k).
- *Letter Case Permutation* — flip letter cases. Pattern: choose/unchoose per letter. O(2ᴸ).

**Medium**
- *Permutations* — all orderings. Pattern: `used[]` array, choose/unchoose. O(n!·n).
- *Combination Sum* — combos summing to target (reuse allowed). Pattern: `start` index, prune when sum>target. Exponential.
- *Generate Parentheses* — all valid n-pair parens. Pattern: track open/close counts, prune invalid. O(4ⁿ/√n).
- *Palindrome Partitioning* — split string into palindromes. Pattern: choose a prefix palindrome, recurse on rest.
- *Word Search* — find word in grid. Pattern: 4-dir DFS + visited marking + backtrack. O(m·n·4ᴸ).
- *Subsets II / Permutations II* — with duplicates. Pattern: sort + skip equal siblings.

**Hard**
- *N-Queens* — place n non-attacking queens. Pattern: per-row placement + column/diagonal sets to prune. O(n!).
- *Sudoku Solver* — fill a 9×9 board. Pattern: try 1–9 in empty cell, validate, backtrack. Exponential, heavy pruning.
- *Word Break II* — all sentence segmentations. Pattern: backtrack over dictionary prefixes + memo.

### Frequently Asked Interview Questions
- **Q: What is backtracking?** A: A refined brute force that builds candidates incrementally and abandons a candidate ("backtracks") as soon as it can't lead to a valid solution — choose, explore, unchoose.
- **Q: How is it different from plain DFS/recursion?** A: It explicitly **undoes** each choice when returning, so a single mutable state is reused across all branches, and it prunes invalid branches early.
- **Q: What is pruning and why does it matter?** A: Skipping branches that can't possibly succeed. It doesn't change the worst-case Big-O but massively cuts real runtime by removing whole subtrees.
- **Q: Why copy the path when collecting a solution?** A: The path keeps mutating during backtracking; without a copy every stored "solution" would point to the same array and end up wrong/empty.
- **Q: What's the time complexity of generating subsets/permutations?** A: 2ⁿ subsets, n! permutations, each times the O(length) copy cost.
- **Q: How do you avoid duplicates?** A: Sort the input, then at each tree level skip a choice equal to its previous sibling.

### Revision Notes
- Mantra: **choose → explore → unchoose**; always restore state on the way up.
- Every backtracking problem = walking a **decision tree**; draw it first.
- **Copy** the solution on collect: `res.push([...path])`.
- **Prune** early with a validity check — it's the difference between passing and TLE.
- Subsets/combos use a **`start` index**; permutations use a **`used[]`** array.
- Complexity is exponential: 2ⁿ (subsets), n! (perms), C(n,k) (combos) × copy cost.
- Dedup: **sort + skip equal siblings** at the same depth.
- N-Queens: track occupied **columns**, **diagonals (row−col)**, **anti-diagonals (row+col)** as sets.

### Cheat Sheet
```
for each choice:
    if !valid(choice): continue      # PRUNE
    make(choice)                     # CHOOSE
    backtrack(next)                  # EXPLORE
    undo(choice)                     # UNCHOOSE
Collect: res.push([...path])         # COPY!
Subsets/Combos -> start index    Permutations -> used[] array
Dedup -> sort + skip nums[i]===nums[i-1] at same level
N-Queens sets: cols, diag=row-col, anti=row+col
Complexity: subsets 2^n · n | perms n! · n | combos C(n,k) · k
```

---

## Part 4 — Recommended Practice Order

Practice in this order so each skill builds on the previous one:

1. **Recursion (Topic 11) first — master the mechanics.** Backtracking *is* recursion with undo, so you cannot do it well until the call stack, base/recursive cases, and the recursion tree feel automatic. Start with linear recursion (factorial, sum, reverse), then tree recursion (Fibonacci), then add memoization, then divide-and-conquer (merge sort, binary search). End by hand-drawing a call stack and deriving complexity from a recurrence.

2. **Tail recursion & recursion↔iteration conversions next.** Convert two or three of your recursive solutions into iterative ones with an explicit stack. This cements *why* recursion costs O(depth) space and prepares you to reason about stack overflow — a favorite follow-up question.

3. **Backtracking (Topic 12) — start with subsets.** Subsets is the gentlest decision tree (just include/exclude) and teaches the choose/explore/unchoose rhythm and the copy-on-collect bug.

4. **Then combinations and permutations.** These add the two core control mechanisms — the `start` index and the `used[]` array — and show how the same template flexes.

5. **Then constraint-heavy problems: Combination Sum and Generate Parentheses.** Here pruning becomes essential; practice saying out loud exactly where and why you cut a branch.

6. **Finish with grid/board backtracking: Word Search, then N-Queens, then Sudoku.** These combine everything — recursion, a mutable shared state, aggressive pruning, and careful undo — and are the classic hard interview closers.

Rule of thumb: for every problem, **draw the tree, write the base case, then fill in choose/explore/unchoose** before touching complexity analysis.


---


# Part 5 — Linear Structures

## 13. Linked Lists  —  ✅ **MUST-DO (core minimum)**

### Concept
A linked list is a linear collection of **nodes**, where each node holds a value plus a reference (pointer) to the next node. Unlike an array, the elements are **not** stored in one contiguous block of memory — each node lives wherever, and the `next` pointer is the only thing that stitches them into a sequence.

- **Singly linked list**: each node points only forward (`next`).
- **Doubly linked list**: each node points forward and backward (`next` and `prev`).
- The list is accessed through a `head` reference (and often a `tail`).

### Intuition
Think of a scavenger hunt: you start at the `head` clue, and each clue tells you where the *next* clue is. You can't jump to clue #5 directly — you must follow clue 1 → 2 → 3 → 4 → 5. That is exactly why access is O(n): there is no index arithmetic, only pointer-chasing.

The payoff: because nodes are independent, splicing a new node in or cutting one out is just **rewiring two pointers** — no shifting of everything after it (which is what makes array insert/delete O(n)).

### Visual
Singly linked list:

```
head
 |
 v
+----+----+   +----+----+   +----+----+
| 10 |  *-+-->| 20 |  *-+-->| 30 | null|
+----+----+   +----+----+   +----+----+
 val  next     val  next     val  next
```

Doubly linked list:

```
       +----+----+----+     +----+----+----+     +----+----+----+
null <-+-*  | 10 |  *-+---> <-+-*  | 20 |  *-+---> <-+-*  | 30 |  *-+--> null
       +----+----+----+     +----+----+----+     +----+----+----+
        prev val  next        prev val  next        prev val  next
```

Insert 15 between 10 and 20 (singly) — only two pointers change:

```
before:  [10]--->[20]--->[30]
                  ^
              new [15]
after:   [10]-->[15]-->[20]--->[30]
```

### Time & Space Complexity

| Operation                          | Singly | Doubly | Why |
|------------------------------------|--------|--------|-----|
| Access / search by value           | O(n)   | O(n)   | Must walk from head |
| Insert at head                     | O(1)   | O(1)   | Rewire head pointer |
| Insert at tail (with tail ptr)     | O(1)   | O(1)   | Rewire tail pointer |
| Insert/delete after a **known** node | O(1) | O(1)   | Just re-point |
| Delete a **given** node (only its ref) | O(n)* | O(1) | Singly needs prev; doubly has `prev` |
| Space                              | O(n)   | O(n)   | One node per element + pointer overhead |

\*Singly needs the previous node, so you must scan to find it (O(n)) unless you use the copy-next trick.

### Common Interview Patterns
- **Dummy (sentinel) head** — avoid special-casing the head during insert/delete.
- **Two pointers — fast/slow** — find the middle, detect a cycle, find k-th from end.
- **In-place reversal** — reverse whole list or a sub-range.
- **Merge two lists** — like the merge step of merge sort.
- **Runner technique** — one pointer ahead of another by a fixed gap.

### Template Code
```js
// Node factory (or a class)
class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Build a list from an array (helper for testing)
function fromArray(arr) {
  const dummy = new ListNode(0);
  let tail = dummy;
  for (const v of arr) {
    tail.next = new ListNode(v);
    tail = tail.next;
  }
  return dummy.next;
}

// Traverse
function printList(head) {
  const out = [];
  for (let cur = head; cur !== null; cur = cur.next) out.push(cur.val);
  console.log(out.join(" -> "));
}

// Reverse a singly linked list (iterative) — MEMORIZE THIS
function reverse(head) {
  let prev = null;
  let cur = head;
  while (cur !== null) {
    const next = cur.next; // 1. save the rest
    cur.next = prev;        // 2. flip the pointer
    prev = cur;             // 3. advance prev
    cur = next;             // 4. advance cur
  }
  return prev; // prev is the new head
}

// Dummy-head trick: delete all nodes equal to `target`
function deleteAll(head, target) {
  const dummy = new ListNode(0, head); // sits before head
  let prev = dummy;
  let cur = head;
  while (cur !== null) {
    if (cur.val === target) {
      prev.next = cur.next; // skip cur; prev stays put
    } else {
      prev = cur;           // only advance prev when we keep cur
    }
    cur = cur.next;
  }
  return dummy.next; // handles head being deleted for free
}

// Fast/slow: find middle (returns 2nd middle on even length)
function middle(head) {
  let slow = head, fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}

// Fast/slow: detect a cycle (Floyd's tortoise & hare)
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true; // pointers met -> loop
  }
  return false;
}
```

### Dry Run
**Reverse `1 -> 2 -> 3`** using `reverse()`:

```
start:  prev=null, cur=1->2->3

iter 1: next=2->3;  1.next=null;  prev=1;      cur=2->3
        list so far: null<-1     (prev=1)
iter 2: next=3;     2.next=1;     prev=2->1;   cur=3
        list so far: null<-1<-2  (prev=2)
iter 3: next=null;  3.next=2;     prev=3->2->1; cur=null
        list so far: null<-1<-2<-3 (prev=3)

cur===null -> stop. return prev = 3 -> 2 -> 1  ✅
```

**Find middle of `10 -> 20 -> 30 -> 40 -> 50`:**

```
slow=10 fast=10
step1: slow=20 fast=30
step2: slow=30 fast=50
fast.next===null -> stop. middle = 30 ✅
```

### Common Mistakes
- **Losing the rest of the list**: assigning `cur.next = prev` *before* saving `next`. Always cache `next` first.
- **Null-deref in fast/slow**: checking `fast.next.next` without first confirming `fast` and `fast.next` are non-null. Order matters: `fast !== null && fast.next !== null`.
- **Forgetting to return the new head** after reversal (returning `head`, which is now the tail).
- **Not using a dummy head**, then writing fragile special-case code for deleting the first node.
- **Infinite loop** on a list with a cycle when you assumed it was linear.
- Advancing `prev` even when you deleted a node (in delete-loops, only advance `prev` on a *keep*).

### Edge Cases
- Empty list (`head === null`).
- Single node (`head.next === null`) — middle, reverse, cycle checks must still work.
- Two nodes (even length middle definition).
- All nodes match the delete target (including the head).
- A cycle present (guard your loops).
- Deleting the tail vs. the head.

### Interview Tips
- Say out loud: "Access is O(n) because there's no indexing — I have to chase pointers from the head." That single sentence signals you understand the core trade-off vs arrays.
- Draw the boxes-and-arrows diagram on the whiteboard before coding. Interviewers love seeing pointer rewiring visualized.
- Reach for a **dummy head** the moment the head might change — mention it explicitly.
- For fast/slow, state the invariant: "fast moves twice as fast, so when it hits the end, slow is at the middle."
- Derive cycle-detection complexity aloud: O(n) time, O(1) space — highlight the O(1) space vs a hash-set approach.

### Practice Problems
**Beginner**
- **Reverse Linked List** — reverse a singly list. Pattern: iterative pointer flip (prev/cur/next). Target O(n) time, O(1) space.
- **Middle of the Linked List** — return the middle node. Pattern: fast/slow. O(n)/O(1).
- **Remove Linked List Elements** — delete all nodes with a given value. Pattern: dummy head. O(n)/O(1).

**Medium**
- **Linked List Cycle** — detect a loop. Pattern: Floyd's tortoise & hare. O(n)/O(1).
- **Linked List Cycle II** — return the node where the cycle begins. Pattern: Floyd + reset one pointer to head. O(n)/O(1).
- **Remove Nth Node From End** — one pass. Pattern: two pointers with an n-gap + dummy head. O(n)/O(1).
- **Merge Two Sorted Lists** — merge into one sorted list. Pattern: dummy head + two pointers. O(n+m)/O(1).
- **Reorder List** — L0→Ln→L1→Ln-1…. Pattern: find middle + reverse second half + merge. O(n)/O(1).
- **Palindrome Linked List** — is it a palindrome? Pattern: find middle, reverse half, compare. O(n)/O(1).

**Hard**
- **Reverse Nodes in k-Group** — reverse every k nodes. Pattern: dummy head + segment reversal. O(n)/O(1).
- **Merge k Sorted Lists** — merge k lists. Pattern: min-heap or divide & conquer. O(N log k).
- **Copy List with Random Pointer** — deep copy with extra random pointers. Pattern: interleave clones or hash map. O(n).

### Frequently Asked Interview Questions
- **Q: Array vs linked list — when do you pick a linked list?**
  A: When you do many insertions/deletions at known positions and rarely need random access. Arrays win on cache locality and O(1) indexed access.
- **Q: Why is insertion O(1) but access O(n)?**
  A: Insertion (given the spot) only rewires a couple of pointers; access has no index math, so you must traverse from the head.
- **Q: Singly vs doubly — trade-off?**
  A: Doubly supports O(1) backward traversal and O(1) delete of a known node, at the cost of an extra pointer per node and more bookkeeping.
- **Q: How does Floyd's algorithm find the cycle *start*?**
  A: After they meet, reset one pointer to head; advance both one step at a time — they meet at the cycle's entry (provable with distance math).
- **Q: Can you reverse recursively?**
  A: Yes, but it's O(n) stack space; iterative is O(1) space and preferred.

### Revision Notes
- Node = `{val, next}`; list accessed via `head`.
- Access/search O(n); insert/delete at a known node O(1).
- **reverse**: save next → flip → advance prev → advance cur; return `prev`.
- **Dummy head** kills head-edge-case bugs.
- **Fast/slow**: middle & cycle; loop guard `fast && fast.next`.
- Always cache `next` before rewiring.
- Doubly list → O(1) delete of a known node.
- Cycle detection: O(n) time, O(1) space.

### Cheat Sheet
```js
// Reverse
let prev=null, cur=head;
while(cur){ const n=cur.next; cur.next=prev; prev=cur; cur=n; }
return prev;

// Fast/slow (middle & cycle)
let slow=head, fast=head;
while(fast && fast.next){ slow=slow.next; fast=fast.next.next; /* if(slow===fast) cycle */ }

// Dummy head
const dummy=new ListNode(0, head); /* operate with prev=dummy */ return dummy.next;
```

---

## 14. Stacks  —  ✅ **MUST-DO (core minimum)**

### Concept
A stack is a **LIFO** (Last-In, First-Out) collection: the last thing you push on is the first thing you pop off. It exposes only the "top" — you `push` onto the top and `pop` from the top. Think of a stack of plates.

Core operations: `push(x)`, `pop()`, `peek()`/`top()`, `isEmpty()`, `size`.

### Intuition
Whenever a problem has **nesting**, **matching pairs**, or a "most recent unfinished thing" you need to return to, a stack is the natural fit. The stack *remembers* the order in which things were opened so you can close/resolve them in reverse. That's exactly why function calls, undo history, and bracket matching all use stacks.

### Visual
```
push(1) push(2) push(3)        pop() -> 3
                                
  |   |    |   |    | 3 |         | 2 |   top
  |   |    | 2 |    | 2 |         | 1 |
  | 1 |    | 1 |    | 1 |         |___|
  +---+    +---+    +---+         
                    ^ top
LIFO: last in (3) is first out.
```

### Time & Space Complexity

| Operation | Complexity | Note |
|-----------|-----------|------|
| push      | O(1) amortized | JS `Array.push` |
| pop       | O(1)      | JS `Array.pop` (from the end) |
| peek      | O(1)      | read last element |
| search    | O(n)      | not what a stack is for |
| Space     | O(n)      | n elements |

`Array.push`/`pop` operate at the **end** of the array, so they are O(1) (amortized for push, due to occasional resizing). This is why an array-backed stack is idiomatic in JS — never use `shift`/`unshift` for a stack.

### Common Interview Patterns
- **Matching pairs / validation** — parentheses, tags, brackets.
- **Monotonic stack** — next greater/smaller element, stock span, largest rectangle.
- **Expression evaluation** — infix→postfix, evaluate RPN.
- **Backtracking / DFS** — explicit stack instead of recursion.
- **Undo/redo, browser history** — two stacks.

### Template Code
```js
// Array IS the stack in JS — push/pop at the end.
const stack = [];
stack.push(1);          // [1]
stack.push(2);          // [1,2]
const top = stack[stack.length - 1]; // peek -> 2
const x = stack.pop();  // 2, stack=[1]
const empty = stack.length === 0;

// Valid Parentheses — classic matching-pairs stack
function isValid(s) {
  const stack = [];
  const pairs = { ")": "(", "]": "[", "}": "{" };
  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);                 // opening -> remember it
    } else {
      // closing: top must be its matching opener
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;          // nothing left unclosed
}

// Monotonic (decreasing) stack — Next Greater Element
// For each element, find the next element to its right that is larger.
function nextGreater(nums) {
  const res = new Array(nums.length).fill(-1);
  const stack = []; // stores INDICES; values are decreasing bottom->top
  for (let i = 0; i < nums.length; i++) {
    // while current is greater than value at top index, we found its answer
    while (stack.length && nums[i] > nums[stack[stack.length - 1]]) {
      const idx = stack.pop();
      res[idx] = nums[i];
    }
    stack.push(i);
  }
  return res;
}

// Evaluate Reverse Polish Notation (postfix)
function evalRPN(tokens) {
  const stack = [];
  const ops = { "+": (a,b)=>a+b, "-": (a,b)=>a-b, "*": (a,b)=>a*b, "/": (a,b)=>Math.trunc(a/b) };
  for (const t of tokens) {
    if (t in ops) {
      const b = stack.pop(), a = stack.pop(); // order matters!
      stack.push(ops[t](a, b));
    } else {
      stack.push(Number(t));
    }
  }
  return stack.pop();
}
```

### Dry Run
**`isValid("([])")`:**

```
ch='(' -> push  stack=['(']
ch='[' -> push  stack=['(','[']
ch=']' -> closing; pop '[' === pairs[']']='[' ✅  stack=['(']
ch=')' -> closing; pop '(' === pairs[')']='(' ✅  stack=[]
end: stack empty -> true ✅
```

**`nextGreater([2,1,3])`** (stack holds indices; nums shown for clarity):

```
i=0 (2): stack empty -> push 0        stack=[0]        res=[-1,-1,-1]
i=1 (1): 1>nums[0]=2? no -> push 1     stack=[0,1]      res=[-1,-1,-1]
i=2 (3): 3>nums[1]=1? yes -> pop1, res[1]=3
         3>nums[0]=2? yes -> pop0, res[0]=3
         push 2                        stack=[2]        res=[3,3,-1]
end: res=[3,3,-1] ✅ (2's next greater=3, 1's=3, 3 has none)
```

### Common Mistakes
- **Popping an empty stack**: always check `stack.length` before `pop` in matching problems (and treat an unexpected pop as failure).
- **Operand order in evaluation**: `a` is popped *second*, `b` first; `a - b` not `b - a`.
- Using `shift()`/`unshift()` to simulate a stack — that's O(n) and unnecessary; use the end of the array.
- **Storing values vs indices** in a monotonic stack — store indices when you need positions/distances.
- Forgetting the final `stack.length === 0` check in parentheses (leaves `"((("` passing).

### Edge Cases
- Empty input (`""` → valid; empty tokens → guard).
- Only opening or only closing brackets.
- Single element.
- All equal elements in a monotonic stack (choose `>` vs `>=` deliberately).
- Odd-length bracket strings (can never be valid).

### Interview Tips
- Name the pattern explicitly: "This is a matching-pairs problem, so a stack is the right tool."
- For monotonic stacks, state the invariant: "The stack stays decreasing; when the current element breaks that, it's the *answer* for everything I pop."
- Derive complexity aloud for monotonic stack: "Each index is pushed and popped at most once → O(n) total, even though there's a nested `while`."
- Mention that recursion uses the call stack — so any recursive DFS can be rewritten with an explicit stack.

### Practice Problems
**Beginner**
- **Valid Parentheses** — are brackets balanced/matched? Pattern: matching-pairs stack. O(n).
- **Baseball Game** — apply ops to a running score list. Pattern: stack of scores. O(n).
- **Remove All Adjacent Duplicates** — collapse adjacent equal chars. Pattern: stack, pop on match. O(n).

**Medium**
- **Min Stack** — stack with O(1) `getMin`. Pattern: auxiliary stack of running minima. O(1) ops.
- **Evaluate Reverse Polish Notation** — compute postfix expression. Pattern: operand stack. O(n).
- **Daily Temperatures** — days until a warmer day. Pattern: monotonic decreasing stack of indices. O(n).
- **Next Greater Element I/II** — next larger to the right (II is circular). Pattern: monotonic stack. O(n).
- **Asteroid Collision** — simulate collisions. Pattern: stack simulation. O(n).
- **Decode String** — expand `3[a2[c]]`. Pattern: two stacks (counts + strings). O(n).

**Hard**
- **Largest Rectangle in Histogram** — max area rectangle. Pattern: monotonic increasing stack of indices. O(n).
- **Trapping Rain Water** — water trapped between bars. Pattern: monotonic stack (or two pointers). O(n).
- **Basic Calculator** — evaluate `+ - ( )` expressions. Pattern: stack for signs/parens. O(n).

### Frequently Asked Interview Questions
- **Q: What is LIFO and give a real example?**
  A: Last-In-First-Out; the function call stack, undo history, or a stack of plates.
- **Q: Why is an array a good stack in JS?**
  A: `push`/`pop` at the end are O(1) (amortized), so no extra structure is needed.
- **Q: What is a monotonic stack and when do you use it?**
  A: A stack kept sorted (increasing or decreasing); used for "next greater/smaller element" style problems in O(n).
- **Q: How would you implement a stack with O(1) min?**
  A: Keep a second stack that tracks the minimum at each level (push min(x, currentMin)).
- **Q: Stack vs queue?**
  A: Stack is LIFO (top only); queue is FIFO (front out, back in).

### Revision Notes
- LIFO: push/pop/peek at the **end** of a JS array, all O(1).
- Never use `shift`/`unshift` for a stack.
- Matching-pairs → push openers, pop-and-check on closers, end must be empty.
- Monotonic stack → each index pushed/popped once → O(n); store indices for positions.
- RPN eval: pop `b` then `a`; mind operator order.
- Recursion == implicit stack (call stack).
- Two stacks → Min Stack, undo/redo.

### Cheat Sheet
```js
const st=[]; st.push(x); st.pop(); const top=st[st.length-1]; st.length===0;

// Valid parens
const m={')':'(',']':'[','}':'{'};
for(const c of s){ if('([{'.includes(c)) st.push(c);
  else if(st.pop()!==m[c]) return false; }
return st.length===0;

// Monotonic (next greater), store indices
for(let i=0;i<n;i++){ while(st.length && a[i]>a[st.at(-1)]) res[st.pop()]=a[i]; st.push(i); }
```

---

## 15. Queues  —  ✅ **MUST-DO (core minimum)**

### Concept
A queue is a **FIFO** (First-In, First-Out) collection: the first thing you enqueue is the first thing you dequeue. You add at the **back** and remove from the **front**. Think of a line at a checkout.

Core ops: `enqueue(x)` (add to back), `dequeue()` (remove from front), `front()`/`peek()`, `isEmpty()`, `size`.

Variants:
- **Deque** (double-ended queue): add/remove at both ends.
- **Circular queue**: fixed-size ring buffer that reuses freed slots.

### Intuition
A queue preserves arrival order and processes things "fairly" — oldest first. This is exactly the order **BFS** explores a graph/tree (level by level), and how task schedulers, print queues, and buffers work. Whenever you need "process in the order they arrived / explore nearest first," reach for a queue.

### Visual
```
enqueue(A), enqueue(B), enqueue(C):

 front                back
   v                    v
 [ A ][ B ][ C ]
   ^ dequeue removes A

dequeue() -> A
 front           back
   v               v
      [ B ][ C ]
```

The `Array.shift()` trap:

```
[ A ][ B ][ C ][ D ]
 shift() removes A, then EVERY remaining element slides left one slot:
[ B ][ C ][ D ]        <- O(n) work each time!
```

### Time & Space Complexity

| Approach | enqueue | dequeue | peek | Note |
|----------|---------|---------|------|------|
| `Array.push` + `Array.shift` | O(1) | **O(n)** | O(1) | `shift` re-indexes all elements |
| Array + head pointer | O(1) | **O(1)** | O(1) | don't shift; move a `head` index |
| Two stacks | O(1) | O(1) amortized | O(1) | pour in→out only when out is empty |
| Linked list (head+tail) | O(1) | O(1) | O(1) | no reindexing |
| Space | — | — | — | O(n) |

### Common Interview Patterns
- **BFS** on trees/graphs (level-order, shortest path in unweighted graphs).
- **Sliding window maximum** — monotonic **deque**.
- **Level-order traversal** — process one level at a time (snapshot `queue.length`).
- **Multi-source BFS** — seed the queue with several starts.
- **Producer/consumer buffering** — circular queue.

### Template Code
```js
// ❌ Simple but O(n) dequeue — fine for tiny inputs, bad at scale
const q = [];
q.push(1);          // enqueue
const x = q.shift(); // dequeue -- O(n)!

// ✅ O(1) queue with a moving head index (no shifting)
class Queue {
  constructor() { this.items = []; this.head = 0; }
  enqueue(x) { this.items.push(x); }
  dequeue() {
    if (this.head >= this.items.length) return undefined; // empty
    const x = this.items[this.head++];
    // occasionally compact so the array doesn't grow unbounded
    if (this.head > 32 && this.head * 2 > this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return x;
  }
  front() { return this.items[this.head]; }
  get size() { return this.items.length - this.head; }
  isEmpty() { return this.size === 0; }
}

// ✅ Queue via two stacks (classic interview build)
class QueueTwoStacks {
  constructor() { this.inStack = []; this.outStack = []; }
  enqueue(x) { this.inStack.push(x); }
  dequeue() {
    if (!this.outStack.length) {              // refill only when empty
      while (this.inStack.length) this.outStack.push(this.inStack.pop());
    }
    return this.outStack.pop();               // amortized O(1)
  }
}

// Circular queue (fixed capacity ring buffer)
class CircularQueue {
  constructor(k) { this.buf = new Array(k); this.cap = k; this.head = 0; this.count = 0; }
  enqueue(x) {
    if (this.count === this.cap) return false; // full
    this.buf[(this.head + this.count) % this.cap] = x;
    this.count++;
    return true;
  }
  dequeue() {
    if (this.count === 0) return undefined;    // empty
    const x = this.buf[this.head];
    this.head = (this.head + 1) % this.cap;
    this.count--;
    return x;
  }
}

// BFS template (level-order over a tree) — MEMORIZE THIS
function bfsLevels(root) {
  if (!root) return [];
  const levels = [];
  const queue = [root];        // small inputs: array-as-queue is OK
  let head = 0;                // use head pointer to avoid shift()
  while (head < queue.length) {
    const levelSize = queue.length - head; // snapshot this level
    const level = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue[head++];
      level.push(node.val);
      if (node.left)  queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    levels.push(level);
  }
  return levels;
}
```

### Dry Run
**Two-stack queue**: enqueue 1, 2, 3, then dequeue twice.

```
enqueue 1,2,3 -> inStack=[1,2,3]  outStack=[]

dequeue():
  outStack empty -> pour: pop 3,2,1 into outStack
  inStack=[]  outStack=[3,2,1]   (1 now on top!)
  pop -> 1  ✅   outStack=[3,2]

dequeue():
  outStack not empty -> no pour
  pop -> 2  ✅   outStack=[3]
```
FIFO order 1, 2 preserved. Each item is moved between stacks at most once → **amortized O(1)**.

**BFS levels** on:
```
      1
     / \
    2   3
         \
          4
```
```
queue=[1] head=0
level: size=1 -> node 1, push 2,3 -> queue=[1,2,3] head=1 -> levels=[[1]]
level: size=2 -> node 2 (no kids), node 3 (push 4) -> queue=[1,2,3,4] head=3 -> levels=[[1],[2,3]]
level: size=1 -> node 4 (no kids) -> head=4 -> levels=[[1],[2,3],[4]]
head===length -> stop. result [[1],[2,3],[4]] ✅
```

### Common Mistakes
- **Using `shift()` in a loop** → hidden O(n²). The #1 queue performance bug in interviews. Use a head pointer or a deque.
- **Not snapshotting `levelSize`** in BFS — if you read `queue.length` inside the loop while pushing children, you merge levels.
- Circular queue: mixing up **full vs empty** — track a `count` (or leave one slot empty) instead of relying on `head === tail`.
- Two-stack queue: pouring on **every** dequeue instead of only when `outStack` is empty (kills the amortized bound).
- Forgetting to mark nodes visited in graph BFS → revisits / infinite loops.

### Edge Cases
- Empty queue (`dequeue` returns `undefined`; guard it).
- Single element.
- Circular queue at exactly full / exactly empty capacity.
- BFS on `null` root.
- Graph with cycles (must track `visited`).
- Large N where `shift()` would TLE.

### Interview Tips
- Proactively flag the `shift()` cost: "I'll use a head pointer so dequeue stays O(1) — `Array.shift` is O(n)." Interviewers notice this.
- For BFS, verbalize the invariant: "Everything in the queue is one distance farther than what I've already processed, so the first time I reach a node is via the shortest path."
- Distinguish clearly: stack = LIFO = DFS; queue = FIFO = BFS.
- If asked for a deque, mention JS has no built-in — you'd use a doubly linked list or a head/tail-indexed array.
- Derive the two-stack amortized O(1) aloud: "each element is pushed to in, popped from in, pushed to out, popped from out — 4 O(1) ops total, spread over its lifetime."

### Practice Problems
**Beginner**
- **Implement Queue using Stacks** — build a FIFO from two LIFOs. Pattern: two stacks, lazy pour. Amortized O(1).
- **Implement Stack using Queues** — the reverse. Pattern: one/two queues. O(n) push or pop.
- **Number of Recent Calls** — count pings in last 3000ms. Pattern: queue, dequeue stale. O(1) amortized.

**Medium**
- **Binary Tree Level Order Traversal** — return values level by level. Pattern: BFS with level snapshot. O(n).
- **Rotting Oranges** — minutes until all oranges rot. Pattern: multi-source BFS. O(rows·cols).
- **Design Circular Queue** — fixed-size ring buffer. Pattern: modular indices + count. O(1) ops.
- **Walls and Gates / 01 Matrix** — nearest distance grids. Pattern: multi-source BFS. O(cells).
- **Open the Lock** — shortest turns to a target combo. Pattern: BFS over states. O(states).

**Hard**
- **Sliding Window Maximum** — max of each window of size k. Pattern: monotonic deque of indices. O(n).
- **Shortest Path in a Grid with Obstacles Elimination** — BFS over (cell, remaining eliminations) states. O(cells·k).
- **Word Ladder** — shortest transformation sequence. Pattern: BFS over word graph. O(N·L²).

### Frequently Asked Interview Questions
- **Q: What is FIFO and a real example?**
  A: First-In-First-Out; a checkout line, print queue, or CPU task scheduler.
- **Q: Why is `Array.shift()` O(n)?**
  A: Removing index 0 forces every remaining element to re-index (slide left one slot).
- **Q: How do you get an O(1) dequeue in JS?**
  A: Keep a moving `head` index (don't actually remove), use two stacks, or a doubly linked list.
- **Q: Why does BFS need a queue?**
  A: FIFO order guarantees nodes are visited in increasing distance from the source → shortest path in unweighted graphs.
- **Q: Stack vs queue?**
  A: Stack = LIFO (DFS, backtracking); queue = FIFO (BFS, scheduling).
- **Q: What's a deque good for?**
  A: O(1) add/remove at both ends — e.g., sliding-window maximum with a monotonic deque.

### Revision Notes
- FIFO: enqueue at back, dequeue at front.
- **`Array.shift()` is O(n)** — avoid in hot loops; use a head pointer.
- O(1) dequeue: head index, two stacks (amortized), or linked list.
- BFS uses a queue; snapshot `levelSize` before draining a level.
- Circular queue: `(head + count) % cap`; track `count` for full/empty.
- Deque = both ends O(1); used for sliding-window max.
- Two-stack queue: pour in→out only when out is empty.

### Cheat Sheet
```js
// O(1) queue via head pointer
class Q{constructor(){this.a=[];this.h=0;}
  push(x){this.a.push(x);} pop(){return this.a[this.h++];}
  get size(){return this.a.length-this.h;}}

// BFS level order
const q=[root]; let h=0;
while(h<q.length){ const n=q.length-h;
  for(let i=0;i<n;i++){ const x=q[h++]; if(x.left)q.push(x.left); if(x.right)q.push(x.right);} }

// Circular index
idx=(head+count)%cap;
```

---

## Part 5 — Recommended Practice Order

Practice in this order — it builds pointer/iteration muscle first, then layers the two structures that depend on that same mechanical fluency:

1. **Stacks (Topic 14) first.** It's the most self-contained: a plain JS array *is* a stack, so there's zero new data-structure plumbing to fight with. Nail LIFO thinking, Valid Parentheses, and the monotonic-stack pattern — this pattern reappears constantly and teaches the "each element pushed/popped once → O(n)" analysis you'll reuse everywhere.
2. **Queues (Topic 15) next.** FIFO is the natural contrast to LIFO, and the critical lesson — *why `Array.shift()` is O(n)* and how to fix it — deepens the complexity intuition from stacks. Learn the BFS template here; it's a prerequisite for the trees/graphs part later.
3. **Linked Lists (Topic 13) last.** This is the most pointer-heavy and error-prone topic, so tackle it once you're comfortable iterating and reasoning about O(1) vs O(n) operations. Do reversal and the dummy-head trick first, then fast/slow pointers (middle, cycle) — these unlock a large family of medium problems and reinforce the O(1)-insert / O(n)-access trade-off that defines the whole group.

Rule of thumb per topic: do all **Beginner** problems until the template is automatic, then 2–3 **Medium** to internalize the pattern, and attempt **Hard** only after the pattern is second nature.


---


# Part 6 — Trees, Heaps & Tries

## 16. Trees (General)  —  ✅ **MUST-DO (core minimum)**

### Concept
A **tree** is a hierarchical data structure made of **nodes** connected by **edges**. It starts from a single top node (the **root**) and branches downward. Unlike arrays or linked lists (which are *linear*), a tree is *non-linear*: each node can point to multiple children, but every node has exactly one parent — except the root, which has none.

Formally, a tree with `n` nodes has exactly `n - 1` edges, and there is exactly one path between any two nodes. There are **no cycles** — that is what separates a tree from a general graph.

### Intuition
Think of a family tree, a company org chart, or your computer's folder structure. Each folder can contain sub-folders, which contain more sub-folders. You never loop back to a parent, and there is one clear "top". That is a tree.

The key mental shift from arrays: instead of "next element", a tree node has "a list of children". And because each subtree is itself a smaller tree, trees are **naturally recursive** — the definition of a tree contains a tree.

### Visual
```
                (root)
                  A            depth 0, height 3
                / | \
              B   C   D        depth 1
             / \      |
            E   F     G        depth 2
                     /
                    H          depth 3 (leaf)

Terminology on this tree:
  root      = A            (no parent)
  leaf      = E, F, C, H   (no children)
  internal  = A, B, D, G   (has ≥1 child)
  parent(F) = B
  children(A) = [B, C, D]
  siblings  = B, C, D (share parent A)
  ancestors(H) = G, D, A
  descendants(D) = G, H
  degree(A) = 3            (number of children)
  degree(B) = 2
  depth(E)  = 2            (edges from root down to E)
  height(A) = 3            (edges on longest path root→deepest leaf)
  height(leaf) = 0
  subtree rooted at D = { D, G, H }
```

**Depth vs Height (the classic confusion):**
- **Depth** of a node = number of edges from the **root** down to that node. Root has depth 0.
- **Height** of a node = number of edges on the **longest path** from that node down to a leaf. A leaf has height 0.
- **Height of the tree** = height of its root.

### Time & Space Complexity
For a general tree with `n` nodes traversed once:

| Operation | Time | Space | Notes |
|---|---|---|---|
| Traverse all nodes (DFS/BFS) | O(n) | O(h) DFS / O(w) BFS | Visit each node once |
| Search for a value (unsorted tree) | O(n) | O(h) | No ordering to exploit |
| Compute height | O(n) | O(h) | Recursion depth = h |
| Insert/delete (given parent) | O(1) | O(1) | Just link/unlink a child |

- `h` = height of tree, `w` = max width (nodes on the widest level).
- **Balanced** tree: `h ≈ log n`. **Skewed** (degenerate, chain-like) tree: `h ≈ n`.
- Recursion uses O(h) stack space because the call stack goes exactly as deep as the current path.

### Common Interview Patterns
- **DFS recursion**: "for each node, combine results from its children" (height, size, sum, count leaves).
- **BFS / level-order**: anything mentioning "levels", "closest to root", or "level by level".
- **Divide & conquer on subtrees**: solve left subtree, solve right subtree, merge at the current node.
- **Top-down vs bottom-up**: pass information *down* as parameters, or return information *up* as return values.
- **Parent/ancestor tracking**: carry the path or a parent map.

### Template Code
```js
// General N-ary tree node
class TreeNode {
  constructor(val) {
    this.val = val;
    this.children = []; // array of TreeNode
  }
}

// DFS (pre-order style): process node, then recurse into each child.
function dfs(node) {
  if (node === null) return;      // base case: empty
  // --- visit / process node.val here (pre-order position) ---
  for (const child of node.children) {
    dfs(child);                   // recurse — each child is a smaller tree
  }
  // --- post-order position: runs after all children done ---
}

// Height of an N-ary tree (edges on longest root→leaf path).
function height(node) {
  if (node === null) return -1;   // empty tree height = -1 so a leaf = 0
  let best = -1;
  for (const child of node.children) {
    best = Math.max(best, height(child));
  }
  return best + 1;                // +1 for the edge to this node
}

// Count total nodes.
function countNodes(node) {
  if (node === null) return 0;
  let total = 1;                  // count this node
  for (const child of node.children) total += countNodes(child);
  return total;
}

// BFS / level-order using a queue.
function bfs(root) {
  if (!root) return [];
  const out = [];
  const queue = [root];           // acts as a FIFO queue
  while (queue.length) {
    const node = queue.shift();   // dequeue front
    out.push(node.val);
    for (const child of node.children) queue.push(child); // enqueue children
  }
  return out;
}
```

### Dry Run
Run `height(A)` on the Visual tree above (A→[B,C,D], B→[E,F], D→[G], G→[H]):

```
height(A): children B,C,D
  height(B): children E,F
    height(E): no children -> best=-1 -> return 0
    height(F): no children -> return 0
    best = max(-1,0,0)=0 -> return 0+1 = 1
  height(C): no children -> return 0
  height(D): children G
    height(G): children H
      height(H): no children -> return 0
      best=0 -> return 1
    best=1 -> return 2
  best = max(-1, 1, 0, 2) = 2 -> return 2+1 = 3
Answer: height(A) = 3   ✓ (matches diagram: A→D→G→H is 3 edges)
```

### Common Mistakes
- **Mixing up depth and height** — depth grows downward from root; height grows upward from leaves.
- **Wrong base case for height**: returning `0` for `null` makes a single-node tree report height 1. Use `-1` for null if you define leaf height as 0 (edge-count), or `0`/`1` consistently if counting nodes.
- **Forgetting the null check** before recursing — crashes on empty children.
- **Using recursion on a deep skewed tree** and overflowing the call stack (O(n) depth).
- **Modifying `children` while iterating** over it.

### Edge Cases
- **Empty tree** (`root === null`) — return the identity (height -1, count 0, empty list).
- **Single node** — root is also a leaf; height 0, count 1.
- **Skewed tree** (each node one child) — behaves like a linked list; recursion depth = n.
- **Very wide tree** — BFS queue can hold O(n) nodes at once.

### Interview Tips
- Say the definition crisply: *"A tree is a connected acyclic structure; n nodes, n-1 edges, one path between any two nodes."*
- Always clarify **depth vs height** convention (edges vs nodes) before coding — interviewers care.
- State that trees are recursive and that "most tree problems are one DFS with a clear base case + combine step".
- Derive complexity out loud: *"I touch every node once, so O(n) time; recursion stack is O(h), which is O(log n) balanced, O(n) worst case."*

### Practice Problems
**Beginner**
- *N-ary Tree Preorder Traversal* — return values in pre-order. Key: DFS, visit-then-recurse. O(n).
- *Maximum Depth of N-ary Tree* — deepest level count. Key: `1 + max(child depths)`. O(n).

**Medium**
- *N-ary Tree Level Order Traversal* — group node values by level. Key: BFS with level-size loop. O(n).
- *Clone N-ary Tree* — deep copy. Key: DFS creating new nodes, recurse children. O(n).

**Hard**
- *Serialize and Deserialize N-ary Tree* — encode to string and back. Key: record child count or a sentinel per node. O(n).
- *Lowest Common Ancestor in N-ary tree* — path from root, compare. Key: DFS returning found-flag. O(n).

### Frequently Asked Interview Questions
- **Q: Difference between a tree and a graph?** A tree is a connected, acyclic graph with a designated root and n-1 edges; graphs may have cycles and multiple/zero components.
- **Q: How many edges in a tree with n nodes?** Exactly n-1.
- **Q: Depth vs height?** Depth = distance from root down to the node; height = distance from the node down to its deepest leaf.
- **Q: Why is recursion natural for trees?** Because a subtree is itself a tree, so the same function solves the smaller problem.
- **Q: DFS vs BFS space?** DFS uses O(h) stack; BFS uses O(w) queue (width of the widest level).

### Revision Notes
- Tree = connected, acyclic, one root, n-1 edges, unique path between nodes.
- Root (no parent), leaf (no child), internal (has children).
- Degree = number of children; depth from top, height from bottom.
- Balanced h ≈ log n; skewed h ≈ n.
- Every tree problem = base case (null) + combine children's results.
- DFS → O(h) space; BFS → O(w) space; both O(n) time.

### Cheat Sheet
```
n nodes  -> n-1 edges, unique path, no cycles
depth(root)=0   height(leaf)=0   height(tree)=height(root)
DFS: visit node, recurse children      space O(h)
BFS: queue, level by level             space O(w)
height(x) = 1 + max(height(child)), null -> -1
count(x)  = 1 + sum(count(child)),  null -> 0
```

---

## 17. Binary Trees  —  ✅ **MUST-DO (core minimum)**

### Concept
A **binary tree** is a tree where every node has **at most two children**, conventionally named **left** and **right**. It is the workhorse of tree problems. Special shapes:
- **Full**: every node has 0 or 2 children.
- **Complete**: all levels full except possibly the last, which fills left-to-right (this is what heaps use).
- **Perfect**: all internal nodes have 2 children and all leaves are on the same level.
- **Balanced**: height is O(log n); left/right subtree heights differ by little at every node.
- **Skewed/degenerate**: essentially a linked list (height ≈ n).

### Intuition
Two children is the sweet spot: enough to branch (giving O(log n) depth when balanced) but simple enough that code always deals with just `left` and `right`. Every algorithm reduces to: *do something with the node, recurse left, recurse right, combine*. The order in which you touch node/left/right defines the traversal.

### Visual
```
            1
          /   \
         2     3
        / \     \
       4   5     6

Traversal orders (relative order of Node / Left / Right):
  Preorder  (N L R):  1 2 4 5 3 6     "process before children"
  Inorder   (L N R):  4 2 5 1 3 6     "left, self, right"
  Postorder (L R N):  4 5 2 6 3 1     "children before self"
  Level-order (BFS):  1 2 3 4 5 6     "top-down, left-to-right"
```

### Time & Space Complexity
| Operation | Time | Space | Notes |
|---|---|---|---|
| Any traversal (pre/in/post/level) | O(n) | O(h) recursive / O(w) BFS | Visit each node once |
| Search (unordered) | O(n) | O(h) | No ordering to exploit |
| Height / diameter / path sum | O(n) | O(h) | Single DFS |
| Insert/delete (arbitrary) | O(n) worst | O(h) | Must find the spot first |

- Recursive traversal stack = O(h): O(log n) balanced, O(n) skewed.
- Iterative traversal uses an explicit stack, also O(h). Level-order queue = O(w) ≤ O(n).

### Common Interview Patterns
- **Depth/height/size**: bottom-up DFS returning a number.
- **Diameter / longest path**: DFS returns height while updating a global max.
- **Path problems** (root-to-leaf sum, max path sum): carry a running value down and/or return up.
- **LCA (Lowest Common Ancestor)**: DFS returning where p and q were found.
- **Level-order variants**: right-side view, zigzag, level averages — all BFS with a level-size loop.
- **Symmetry / same-tree**: recurse on two nodes in parallel.
- **Serialize/deserialize**: preorder with null markers.

### Template Code
```js
// Binary tree node
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// ---------- Recursive traversals ----------
function preorder(node, out = []) {   // N L R
  if (!node) return out;
  out.push(node.val);                 // visit
  preorder(node.left, out);
  preorder(node.right, out);
  return out;
}
function inorder(node, out = []) {    // L N R
  if (!node) return out;
  inorder(node.left, out);
  out.push(node.val);                 // visit between children
  inorder(node.right, out);
  return out;
}
function postorder(node, out = []) {  // L R N
  if (!node) return out;
  postorder(node.left, out);
  postorder(node.right, out);
  out.push(node.val);                 // visit after children
  return out;
}

// ---------- Iterative inorder (explicit stack) ----------
function inorderIter(root) {
  const out = [], stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; } // go left as far as possible
    cur = stack.pop();               // backtrack to deepest unvisited
    out.push(cur.val);               // visit
    cur = cur.right;                 // then explore right
  }
  return out;
}

// ---------- Level-order (BFS) grouped by level ----------
function levelOrder(root) {
  if (!root) return [];
  const res = [], queue = [root];
  while (queue.length) {
    const size = queue.length;       // freeze count for THIS level
    const level = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left)  queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    res.push(level);
  }
  return res;
}

// ---------- Common patterns ----------
function height(node) {              // edges on longest path; null = -1
  if (!node) return -1;
  return 1 + Math.max(height(node.left), height(node.right));
}

function diameter(root) {            // longest path (in edges) between any 2 nodes
  let best = 0;
  function depth(node) {             // returns height, updates best
    if (!node) return -1;
    const L = depth(node.left);
    const R = depth(node.right);
    best = Math.max(best, L + R + 2); // path through this node = L->node->R
    return 1 + Math.max(L, R);
  }
  depth(root);
  return best;                       // in edges
}

function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root; // found one, or dead end
  const L = lowestCommonAncestor(root.left, p, q);
  const R = lowestCommonAncestor(root.right, p, q);
  if (L && R) return root;           // p and q split here -> this is the LCA
  return L || R;                     // both on one side (or neither)
}

function hasPathSum(root, target) {  // root-to-leaf sum == target?
  if (!root) return false;
  if (!root.left && !root.right) return root.val === target; // leaf
  const rest = target - root.val;
  return hasPathSum(root.left, rest) || hasPathSum(root.right, rest);
}
```

### Dry Run
`inorderIter` on the Visual tree (1 → left 2(→4,5), right 3(→_,6)):

```
Goal order (L N R): 4 2 5 1 3 6
cur=1, stack=[]
  push 1, go left -> push 2, go left -> push 4, go left -> null
  stack=[1,2,4]
  pop 4 -> visit 4 ; cur = 4.right = null       out=[4]
  cur null, stack not empty:
  pop 2 -> visit 2 ; cur = 2.right = 5           out=[4,2]
  push 5, go left -> null ; stack=[1,5]
  pop 5 -> visit 5 ; cur = 5.right = null        out=[4,2,5]
  pop 1 -> visit 1 ; cur = 1.right = 3           out=[4,2,5,1]
  push 3, go left -> null ; stack=[3]
  pop 3 -> visit 3 ; cur = 3.right = 6           out=[4,2,5,1,3]
  push 6, go left -> null ; stack=[6]
  pop 6 -> visit 6 ; cur = 6.right = null        out=[4,2,5,1,3,6]
stack empty & cur null -> done -> [4,2,5,1,3,6]  ✓
```

### Common Mistakes
- **Confusing traversal positions** — where you place the `visit` line (before/between/after recursion) *is* the traversal type.
- **Level-order without freezing `size`** — reading `queue.length` inside the loop after pushing children mixes levels. Snapshot `size` first.
- **`height` base-case mismatch** — decide edges (null=-1) vs nodes (null=0) and keep it consistent in diameter (`L+R+2` for edges vs `L+R` for node-heights).
- **Diameter counting only through the root** — the longest path may not pass the root; update a global at *every* node.
- **`shift()` is O(n)** — fine for interviews, but mention a real queue (two pointers / linked list) for large inputs.
- **Not treating a leaf specially in path-sum** — an empty child is not a valid path end.

### Edge Cases
- **Empty tree** — return [], 0/-1 height, false for path sum.
- **Single node** — it is the root and a leaf simultaneously.
- **Skewed tree** — recursion depth n; consider iterative to avoid stack overflow.
- **Duplicate values** — LCA and search should compare by *node identity*, not value, when duplicates exist.
- **Negative values** — matters for max-path-sum (you may drop a negative branch: `Math.max(0, childGain)`).

### Interview Tips
- Draw the tree first and label the traversal you need — narrate "pre = node before children" etc.
- For "path", ask: root-to-leaf, or any-node-to-any-node? It changes the template.
- Mention that **inorder of a BST is sorted** — a frequent hook.
- Say the complexity crisply: *"Every node visited once → O(n); stack/queue → O(h) or O(w)."*
- If they push back on recursion depth, offer the iterative stack version — shows range.

### Practice Problems
**Beginner**
- *Binary Tree Inorder Traversal* — return inorder list. Key: L-N-R; recursion or stack. O(n).
- *Maximum Depth of Binary Tree* — height in node count. Key: `1 + max(left,right)`. O(n).
- *Same Tree* — are two trees identical? Key: parallel recursion. O(n).
- *Invert Binary Tree* — mirror it. Key: swap children, recurse. O(n).

**Medium**
- *Binary Tree Level Order Traversal* — values grouped by level. Key: BFS + level-size loop. O(n).
- *Diameter of Binary Tree* — longest path between two nodes. Key: DFS height + global max. O(n).
- *Lowest Common Ancestor of a Binary Tree* — deepest common ancestor. Key: DFS returning found. O(n).
- *Binary Tree Right Side View* — rightmost node per level. Key: BFS, take last of each level. O(n).
- *Path Sum II* — all root-to-leaf paths summing to target. Key: DFS with backtracking path. O(n·h).

**Hard**
- *Binary Tree Maximum Path Sum* — max sum of any node-to-node path. Key: DFS return max gain, drop negatives, global max. O(n).
- *Serialize and Deserialize Binary Tree* — encode/decode. Key: preorder with null markers. O(n).
- *Construct Binary Tree from Preorder and Inorder* — rebuild. Key: preorder gives root, inorder splits sides. O(n).
- *Vertical Order Traversal* — by column then row. Key: BFS/DFS with (col,row) + sorting. O(n log n).

### Frequently Asked Interview Questions
- **Q: When to use BFS vs DFS on a tree?** BFS for anything level/shortest-in-unweighted; DFS for path/subtree/depth questions.
- **Q: Which traversal reconstructs a BST as sorted?** Inorder.
- **Q: Can you traverse without recursion?** Yes — explicit stack (DFS) or queue (BFS); Morris traversal gives O(1) space inorder.
- **Q: Complete vs full vs perfect?** Full = 0 or 2 children; complete = filled left-to-right except last level; perfect = all leaves same depth, all internal nodes have 2.
- **Q: Why can a binary tree degrade to O(n) operations?** If skewed, height ≈ n, so it behaves like a linked list.

### Revision Notes
- Preorder N-L-R, Inorder L-N-R, Postorder L-R-N; the `visit` position names it.
- Level-order = BFS with a queue; freeze `size` per level.
- Recursion stack O(h); balanced O(log n), skewed O(n).
- Diameter/max-path-sum = DFS returning height/gain while updating a global.
- LCA: if both sides return non-null, current node is the answer.
- Inorder of BST is sorted (bridge to next topic).

### Cheat Sheet
```
Traversal   position of visit        result on sample
preorder    N,L,R  (visit first)     1 2 4 5 3 6
inorder     L,N,R  (visit middle)    4 2 5 1 3 6
postorder   L,R,N  (visit last)      4 5 2 6 3 1
level       BFS queue                1 2 3 4 5 6

height(x)  = 1 + max(h(L),h(R)); null=-1
diameter   = max(hL + hR + 2) over all nodes (edges)
LCA        = node where p,q split (L&&R) else L||R
BFS level  = for i in 0..size-1 (snapshot size!)
```

---

## 18. Binary Search Trees (BST)  —  ✅ **MUST-DO (core minimum)**

### Concept
A **Binary Search Tree** is a binary tree with an **ordering invariant**: for every node,
- all values in its **left** subtree are **less than** the node's value, and
- all values in its **right** subtree are **greater than** the node's value
(and typically no duplicates, or a fixed rule for them).

This ordering turns a plain binary tree into a searchable, sorted structure: at each node you can discard half the remaining tree, just like binary search on an array — hence the name.

### Intuition
The BST invariant is "smaller-left, bigger-right, everywhere". Because it holds at *every* node (not just the root), searching means: compare, then go left or right — never both. Each step drops half the candidates, giving O(log n) on a balanced tree. And an **inorder traversal reads the values in sorted order**, because inorder does "everything smaller (left) → me → everything bigger (right)".

### Visual
```
Insert 8,3,10,1,6,14,4,7,13:

              8
            /   \
          3      10
         / \       \
        1   6      14
           / \     /
          4   7  13

Search 7:  8 -> 7<8 go left -> 3 -> 7>3 go right -> 6 -> 7>6 go right -> 7  found
Inorder:   1 3 4 6 7 8 10 13 14   <- sorted!  (proof the invariant holds)

Delete 3 (two children): find inorder successor = min of right subtree = 4,
copy 4 into 3's slot, then delete original 4:
              8
            /   \
          4      10
         / \       \
        1   6      14
             \     /
              7  13
```

### Time & Space Complexity
| Operation | Balanced | Skewed (worst) | Space |
|---|---|---|---|
| Search | O(log n) | O(n) | O(h) recursion |
| Insert | O(log n) | O(n) | O(h) |
| Delete | O(log n) | O(n) | O(h) |
| Inorder (get sorted) | O(n) | O(n) | O(h) |
| Min / Max | O(log n) | O(n) | O(h) |

The whole value of a BST hinges on staying **balanced** (h ≈ log n). Self-balancing variants (AVL, Red-Black) guarantee O(log n) by rotating on insert/delete. A plain BST does not, and can degrade to a chain.

### Common Interview Patterns
- **Ordered search / lower-upper bound**: exploit the invariant to go one direction.
- **Validate BST**: DFS carrying `(min, max)` bounds, or check inorder is strictly increasing.
- **Kth smallest / largest**: inorder (or reverse-inorder) and stop at k.
- **Insert / delete**: the canonical delete-with-two-children (successor swap).
- **Range queries**: count/sum values in `[lo, hi]` by pruning subtrees out of range.
- **LCA in a BST**: use values to pick a direction — simpler than general-tree LCA.

### Template Code
```js
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

// ---------- Search ----------
function searchBST(root, target) {
  let cur = root;
  while (cur) {
    if (target === cur.val) return cur;
    cur = target < cur.val ? cur.left : cur.right; // one direction only
  }
  return null;
}

// ---------- Insert (returns new root) ----------
function insertBST(root, val) {
  if (!root) return new TreeNode(val);          // found the empty spot
  if (val < root.val) root.left  = insertBST(root.left, val);
  else if (val > root.val) root.right = insertBST(root.right, val);
  // val === root.val -> ignore duplicate (policy choice)
  return root;
}

// ---------- Delete (returns new root) ----------
function deleteBST(root, key) {
  if (!root) return null;
  if (key < root.val) root.left = deleteBST(root.left, key);
  else if (key > root.val) root.right = deleteBST(root.right, key);
  else {
    // found the node to delete
    if (!root.left)  return root.right;          // 0 or 1 child
    if (!root.right) return root.left;
    // two children: replace with inorder successor (min of right subtree)
    let succ = root.right;
    while (succ.left) succ = succ.left;
    root.val = succ.val;                         // copy successor value up
    root.right = deleteBST(root.right, succ.val);// remove successor
  }
  return root;
}

// ---------- Validate ----------
function isValidBST(root, lo = -Infinity, hi = Infinity) {
  if (!root) return true;
  if (root.val <= lo || root.val >= hi) return false; // must be strictly within bounds
  return isValidBST(root.left, lo, root.val) &&       // left: upper bound tightens
         isValidBST(root.right, root.val, hi);        // right: lower bound tightens
}

// ---------- Kth smallest via inorder ----------
function kthSmallest(root, k) {
  const stack = []; let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }
    cur = stack.pop();
    if (--k === 0) return cur.val;               // kth visited in sorted order
    cur = cur.right;
  }
  return -1;
}

// ---------- LCA in a BST (use values) ----------
function lcaBST(root, p, q) {
  let cur = root;
  while (cur) {
    if (p.val < cur.val && q.val < cur.val) cur = cur.left;
    else if (p.val > cur.val && q.val > cur.val) cur = cur.right;
    else return cur;                             // split point = LCA
  }
  return null;
}
```

### Dry Run
`isValidBST` on a tree that *looks* fine locally but is invalid globally:
```
        5
       / \
      3   7
         / \
        4   8      <- 4 is in the RIGHT subtree of 5, but 4 < 5 : INVALID

isValidBST(5, -inf, +inf): 5 in range ok
  left  isValidBST(3, -inf, 5): 3 ok -> children null -> true
  right isValidBST(7, 5, +inf): 7 ok
     left  isValidBST(4, 5, 7): 4 <= lo(5) -> FALSE   <- caught!
  right returns false -> whole thing false   ✓
```
The bounds catch it even though `4 < 7` and `7 > 5` are each locally correct. That is why comparing only parent–child is a bug.

### Common Mistakes
- **Validating only parent vs child** instead of against inherited `(lo, hi)` bounds — misses the case above.
- **Wrong duplicate handling** in validate (`<=`/`>=` vs `<`/`>`) — decide the policy and be consistent.
- **Delete with two children done wrong** — must swap with inorder successor (min of right) or predecessor (max of left), then delete that node.
- **Forgetting to reassign** `root.left = insert(...)` / `= delete(...)` — the recursion returns the (possibly new) subtree root; dropping it loses the change.
- **Assuming O(log n)** on an unbalanced BST — inserting sorted data builds a chain (O(n)).
- **Using `Infinity` bounds with actual `Infinity`/`-Infinity` values** — rare, but note if values can be extreme.

### Edge Cases
- **Empty tree** — search null, insert creates root, validate true.
- **Single node** — always a valid BST.
- **Inserting sorted input** — degrades to a skewed chain (mention balancing).
- **Deleting the root** — must return the new root to the caller.
- **Duplicates** — define the rule up front; many interview BSTs forbid them.

### Interview Tips
- Lead with the invariant and the payoff: *"Ordering at every node lets me halve the search each step → O(log n) when balanced."*
- Immediately mention **inorder = sorted** — it unlocks kth-smallest, validate, and range problems.
- Call out the **balanced-vs-skewed** caveat unprompted; it shows maturity: *"Worst case O(n) if skewed; AVL/Red-Black keep it O(log n)."*
- For delete, verbalize the three cases (leaf / one child / two children) before coding.
- For validate, explain why parent-child comparison fails and bounds succeed.

### Practice Problems
**Beginner**
- *Search in a BST* — return the subtree at target. Key: compare, go one way. O(h).
- *Insert into a BST* — add a value. Key: recurse to empty slot. O(h).
- *Minimum Absolute Difference in BST* — smallest gap. Key: inorder is sorted, compare neighbors. O(n).

**Medium**
- *Validate Binary Search Tree* — is it a BST? Key: (lo,hi) bounds or inorder strictly increasing. O(n).
- *Kth Smallest Element in a BST* — kth in sorted order. Key: inorder, stop at k. O(h+k).
- *Lowest Common Ancestor of a BST* — use values to choose direction. Key: split point. O(h).
- *Delete Node in a BST* — remove a value. Key: successor swap for two-child case. O(h).
- *Convert Sorted Array to BST* — build a balanced BST. Key: middle = root, recurse halves. O(n).
- *Range Sum of BST* — sum values in [lo,hi]. Key: prune out-of-range subtrees. O(n) worst.

**Hard**
- *Recover Binary Search Tree* — two nodes swapped; fix. Key: inorder finds the two out-of-order nodes. O(n).
- *Count of Smaller Numbers After Self* — via BST/BIT insertion counts. Key: augmented BST size counts. O(n log n).

### Frequently Asked Interview Questions
- **Q: What makes a binary tree a BST?** Left subtree < node < right subtree, recursively, at every node.
- **Q: Why is inorder of a BST sorted?** Inorder visits left (all smaller), node, right (all larger).
- **Q: Worst-case complexity and why?** O(n) when skewed (sorted insertions) — height becomes n.
- **Q: How to keep a BST balanced?** Self-balancing variants (AVL, Red-Black) rotate on insert/delete to keep h = O(log n).
- **Q: How do you delete a node with two children?** Replace it with its inorder successor (min of right subtree) or predecessor, then delete that node.
- **Q: BST vs Hash Table?** BST keeps order (range queries, sorted traversal, floor/ceil) in O(log n); hash gives O(1) average lookup but no ordering.

### Revision Notes
- Invariant: left < node < right, at *every* node.
- Search/insert/delete = O(log n) balanced, O(n) skewed.
- Inorder traversal = sorted output.
- Validate with inherited (lo, hi) bounds, not local parent-child checks.
- Delete two-child node → swap with inorder successor, then delete it.
- Always reassign the recursive return: `root.left = insert/delete(...)`.
- Sorted input → skewed tree; balancing (AVL/RB) fixes worst case.

### Cheat Sheet
```
Invariant: L < node < R (recursively, everywhere)
search/insert/delete: O(log n) balanced | O(n) skewed
inorder(BST) = sorted ascending
validate: isValid(node, lo, hi): lo < node.val < hi
delete cases: leaf -> null ; one child -> that child ;
              two -> successor(min of right) swap then delete
LCA(BST): both<node -> left ; both>node -> right ; else node
kth smallest: inorder, stop at kth
```

---

## 19. Heaps  —  🔶 **RECOMMENDED (do after core)**

### Concept
A **heap** is a **complete binary tree** that maintains the **heap property**:
- **Min-heap**: every parent ≤ its children → the **smallest** element is always at the root.
- **Max-heap**: every parent ≥ its children → the **largest** element is at the root.

It is *not* fully sorted — only the root is guaranteed to be the extreme. Because the tree is complete, it is stored compactly in an **array** with no pointers. A heap is the standard implementation of a **priority queue**: fast access to the min/max, fast insert, fast remove-extreme.

> **JS note:** JavaScript has **no built-in heap/priority queue**. In interviews you either implement one (below) or, for small inputs, sort. Know the minimal implementation cold.

### Intuition
You do not need full sorting to always grab the smallest — you only need the *root* to be the smallest and each parent to beat its kids. When you add or remove, you locally repair that property by **swapping along one root-to-leaf path** — O(log n) work, not O(n).

**Array trick (0-indexed):** for index `i`:
- parent = `(i - 1) >> 1`
- left child = `2*i + 1`, right child = `2*i + 2`

Because the tree is complete, these formulas always hit valid, gap-free positions.

### Visual
```
Min-heap as tree:              Same heap as array:
            1                   index: 0  1  2  3  4  5
          /   \                 value: 1  3  2  7  4  5
         3     2
        / \   /              parent(i)=(i-1)>>1 ; left=2i+1 ; right=2i+2
       7   4 5               node 3 at idx1 -> children idx3(7), idx4(4) ✓

push(0):  put at end (idx6), sift UP:
  [1,3,2,7,4,5,0] -> 0<parent2 swap -> [1,3,0,7,4,5,2] -> 0<parent1 swap
  -> [0,3,1,7,4,5,2]   new min 0 bubbled to root

pop(): remove root(0), move last(2) to root, sift DOWN:
  [2,3,1,7,4,5] -> 2>child1 swap -> [1,3,2,7,4,5]  back to valid, returned 0
```

### Time & Space Complexity
| Operation | Time | Notes |
|---|---|---|
| peek (min/max) | O(1) | It's the root = array[0] |
| push (insert) | O(log n) | sift-up one path |
| pop (extract extreme) | O(log n) | sift-down one path |
| heapify (build from array) | **O(n)** | not O(n log n) — see below |
| search arbitrary value | O(n) | heap is not sorted |
| Top-K over n items | O(n log k) | keep a size-k heap |
| Heapsort (n pops) | O(n log n) | build O(n) + n×O(log n) |

Space: O(n) for the array; O(1) extra for sift operations.

**Why heapify is O(n), not O(n log n):** sifting down is cheap for the many nodes near the bottom (short paths) and expensive only for the few near the top. Summing `Σ nodes_at_height_h × h` converges to O(n).

### Common Interview Patterns
- **Top-K / K-th largest/smallest**: keep a heap of size k (min-heap for k-largest, max-heap for k-smallest). O(n log k).
- **Merge K sorted lists/arrays**: min-heap of the K current heads. O(N log k).
- **Running median**: two heaps (max-heap low half, min-heap high half).
- **Scheduling / greedy by priority**: task scheduler, meeting rooms, Dijkstra/Prim (priority queue).
- **"Closest / smallest / largest N"**: heap of bounded size.

### Template Code
```js
// Minimal binary MIN-heap (swap comparator for a max-heap).
class MinHeap {
  constructor() { this.a = []; }          // backing array
  size() { return this.a.length; }
  peek() { return this.a[0]; }            // O(1) min

  push(val) {                             // O(log n)
    this.a.push(val);                     // add at end
    this._siftUp(this.a.length - 1);
  }

  pop() {                                 // O(log n) remove + return min
    const a = this.a;
    if (a.length === 0) return undefined;
    const top = a[0];
    const last = a.pop();                 // remove last element
    if (a.length) { a[0] = last; this._siftDown(0); } // move it to root & repair
    return top;
  }

  _siftUp(i) {
    const a = this.a;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (a[parent] <= a[i]) break;       // heap property satisfied
      [a[parent], a[i]] = [a[i], a[parent]]; // swap up
      i = parent;
    }
  }

  _siftDown(i) {
    const a = this.a, n = a.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && a[l] < a[smallest]) smallest = l;
      if (r < n && a[r] < a[smallest]) smallest = r;
      if (smallest === i) break;          // parent already ≤ both children
      [a[i], a[smallest]] = [a[smallest], a[i]];
      i = smallest;
    }
  }
}

// Build a heap from an array in O(n): sift down from last parent to root.
function heapify(arr) {
  const h = new MinHeap();
  h.a = arr.slice();
  for (let i = (h.a.length >> 1) - 1; i >= 0; i--) h._siftDown(i);
  return h;
}

// Generic heap with a comparator (works as min OR max):
// new Heap((a,b) => a - b) is a min-heap; (a,b) => b - a is a max-heap.
class Heap {
  constructor(cmp = (a, b) => a - b) { this.a = []; this.cmp = cmp; }
  size() { return this.a.length; }
  peek() { return this.a[0]; }
  push(v) { const a=this.a; a.push(v); let i=a.length-1;
    while (i>0){ const p=(i-1)>>1; if(this.cmp(a[p],a[i])<=0)break;
      [a[p],a[i]]=[a[i],a[p]]; i=p; } }
  pop() { const a=this.a; const top=a[0], last=a.pop();
    if(a.length){ a[0]=last; let i=0,n=a.length;
      while(true){ let s=i,l=2*i+1,r=2*i+2;
        if(l<n&&this.cmp(a[l],a[s])<0)s=l;
        if(r<n&&this.cmp(a[r],a[s])<0)s=r;
        if(s===i)break; [a[i],a[s]]=[a[s],a[i]]; i=s; } }
    return top; }
}

// Top-K pattern: k largest elements using a size-k MIN-heap.
function kLargest(nums, k) {
  const h = new Heap((a, b) => a - b);    // min-heap
  for (const x of nums) {
    h.push(x);
    if (h.size() > k) h.pop();             // drop the smallest -> keeps k largest
  }
  return h.a;                              // the k largest (unordered)
}
```

### Dry Run
`kLargest([3,1,5,2,4], 2)` — keep a min-heap of size 2 (final = 2 largest):
```
x=3: push -> heap[3]                     size1
x=1: push -> heap[1,3]                   size2
x=5: push -> [1,3,5]; size>2 pop min(1) -> heap[3,5]
x=2: push -> [2,5,3]? push 2: end idx2, parent (0)=3 -> 2<3 swap -> [2,5,3]
      wait root must be min: heap now [2,5,3], size3 -> pop min(2) -> [3,5]
x=4: push 4 -> [3,5,4]; parent(idx2)=idx0=3, 4>3 no swap -> [3,5,4]
      size3 -> pop min(3) -> [4,5]
Result: [4,5]  -> the two largest ✓
```

### Common Mistakes
- **Using a min-heap for "k smallest"** — it's inverted: for **k largest** use a **min**-heap of size k (evict smallest); for **k smallest** use a **max**-heap of size k.
- **Wrong index math** — `2*i+1 / 2*i+2` children, `(i-1)>>1` parent (0-indexed). Off-by-one is the classic bug.
- **Forgetting to move the last element to the root before sift-down on pop.**
- **Assuming heap is sorted** — only the root is the extreme; iterating the array is not sorted order.
- **heapify by n pushes** — that's O(n log n); build-in-place sift-down from `(n/2 - 1)` is O(n).
- **Comparator sign confusion** in a generic heap — `(a,b)=>a-b` is min-heap.

### Edge Cases
- **Empty heap** — `peek`/`pop` should return `undefined`, not crash.
- **Single element** — push/pop with no sifting.
- **Duplicates** — fine; heaps allow equal keys.
- **k ≥ n** in top-K — result is the whole array.
- **Custom objects** — you must supply a comparator (JS default subtracts numbers only).

### Interview Tips
- Say up front: *"JS has no built-in priority queue, so I'll implement a small binary heap or, for tiny n, just sort."*
- For Top-K, always justify the size-k heap: *"O(n log k) beats sorting's O(n log n) when k ≪ n, and uses O(k) space."*
- Explain the **O(n) heapify** result if asked to build from an array — it impresses.
- State the trade-off: heap gives O(1) extreme + O(log n) updates but **no ordered iteration and O(n) arbitrary search**.
- Mention real uses: Dijkstra, Prim, task scheduling, median stream.

### Practice Problems
**Beginner**
- *Kth Largest Element in a Stream* — maintain kth largest as numbers arrive. Key: size-k min-heap. O(log k)/add.
- *Last Stone Weight* — smash two heaviest repeatedly. Key: max-heap. O(n log n).

**Medium**
- *Kth Largest Element in an Array* — Key: size-k min-heap or quickselect. O(n log k) / O(n) avg.
- *Top K Frequent Elements* — Key: count freq, size-k heap on frequency. O(n log k).
- *K Closest Points to Origin* — Key: size-k max-heap on distance. O(n log k).
- *Task Scheduler* — Key: max-heap of counts + cooldown. O(n log 26).
- *Reorganize String* — Key: max-heap by frequency, place greedily. O(n log 26).

**Hard**
- *Merge k Sorted Lists* — Key: min-heap of k current heads. O(N log k).
- *Find Median from Data Stream* — Key: two heaps (max-low, min-high) balanced. O(log n)/add.
- *Sliding Window Median* — Key: two heaps with lazy deletion. O(n log n).
- *IPO / Maximize Capital* — Key: two heaps (by capital, by profit) greedy. O(n log n).

### Frequently Asked Interview Questions
- **Q: Heap vs BST?** Heap: O(1) min/max, O(log n) insert/pop, no order among the rest, array-backed. BST: O(log n) search/insert/delete *and* ordered traversal.
- **Q: Why is build-heap O(n)?** Most nodes are near the bottom with short sift-down paths; the height-weighted sum converges to O(n).
- **Q: Min-heap or max-heap for k largest?** A **min**-heap of size k — the root is the current kth largest; evict when size exceeds k.
- **Q: Is a heap sorted?** No — only the root is the extreme; the array is partially ordered.
- **Q: How does a priority queue relate?** A heap is the usual implementation of a priority queue.
- **Q: How does heapsort work?** Build a max-heap O(n), then repeatedly pop the max to the end — O(n log n), in place.

### Revision Notes
- Complete tree in an array: parent `(i-1)>>1`, children `2i+1`, `2i+2`.
- Min-heap: root is smallest; max-heap: root is largest.
- push = sift-up, pop = move-last-to-root + sift-down; both O(log n).
- peek O(1); build/heapify O(n); arbitrary search O(n).
- k largest → size-k **min**-heap; k smallest → size-k **max**-heap.
- Two-heaps pattern → running median.
- JS has NO built-in heap — memorize the implementation.

### Cheat Sheet
```
array heap (0-idx): parent=(i-1)>>1  left=2i+1  right=2i+2
peek O(1) | push/pop O(log n) | build O(n) | search O(n)
min-heap parent<=children | max-heap parent>=children
push: append + siftUp     pop: swap root/last, pop, siftDown
k LARGEST  -> size-k MIN-heap (evict smallest)
k SMALLEST -> size-k MAX-heap (evict largest)
median -> maxHeap(low half) + minHeap(high half), keep sizes ±1
JS: no built-in PQ -> implement, or sort for small n
```

---

## 20. Tries  —  ⭐ **STRETCH (optional / higher bar)**

### Concept
A **trie** (prefix tree, pronounced "try") is a tree for storing **strings by their characters**. Each edge represents one character; each root-to-node path spells a prefix. A boolean flag marks nodes where a complete word ends. Tries make **prefix operations** fast: check if a word exists, or if *any* word starts with a given prefix, in **O(length of the string)** — independent of how many words are stored.

### Intuition
Shared prefixes are stored **once**. "cat", "car", "card" all share the path `c → a`, then branch. Instead of comparing a query against every stored word, you walk the query's characters down the tree; if you fall off (a character has no edge), it's not there. Lookup cost depends on **word length, not dictionary size** — that is the whole point, and why autocomplete uses it.

### Visual
```
Insert: "cat", "car", "card", "dog"
(*) marks end-of-word

           (root)
           /    \
          c      d
          |      |
          a      o
         / \     |
        t*  r    g*
            |
            d*        <- "card": c-a-r-d, end flag here
        (r is end of "car": r*)

So the r node is end-of-word (car), and its child d is end-of-word (card).

search("car")      -> walk c,a,r -> node exists AND isEnd -> true
search("ca")       -> walk c,a   -> node exists but isEnd=false -> false
startsWith("ca")   -> walk c,a   -> node exists -> true (prefix present)
search("care")     -> walk c,a,r -> e edge missing -> false
```

### Time & Space Complexity
| Operation | Time | Space | Notes |
|---|---|---|---|
| insert(word) | O(L) | O(L) new nodes worst case | L = word length |
| search(word) | O(L) | O(1) | walk L chars |
| startsWith(prefix) | O(L) | O(1) | walk prefix chars |
| Total build (n words, avg len L) | O(n·L) | O(total chars × Σ) | Σ = alphabet size |

- **Independent of the number of stored words** for a single query — the win over hashing when you need *prefix* queries.
- **Space trade-off:** each node may hold a map/array of up to Σ children (26 for lowercase English). Memory can be large; a hash set of words is smaller if you never need prefixes.

### Common Interview Patterns
- **Autocomplete / typeahead**: `startsWith`, then DFS to collect all words under the prefix node.
- **Word dictionary with wildcards**: `.` matches any child → DFS branching.
- **Word search on a board (Boggle)**: trie of words + DFS over the grid, pruning dead prefixes.
- **Longest common prefix** of many strings: walk while exactly one child.
- **Replace words / prefix matching**: stop at the first end-of-word along the path.
- **Bitwise trie**: maximum XOR pair (binary digits as edges).

### Template Code
```js
// Trie node: a map of char -> child, plus an end-of-word flag.
class TrieNode {
  constructor() {
    this.children = new Map(); // char -> TrieNode  (or a size-26 array)
    this.isEnd = false;        // true if a word ends exactly here
  }
}

class Trie {
  constructor() { this.root = new TrieNode(); }

  insert(word) {                          // O(L)
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch);       // descend, creating as needed
    }
    node.isEnd = true;                     // mark full word
  }

  // Walk the trie following `str`; return the ending node or null.
  _walk(str) {
    let node = this.root;
    for (const ch of str) {
      if (!node.children.has(ch)) return null; // fell off -> not present
      node = node.children.get(ch);
    }
    return node;
  }

  search(word) {                          // exact word present?
    const node = this._walk(word);
    return node !== null && node.isEnd;    // must END here, not just pass through
  }

  startsWith(prefix) {                    // any word with this prefix?
    return this._walk(prefix) !== null;    // reaching the node is enough
  }

  // Autocomplete: all words that start with `prefix`.
  autocomplete(prefix) {
    const start = this._walk(prefix);
    const out = [];
    if (!start) return out;
    const dfs = (node, path) => {
      if (node.isEnd) out.push(prefix + path);
      for (const [ch, child] of node.children) dfs(child, path + ch);
    };
    dfs(start, "");
    return out;
  }
}

// Wildcard search ('.' matches any single char) — DFS branching.
function searchWildcard(root, word) {
  const dfs = (node, i) => {
    if (!node) return false;
    if (i === word.length) return node.isEnd;
    const ch = word[i];
    if (ch === ".") {                     // try every child
      for (const child of node.children.values())
        if (dfs(child, i + 1)) return true;
      return false;
    }
    return dfs(node.children.get(ch), i + 1);
  };
  return dfs(root, 0);
}
```

### Dry Run
Insert `"cat"`, `"car"`, then query — tracing `search("car")` and `search("ca")`:
```
insert("cat"): root -c-> a -a-> t ; mark t.isEnd=true
insert("car"): root -c-> a (exists) -a-> (a has t; add r) -> r ; r.isEnd=true

Trie:  root -> c -> a -> { t(end), r(end) }

search("car"):
  node=root
  'c' -> child exists -> node=c
  'a' -> child exists -> node=a
  'r' -> child exists -> node=r
  end of word; r.isEnd == true -> return TRUE ✓

search("ca"):
  walk c,a -> node=a
  a.isEnd == false (no word ends at "ca") -> return FALSE ✓

startsWith("ca"):
  walk c,a -> node=a (not null) -> return TRUE ✓  (prefix exists)
```

### Common Mistakes
- **`search` returning true for a prefix** — you must check `isEnd`, not just that the node exists. That check is the *only* difference between `search` and `startsWith`.
- **Not creating missing child nodes** during insert (forgetting the `if (!has) set(...)`).
- **Confusing "node exists" with "word exists"** — passing through ≠ ending there.
- **Using a fixed size-26 array but inputs contain other characters** (uppercase, digits, unicode) — use a Map for general alphabets.
- **Deletion done naively** — removing a word must not delete nodes shared by other words; only unset `isEnd` and prune leaf nodes with no children and no `isEnd`.
- **Underestimating memory** — a trie can use far more space than a hash set when prefixes aren't shared.

### Edge Cases
- **Empty string** insert/search — root node with `isEnd` set; decide whether `""` is a valid word.
- **Duplicate inserts** — idempotent; `isEnd` just stays true.
- **Prefix that is also a whole word** ("car" vs "card") — both `isEnd` flags coexist on the path.
- **Query longer than any stored word** — falls off, returns false.
- **Large alphabet / unicode** — Map scales; fixed array doesn't.

### Interview Tips
- State the headline: *"Trie gives O(L) prefix queries independent of dictionary size — that's why it beats a hash set when prefixes matter."*
- Contrast with hashing unprompted: hash set does exact lookup O(L) too, but **cannot do prefix / startsWith efficiently**.
- Mention the **space trade-off** — many nodes, each with up to Σ children.
- For board/word-search problems, emphasize **pruning**: the trie lets DFS abandon a path the moment its prefix isn't in the dictionary.
- Know that autocomplete = walk to prefix node, then DFS to collect words.

### Practice Problems
**Beginner**
- *Implement Trie (Prefix Tree)* — insert/search/startsWith. Key: node map + isEnd. O(L)/op.
- *Longest Common Prefix* — of an array of strings. Key: trie or vertical scan. O(total chars).

**Medium**
- *Design Add and Search Words Data Structure* — `.` wildcard. Key: trie + DFS branching on `.`. O(L) / O(Σ^dots).
- *Replace Words* — replace words by shortest root prefix. Key: trie of roots, stop at first isEnd. O(total).
- *Map Sum Pairs* — sum values of keys with a prefix. Key: trie storing values + prefix DFS. O(L).
- *Search Suggestions System (Autocomplete)* — top-3 per prefix as you type. Key: trie + sorted DFS. O(total).

**Hard**
- *Word Search II* — find all dictionary words on a grid. Key: build trie, DFS board, prune by prefix. O(cells·paths).
- *Maximum XOR of Two Numbers in an Array* — Key: binary (bitwise) trie, greedily pick opposite bit. O(n·32).
- *Concatenated Words* — words formed by other words. Key: trie + DFS/DP. O(n·L²).
- *Palindrome Pairs* — Key: trie of reversed words + palindrome checks. O(n·L²).

### Frequently Asked Interview Questions
- **Q: Trie vs hash table for words?** Both do exact lookup in O(L); only the trie does **prefix** queries (startsWith, autocomplete) efficiently and shares memory across common prefixes.
- **Q: Complexity of insert/search?** O(L) where L is the string length — independent of how many words are stored.
- **Q: What's the difference between `search` and `startsWith`?** `search` also requires `isEnd` at the final node; `startsWith` only requires the node to exist.
- **Q: Main downside of a trie?** Memory — up to Σ child slots per node; a hash set is smaller when you don't need prefixes.
- **Q: How to store values / counts?** Add fields on the node (value, count) alongside `isEnd`.
- **Q: How to delete a word?** Unset `isEnd`; prune nodes that have no children and no `isEnd`, being careful not to remove shared prefixes.

### Revision Notes
- Trie = character tree; path spells a prefix; `isEnd` marks complete words.
- insert / search / startsWith all O(L), independent of word count.
- `search` needs `isEnd`; `startsWith` only needs the node to exist — the one-line difference.
- Autocomplete = walk to prefix node, DFS to collect words.
- Wildcard `.` = branch DFS over all children.
- Trade-off: fast prefixes, but memory-heavy (Σ children per node).
- Use a Map for general alphabets, a size-26 array for lowercase English.

### Cheat Sheet
```
node = { children: Map<char,node>, isEnd: bool }
insert:      descend, create missing children, set isEnd at end   O(L)
search:      walk chars; return node && node.isEnd                O(L)
startsWith:  walk chars; return node != null                      O(L)
autocomplete(p): walk to p-node, DFS collecting isEnd words
wildcard '.': recurse into every child
key win:  prefix queries in O(L), independent of #words
cost:     memory (up to alphabet-size children per node)
```

---

## Part 6 — Recommended Practice Order

Practice these in dependency order — each topic builds the intuition the next one needs:

1. **Trees (General) — #16.** Start here to internalize terminology (root/leaf/height/depth/degree) and the core recursive shape "base case + combine children". Everything else in this part is a specialization of this.
2. **Binary Trees — #17.** The workhorse. Master the four traversals (memorize where the `visit` line goes) and the DFS-returning-a-value pattern (height, diameter, LCA, path sum). Most tree interview questions live here.
3. **Binary Search Trees — #18.** Add the ordering invariant on top of binary trees. The key unlock is "inorder = sorted"; then search/insert/delete and validate follow naturally. Reinforces the balanced-vs-skewed complexity lesson.
4. **Heaps — #19.** A different tree discipline (complete tree in an array, partial order). Learn it after binary trees so the array index math and sift up/down feel concrete. Prioritize the **Top-K** and **two-heaps (median)** patterns and remember JS has no built-in heap.
5. **Tries — #20.** Last, because it is the most specialized (string/prefix problems). Once comfortable, it is mechanical: insert/search/startsWith in O(L), then autocomplete and word-search-on-a-grid as DFS applications.

**Suggested first-pass problem set (one per topic to build confidence):** Maximum Depth of N-ary Tree (#16) → Binary Tree Level Order Traversal (#17) → Validate BST (#18) → Kth Largest Element in an Array (#19) → Implement Trie (#20). Then loop back and do the Medium tier of each in the same order.


---


# Part 7 — Graphs

## 21. Graphs (Representation)  —  ✅ **MUST-DO (core minimum)**

### Concept
A **graph** is a set of **nodes** (also called *vertices*) connected by **edges**. It models relationships: cities linked by roads, people linked by friendships, web pages linked by hyperlinks, tasks linked by dependencies. Almost every "network"-shaped problem is a graph problem in disguise.

Key vocabulary:
- **Directed** vs **Undirected**: In a directed graph an edge `A → B` goes one way (Twitter "follows"). In an undirected graph `A — B` goes both ways (Facebook "friends").
- **Weighted** vs **Unweighted**: A weighted edge carries a number (distance, cost, time). Unweighted edges just say "connected or not".
- **Degree**: number of edges touching a node. In directed graphs we split this into **in-degree** (edges coming in) and **out-degree** (edges going out).
- **Path**: a sequence of nodes connected by edges. A **cycle** is a path that returns to where it started.
- **Connected component**: a maximal group of nodes where every node can reach every other node (in an undirected graph).

### Intuition
Think of a graph as **"things and the links between them."** A tree (Part 6) is just a special graph: connected, no cycles, `N-1` edges. Graphs drop those restrictions — they can have cycles, disconnected islands, multiple edges, and directions. Because of cycles, the #1 new habit compared to trees is: **you MUST track visited nodes**, or you loop forever.

The two ways to store a graph trade space for lookup speed:
- **Adjacency list**: for each node, keep a list of its neighbors. Compact when edges are few (sparse graphs — the common case).
- **Adjacency matrix**: a `V × V` grid where `matrix[u][v] = 1` (or the weight) if there's an edge. Instant "is u connected to v?" lookup, but always uses `V²` space even if there are few edges.

### Visual
```
Undirected, unweighted:            Adjacency list:
                                     0: [1, 2]
    0 ---- 1                         1: [0, 2]
    |    / |                         2: [0, 1, 3]
    |   /  |                         3: [2]
    2 ---- 3

Directed, weighted:                Adjacency list (neighbor, weight):
                                     0: [[1,5],[2,3]]
    0 --5--> 1                       1: [[3,2]]
    |        |                       2: [[3,7]]
    3        2                       3: []
    v        v
    2 --7--> 3

Adjacency matrix (undirected graph above), 1 = edge:
       0  1  2  3
    0 [0  1  1  0]
    1 [1  0  1  1]
    2 [1  1  0  1]
    3 [0  1  1  0]
   (symmetric across the diagonal because undirected)
```

### Time & Space Complexity
Let `V` = number of vertices, `E` = number of edges.

| Operation | Adjacency List | Adjacency Matrix |
|---|---|---|
| Space | `O(V + E)` | `O(V²)` |
| Add edge | `O(1)` | `O(1)` |
| Remove edge | `O(degree)` | `O(1)` |
| Check edge `u–v`? | `O(degree)` | `O(1)` |
| Iterate neighbors of `u` | `O(degree)` | `O(V)` |
| Full traversal (DFS/BFS) | `O(V + E)` | `O(V²)` |

Rule of thumb: **use an adjacency list by default** (most graphs are sparse, `E ≪ V²`). Reach for a matrix only when the graph is dense or you need constant-time edge lookups.

### Common Interview Patterns
- "Build the graph first" — problems give you an **edge list** (`[[0,1],[1,2],...]`) and you convert to an adjacency list before traversing.
- Grid-as-graph — a 2D matrix where each cell is a node connected to its 4 (or 8) neighbors.
- Counting connected components (islands, friend circles, provinces).
- Detecting reachability / cycles.
- Modeling prerequisites, dependencies, or state transitions.

### Template Code
```js
// ---- Build an adjacency list from an edge list ----

// Unweighted, undirected graph with n nodes labeled 0..n-1
function buildUndirected(n, edges) {
  const adj = Array.from({ length: n }, () => []); // adj[u] = list of neighbors
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u); // undirected => push both directions
  }
  return adj;
}

// Directed graph
function buildDirected(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v); // one direction only
  }
  return adj;
}

// Weighted, directed graph: store [neighbor, weight] pairs
function buildWeighted(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
  }
  return adj;
}

// When nodes are strings/arbitrary keys, use a Map instead of an array
function buildMapGraph(edges) {
  const adj = new Map();
  const add = (a, b) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push(b);
  };
  for (const [u, v] of edges) {
    add(u, v);
    add(v, u); // undirected
  }
  return adj;
}

// Degree helpers (directed graph)
function degrees(n, edges) {
  const indeg = new Array(n).fill(0);
  const outdeg = new Array(n).fill(0);
  for (const [u, v] of edges) {
    outdeg[u]++;
    indeg[v]++;
  }
  return { indeg, outdeg };
}
```

### Dry Run
Input: `n = 4`, `edges = [[0,1],[0,2],[1,2],[2,3]]`, undirected.

`buildUndirected(4, edges)` steps:
```
start:      adj = [ [], [], [], [] ]
[0,1] ->    adj[0]=[1], adj[1]=[0]        => [[1],[0],[],[]]
[0,2] ->    adj[0]=[1,2], adj[2]=[0]      => [[1,2],[0],[0],[]]
[1,2] ->    adj[1]=[0,2], adj[2]=[0,1]    => [[1,2],[0,2],[0,1],[]]
[2,3] ->    adj[2]=[0,1,3], adj[3]=[2]    => [[1,2],[0,2],[0,1,3],[2]]
```
Result: `[[1,2],[0,2],[0,1,3],[2]]`. Node 2 has degree 3 (neighbors 0,1,3); node 3 has degree 1. This whole graph is one connected component (from any node you can reach all others).

### Common Mistakes
- **Undirected but pushing only one direction** — forgetting `adj[v].push(u)`. Then traversals miss half the edges.
- Building with `new Array(n).fill([])` — this shares **one** array reference across all indices; pushing to `adj[0]` mutates every entry. Use `Array.from({length:n}, () => [])`.
- Assuming nodes are `0..n-1` when they are strings or 1-indexed. Read the problem carefully.
- Ignoring **self-loops** (`[u,u]`) or **duplicate/parallel edges** if the problem allows them.
- Using a matrix for a huge sparse graph and blowing up memory (`V²`).

### Edge Cases
- Empty graph (`n = 0` or no edges) — traversals return immediately.
- Single node, no edges — one component, degree 0.
- Disconnected graph — multiple components; a single DFS/BFS from one node won't reach all nodes.
- Self-loops and parallel edges.
- Isolated vertices (listed in `n` but appearing in no edge).

### Interview Tips
- The first sentence out of your mouth should be: *"Is it directed or undirected? Weighted? How are nodes labeled?"* — clarifying representation shows maturity.
- State explicitly: *"I'll build an adjacency list in `O(V+E)`; it's the natural choice for a sparse graph."*
- Know the `O(V+E)` traversal bound cold and be able to justify it: every vertex visited once, every edge examined once (twice for undirected).
- Mention the matrix alternative and *when* it wins (dense graphs, `O(1)` edge checks) — it signals you know the trade-off.

### Practice Problems
**Beginner**
- **Build Graph from Edges** — given `n` and an edge list, return an adjacency list. *Insight:* mechanical construction; watch directed vs undirected. Target `O(V+E)`.
- **Find the Town Judge** — the judge is trusted by everyone but trusts no one. *Insight:* in-degree `= n-1` and out-degree `= 0`. Target `O(E)`.
- **Find Center of Star Graph** — one central node connected to all others. *Insight:* the center appears in every edge; check the first two edges. Target `O(1)`.

**Medium**
- **Number of Provinces (Friend Circles)** — count connected components given an adjacency matrix. *Insight:* DFS/BFS or Union-Find over components. Target `O(V²)` for matrix input.
- **Find if Path Exists in Graph** — is there a path from `source` to `destination`? *Insight:* reachability via DFS/BFS or DSU. Target `O(V+E)`.
- **Minimum Number of Vertices to Reach All Nodes** — in a DAG, return nodes with in-degree 0. *Insight:* only zero-in-degree nodes are unreachable from elsewhere. Target `O(V+E)`.

### Frequently Asked Interview Questions
- **Q: When would you pick a matrix over a list?** A: Dense graphs (`E` near `V²`), or when you need frequent `O(1)` "is there an edge?" checks, e.g. Floyd-Warshall.
- **Q: How is a graph different from a tree?** A: A tree is a connected, acyclic graph with exactly `V-1` edges and a hierarchy; graphs may have cycles, disconnection, and no root.
- **Q: What's the space of an adjacency list?** A: `O(V + E)` — one slot per vertex plus one entry per edge (two per edge if undirected).
- **Q: How do you detect a graph is connected?** A: Run one DFS/BFS; if it visits all `V` nodes, it's connected.

### Revision Notes
- Adjacency list = default; `O(V+E)` space; matrix = `O(V²)`, `O(1)` edge check.
- Undirected ⇒ push edge **both** ways.
- Build lists with `Array.from({length:n}, () => [])`, never `.fill([])`.
- Directed degree splits into in-degree / out-degree.
- Traversal cost is `O(V+E)` (list) / `O(V²)` (matrix).
- Cycles exist ⇒ always carry a `visited` set.

### Cheat Sheet
```js
const adj = Array.from({length:n}, () => []);
for (const [u,v] of edges){ adj[u].push(v); adj[v].push(u); } // undirected
```
| | List | Matrix |
|---|---|---|
| Space | V+E | V² |
| Edge check | O(deg) | O(1) |
| Best for | sparse | dense |

---

## 22. DFS (Depth-First Search)  —  ✅ **MUST-DO (core minimum)**

### Concept
**Depth-First Search** explores a graph by going **as deep as possible along one path before backtracking**. From a node you pick a neighbor, dive into it, dive into *its* neighbor, and so on; when you hit a dead end (no unvisited neighbors) you back up and try the next branch. It's the same idea as tree DFS (Part 6) but with a **visited set** to handle cycles.

### Intuition
Think of exploring a maze while dragging a string behind you: you keep walking forward down corridors, and when you hit a wall you rewind the string to the last junction and try a different corridor. The **call stack** (recursion) or an explicit **stack** is that string. "Visited" is chalk you mark on each cell so you never re-enter a room — without it, a loop in the maze traps you forever.

### Visual
```
Graph (undirected):        DFS from 0 (neighbors in listed order):
                             visit 0
   0 - 1                     -> visit 1 (neighbor of 0)
   |   |                        -> visit 3 (neighbor of 1)
   2 - 3                           -> 3's neighbors 1(seen),2 -> visit 2
                                      -> 2's neighbors 0(seen),3(seen) -> backtrack
   Order visited: 0,1,3,2

Stack (iterative) evolution starting [0]:
  pop 0 -> push 1,2      stack:[1,2]   visited:{0}
  pop 2 -> push 3        stack:[1,3]   visited:{0,2}
  pop 3 -> (1 queued)    stack:[1,1]   visited:{0,2,3}
  pop 1                  stack:[1]     visited:{0,2,3,1}
  pop 1 (already seen, skip)
```

### Time & Space Complexity
| Aspect | Complexity | Why |
|---|---|---|
| Time | `O(V + E)` | each vertex marked once, each edge examined once (twice undirected) |
| Space (recursive) | `O(V)` | visited set + call stack up to depth `V` |
| Space (iterative) | `O(V)` | visited set + explicit stack |
| On a grid `m×n` | `O(m·n)` time, `O(m·n)` space | every cell a node with ≤4 edges |

Worst-case recursion depth is `V` (a long chain) — mention stack-overflow risk for deep graphs, which motivates the iterative version.

### Common Interview Patterns
- **Connected components / islands** — DFS from each unvisited node, count how many times you launch.
- **Cycle detection** (undirected: revisit a node that isn't your parent; directed: revisit a node currently on the recursion stack).
- **Flood fill / region coloring** on grids.
- **Path existence** and **enumerate all paths** (with backtracking).
- **Topological sort** (DFS-based, Topic 24).

### Template Code
```js
// ---- 1. Recursive DFS on an adjacency list ----
function dfs(adj, start) {
  const visited = new Set();
  const order = [];
  (function go(u) {
    visited.add(u);
    order.push(u);
    for (const v of adj[u]) {
      if (!visited.has(v)) go(v);
    }
  })(start);
  return order;
}

// ---- 2. Iterative DFS with an explicit stack ----
function dfsIterative(adj, start) {
  const visited = new Set([start]);
  const order = [];
  const stack = [start];
  while (stack.length) {
    const u = stack.pop();
    order.push(u);
    for (const v of adj[u]) {
      if (!visited.has(v)) {
        visited.add(v);      // mark on push to avoid duplicates in stack
        stack.push(v);
      }
    }
  }
  return order;
}

// ---- 3. Count connected components (undirected) ----
function countComponents(n, adj) {
  const visited = new Array(n).fill(false);
  let count = 0;
  const go = (u) => {
    visited[u] = true;
    for (const v of adj[u]) if (!visited[v]) go(v);
  };
  for (let i = 0; i < n; i++) {
    if (!visited[i]) { count++; go(i); } // each launch = one new component
  }
  return count;
}

// ---- 4. DFS on a grid (flood fill / count islands) ----
function dfsGrid(grid, r, c) {
  const rows = grid.length, cols = grid[0].length;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const go = (r, c) => {
    // bounds + validity check FIRST
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (grid[r][c] !== '1') return;   // water or already visited
    grid[r][c] = '0';                 // mark visited in-place
    for (const [dr, dc] of dirs) go(r + dr, c + dc);
  };
  go(r, c);
}

// ---- 5. Cycle detection in an UNDIRECTED graph ----
function hasCycleUndirected(n, adj) {
  const visited = new Array(n).fill(false);
  const go = (u, parent) => {
    visited[u] = true;
    for (const v of adj[u]) {
      if (!visited[v]) {
        if (go(v, u)) return true;
      } else if (v !== parent) {
        return true; // visited neighbor that isn't the node we came from => cycle
      }
    }
    return false;
  };
  for (let i = 0; i < n; i++) {
    if (!visited[i] && go(i, -1)) return true;
  }
  return false;
}
```

### Dry Run
Canonical worked example — **Number of Islands** on grid
```
1 1 0
0 1 0
0 0 1
```
Loop over cells; when we find `'1'` we call `dfsGrid` and increment an island counter.
```
(0,0)='1' -> island #1, flood fill:
    mark (0,0)=0; neighbors -> (1,0)=water, (0,1)='1'
    at (0,1): mark 0; neighbor (1,1)='1'
    at (1,1): mark 0; all neighbors water/0
  component done. Grid now:
    0 0 0
    0 0 0
    0 0 1
(scan continues) ... (2,2)='1' -> island #2, flood fill marks (2,2)=0
No more '1'. Answer = 2 islands.
```
Every cell touched once ⇒ `O(m·n)`.

### Common Mistakes
- **Forgetting the visited set** on a cyclic graph ⇒ infinite recursion / stack overflow.
- Marking visited **after** processing rather than when pushing (iterative) ⇒ same node pushed multiple times, blow-up.
- Undirected cycle check without the `parent` guard ⇒ every single edge falsely reports a cycle.
- Doing the bounds check **after** indexing `grid[r][c]` ⇒ out-of-range access.
- Mutating the input grid when the caller needs it intact (use a separate `visited` if so).

### Edge Cases
- Empty graph / empty grid ⇒ 0 components/islands.
- Single node with a self-loop ⇒ counts as a cycle (a self-loop is a cycle).
- Disconnected graph ⇒ must loop over all nodes as start points.
- Fully connected grid ⇒ one giant island; recursion depth up to `m·n` (favor iterative or BFS to avoid overflow).
- Directed vs undirected changes the cycle rule entirely (see Topic 24 for directed).

### Interview Tips
- Say up front: *"DFS is `O(V+E)`, visited prevents infinite loops on cycles."*
- Offer both forms: *"I'll write it recursively for clarity; if the graph is very deep I'd switch to an explicit stack to avoid blowing the call stack."*
- For grids, note the graph is *implicit* — no need to build an adjacency list; neighbors are the 4 directions.
- Distinguish undirected vs directed cycle detection clearly; interviewers probe this.

### Practice Problems
**Beginner**
- **Flood Fill** — recolor a connected region of same-colored pixels. *Insight:* DFS/BFS from the start pixel, guard against the source color equalling the new color. Target `O(m·n)`.
- **Number of Islands** — count groups of connected `'1'`s. *Insight:* DFS flood fill, count launches. Target `O(m·n)`.

**Medium**
- **Number of Provinces** — count connected components in a friendship matrix. *Insight:* DFS over adjacency; each unvisited launch = one province. Target `O(V²)`.
- **Clone Graph** — deep-copy a graph. *Insight:* DFS with a `Map` from old node → new node to handle cycles. Target `O(V+E)`.
- **Course Schedule** (cycle detect) — can all courses be finished? *Insight:* directed cycle detection via DFS recursion-stack coloring. Target `O(V+E)`.
- **Pacific Atlantic Water Flow** — cells that drain to both oceans. *Insight:* DFS *from* the ocean borders inward. Target `O(m·n)`.

**Hard**
- **Word Search II** — find many words in a grid. *Insight:* DFS + Trie to prune. Target `O(cells · 4^L)` pruned by trie.
- **Longest Increasing Path in a Matrix** — longest strictly increasing path. *Insight:* DFS + memoization (DAG, no visited needed). Target `O(m·n)`.

### Frequently Asked Interview Questions
- **Q: DFS vs BFS — when DFS?** A: When you need to exhaust a path (backtracking, path enumeration, topological sort, cycle detection) or memory for a wide frontier is a concern.
- **Q: Recursive or iterative?** A: Recursive is cleaner; iterative avoids stack overflow on deep graphs (depth up to `V`).
- **Q: Why does DFS need a visited set but tree DFS doesn't?** A: Graphs can have cycles and multiple paths to a node; trees can't.
- **Q: How detect a cycle with DFS?** A: Undirected — a visited neighbor that isn't the parent. Directed — a neighbor currently in the active recursion stack (gray node).

### Revision Notes
- DFS = go deep, backtrack; stack (explicit or call stack).
- Always mark visited; `O(V+E)` time, `O(V)` space.
- Mark on push (iterative) to prevent duplicate stack entries.
- Undirected cycle: visited && v !== parent.
- Grids are implicit graphs: 4 directions, bounds-check first.
- Count components = number of DFS launches over unvisited nodes.

### Cheat Sheet
```js
const seen = new Set();
const dfs = u => { seen.add(u); for (const v of adj[u]) if(!seen.has(v)) dfs(v); };
```
- Time `O(V+E)`, Space `O(V)`.
- Components: loop all nodes, `if(!seen) {count++; dfs(i);}`.
- Grid: `dirs=[[1,0],[-1,0],[0,1],[0,-1]]`, bounds check first.

---

## 23. BFS (Breadth-First Search)  —  ✅ **MUST-DO (core minimum)**

### Concept
**Breadth-First Search** explores a graph **level by level**: first all nodes 1 step from the start, then all nodes 2 steps away, and so on. It uses a **queue** (first-in-first-out). Because it fans out in rings of equal distance, BFS finds the **shortest path (fewest edges)** in an **unweighted** graph.

### Intuition
Drop a stone in a pond: ripples expand outward in concentric circles, reaching everything 1 unit away before anything 2 units away. BFS is that ripple. The moment BFS first reaches a node, it has reached it by the fewest possible edges — no later path can be shorter. That's the guarantee DFS does *not* give you.

### Visual
```
Graph:                 BFS from 0, tracking distance:
   0 - 1 - 4            Level 0: [0]                 dist 0->0
   |   |                Level 1: [1, 2]  (nbrs of 0) dist 1
   2 - 3                Level 2: [4, 3]  (nbrs of 1,2)dist 2

Queue evolution (mark visited on enqueue):
  q:[0]        pop 0 -> enqueue 1,2      q:[1,2]     visited{0,1,2}
  q:[1,2]      pop 1 -> enqueue 4        q:[2,4]     visited{0,1,2,4}
  q:[2,4]      pop 2 -> enqueue 3        q:[4,3]     visited{...,3}
  q:[4,3]      pop 4 -> (nbrs seen)      q:[3]
  q:[3]        pop 3 -> done             q:[]
  Visit order: 0,1,2,4,3
```

### Time & Space Complexity
| Aspect | Complexity | Why |
|---|---|---|
| Time | `O(V + E)` | each vertex enqueued once, each edge scanned once |
| Space | `O(V)` | visited set + queue (worst case whole level in queue) |
| Grid `m×n` | `O(m·n)` time & space | each cell enqueued once |
| Multi-source | `O(V + E)` | seed queue with all sources at once |

Note: use an **index pointer** or a real deque for the queue in JS. `array.shift()` is `O(n)`, which secretly makes naive BFS `O(V²)` — a common performance trap (see Mistakes).

### Common Interview Patterns
- **Shortest path / min steps in unweighted graph or grid** (word ladder, min moves, maze).
- **Level-order** processing (nodes grouped by distance).
- **Multi-source BFS** — start from many nodes simultaneously (rotting oranges, walls-and-gates, nearest exit).
- **Connected components** (BFS alternative to DFS, no recursion depth risk).
- **Bipartite check / graph coloring** by alternating levels.

### Template Code
```js
// ---- 1. Plain BFS from a single source ----
function bfs(adj, start) {
  const visited = new Set([start]);
  const order = [];
  const queue = [start];
  let head = 0;                 // index pointer instead of shift() => O(1) dequeue
  while (head < queue.length) {
    const u = queue[head++];
    order.push(u);
    for (const v of adj[u]) {
      if (!visited.has(v)) {
        visited.add(v);         // mark on enqueue (NOT on dequeue)
        queue.push(v);
      }
    }
  }
  return order;
}

// ---- 2. Shortest path length in an UNWEIGHTED graph ----
function shortestPath(adj, start, target) {
  if (start === target) return 0;
  const visited = new Set([start]);
  let queue = [start];
  let dist = 0;
  while (queue.length) {
    dist++;
    const next = [];
    for (const u of queue) {          // process one whole level
      for (const v of adj[u]) {
        if (v === target) return dist; // first time reached => shortest
        if (!visited.has(v)) { visited.add(v); next.push(v); }
      }
    }
    queue = next;
  }
  return -1; // unreachable
}

// ---- 3. Level-by-level template ----
function levels(adj, start) {
  const visited = new Set([start]);
  let queue = [start];
  const result = [];
  while (queue.length) {
    result.push([...queue]);          // snapshot of this level
    const next = [];
    for (const u of queue)
      for (const v of adj[u])
        if (!visited.has(v)) { visited.add(v); next.push(v); }
    queue = next;
  }
  return result;
}

// ---- 4. Multi-source BFS on a grid (e.g. rotting oranges) ----
function multiSourceGrid(grid) {
  const rows = grid.length, cols = grid[0].length;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  let queue = [];
  // seed ALL sources at distance 0
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] === 2) queue.push([r, c]);
  let minutes = 0;
  while (queue.length) {
    const next = [];
    for (const [r, c] of queue) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
          grid[nr][nc] = 2;           // mark visited by mutating
          next.push([nr, nc]);
        }
      }
    }
    if (next.length) minutes++;       // only count a level if it did work
    queue = next;
  }
  return minutes;
}
```

### Dry Run
Canonical worked example — **shortest path** with `shortestPath` on
`adj = { 0:[1,2], 1:[0,3], 2:[0,3], 3:[1,2,4], 4:[3] }`, `start=0`, `target=4`.
```
start!=target. visited={0}, queue=[0], dist=0
dist=1: process [0] -> nbrs 1,2 (neither is 4) -> visited{0,1,2}, next=[1,2]
dist=2: process [1,2]
        1's nbrs: 0(seen),3 -> add 3
        2's nbrs: 0(seen),3(seen)
        next=[3], visited{0,1,2,3}
dist=3: process [3] -> nbrs 1(seen),2(seen),4 == target -> return 3
```
Shortest path length 0→4 is **3** (e.g. 0→1→3→4). BFS returns it the instant it first touches node 4.

### Common Mistakes
- **`queue.shift()`** in a loop → `O(V²)`. Use a head index or push levels into a fresh array.
- **Marking visited on dequeue instead of enqueue** → the same node gets enqueued many times before it's popped → exponential blow-up and wrong distances.
- Forgetting the `start === target` early return (distance 0).
- Counting a level even when it added no nodes (off-by-one on the answer, e.g. rotting oranges "minutes").
- Using BFS for **weighted** shortest paths — BFS only works when every edge costs 1; weighted needs Dijkstra.

### Edge Cases
- Start not present / target unreachable ⇒ return `-1`.
- `start === target` ⇒ distance 0.
- Disconnected graph ⇒ BFS reaches only the start's component.
- Grid with no sources (multi-source) ⇒ 0 minutes; grid where some cells never reachable ⇒ report accordingly.
- Single node, empty graph ⇒ trivial.

### Interview Tips
- Lead with the key property: *"BFS gives shortest path in an **unweighted** graph because it expands in order of distance."*
- Emphasize **marking visited on enqueue** and **why** — this is the classic follow-up.
- Mention the `shift()` pitfall proactively; using a head pointer signals you care about real complexity.
- For "minimum steps / minimum time to fill" problems, pattern-match to multi-source BFS immediately.

### Practice Problems
**Beginner**
- **Binary Tree Level Order Traversal** — return nodes grouped by level. *Insight:* BFS, snapshot each level's size. Target `O(n)`.
- **Flood Fill (BFS)** — recolor a region. *Insight:* queue instead of recursion. Target `O(m·n)`.

**Medium**
- **Rotting Oranges** — minutes until all fresh oranges rot. *Insight:* multi-source BFS from all rotten cells. Target `O(m·n)`.
- **01 Matrix** — distance of each cell to nearest 0. *Insight:* multi-source BFS seeded from all 0s. Target `O(m·n)`.
- **Word Ladder** — fewest transformations begin→end changing one letter. *Insight:* words are nodes, edges = one-letter diff; BFS. Target `O(N·L²)`.
- **Shortest Path in Binary Matrix** — 8-directional shortest clear path. *Insight:* grid BFS counting cells. Target `O(m·n)`.
- **Is Graph Bipartite?** — 2-color the graph. *Insight:* BFS coloring alternate levels; conflict ⇒ not bipartite. Target `O(V+E)`.

**Hard**
- **Word Ladder II** — return all shortest transformation sequences. *Insight:* BFS to build level graph + DFS to reconstruct paths. Target `O(N·L²)` + paths.
- **Bus Routes** — fewest buses to reach target. *Insight:* BFS over routes (routes as nodes). Target `O(sum of route lengths)`.

### Frequently Asked Interview Questions
- **Q: Why does BFS find the shortest path but DFS doesn't?** A: BFS visits nodes in nondecreasing distance order, so the first time it reaches a node is via the fewest edges; DFS may reach it via a longer path first.
- **Q: BFS vs Dijkstra?** A: BFS = unweighted (all edges cost 1); Dijkstra = non-negative weights via a priority queue.
- **Q: When mark visited?** A: On enqueue, to prevent a node entering the queue multiple times.
- **Q: What is multi-source BFS?** A: Seed the queue with all sources at distance 0 at once; every node then gets its distance to the *nearest* source in one pass.

### Revision Notes
- BFS = level order via queue; shortest path in **unweighted** graphs.
- Mark visited **on enqueue**.
- Avoid `shift()`; use head index or level arrays → keep it `O(V+E)`.
- Multi-source: enqueue all sources first, then expand.
- Grid BFS: `dirs`, bounds check, mutate to mark visited.
- Weighted graph ⇒ not BFS, use Dijkstra.

### Cheat Sheet
```js
const seen = new Set([s]); let q=[s], h=0;
while(h<q.length){ const u=q[h++]; for(const v of adj[u]) if(!seen.has(v)){seen.add(v);q.push(v);} }
```
- Shortest unweighted path, level order, multi-source.
- Time `O(V+E)`, Space `O(V)`; mark on enqueue.

---

## 24. Topological Sort  —  ⭐ **STRETCH (optional / higher bar)**

### Concept
A **topological sort** is a linear ordering of the vertices of a **DAG** (Directed Acyclic Graph) such that for every directed edge `u → v`, `u` comes **before** `v` in the ordering. It answers "in what order can I do these tasks so every prerequisite comes first?" It only exists if the graph has **no cycle** — a cycle means a circular dependency with no valid start.

Two standard algorithms:
- **Kahn's algorithm (BFS / indegree):** repeatedly remove nodes with in-degree 0.
- **DFS-based:** DFS the graph, push each node onto a stack *after* exploring all its descendants, then reverse.

### Intuition
Think of **course prerequisites** or **build dependencies**. You can only take a course once you've taken everything it depends on. Kahn's method is "keep doing whatever has nothing left blocking it" — take all courses with zero remaining prerequisites, then the prerequisites they unlock, and so on. If at some point work remains but nothing has zero prerequisites, you're stuck in a cycle. The DFS method is subtler: a node is only "finished" once everything downstream of it is finished, so finish-order reversed puts prerequisites first.

### Visual
```
DAG (edge = "must come before"):
   5 -> 0        Indegrees: 0:2  1:0  2:0  3:1  4:1  5:0
   4 -> 0                    (0 depends on 4 and 5)
   5 -> 2
   2 -> 3        Kahn's: queue starts with indeg 0 => [1,4,5,2]  (any order)
   3 -> 1          take 5: reduce 0->1, 2->0  -> enqueue 2
   4 -> 1          take 4: reduce 0->0, 1->..  -> enqueue 0 ...
                 One valid topo order: 4, 5, 2, 3, 0, 1
                 (every arrow points left-to-right in the ordering)

DFS finish order (push after children), then reverse:
   finish 0,1,3,2,5,4  -> reverse -> 4,5,2,3,1,0  (also valid)
```

### Time & Space Complexity
| Algorithm | Time | Space | Notes |
|---|---|---|---|
| Kahn's (BFS) | `O(V + E)` | `O(V + E)` | indegree array + queue; also detects cycles |
| DFS-based | `O(V + E)` | `O(V + E)` | recursion stack + color/visited + output |
| Cycle detection (either) | `O(V + E)` | `O(V)` | Kahn: sorted count `< V`; DFS: back edge to gray node |

Both are linear in the graph size. Kahn's is usually preferred in interviews because cycle detection falls out naturally (if you can't output all `V` nodes, there's a cycle).

### Common Interview Patterns
- **Course Schedule I/II** — can you finish / give an order.
- **Build systems, task scheduling, dependency resolution**.
- **Alien Dictionary** — derive letter order from sorted words.
- Any "ordering with constraints `a` before `b`" phrasing.
- Detecting a cycle in a **directed** graph (Kahn count `< V`).

### Template Code
```js
// ---- Kahn's algorithm (BFS, indegree). Returns order, or [] if a cycle exists ----
function topoSortKahn(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) {   // edge u -> v means u before v
    adj[u].push(v);
    indeg[v]++;
  }
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  const order = [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    order.push(u);
    for (const v of adj[u]) {
      if (--indeg[v] === 0) queue.push(v); // v freed once all deps consumed
    }
  }
  // if we couldn't place every node, a cycle blocked the rest
  return order.length === n ? order : [];
}

// ---- DFS-based topological sort ----
function topoSortDFS(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);

  // 0 = unvisited, 1 = in-progress (gray), 2 = done (black)
  const state = new Array(n).fill(0);
  const order = [];
  let hasCycle = false;

  const dfs = (u) => {
    state[u] = 1;                    // mark gray (on current path)
    for (const v of adj[u]) {
      if (state[v] === 1) { hasCycle = true; return; } // back edge => cycle
      if (state[v] === 0) dfs(v);
    }
    state[u] = 2;                    // black: fully explored
    order.push(u);                   // push AFTER all descendants
  };

  for (let i = 0; i < n; i++) if (state[i] === 0) dfs(i);
  if (hasCycle) return [];
  return order.reverse();            // reverse finish order = topo order
}
```

### Dry Run
Canonical worked example — **Course Schedule II** with Kahn's.
`n = 4`, prerequisites `[[1,0],[2,0],[3,1],[3,2]]` meaning edge `0→1, 0→2, 1→3, 2→3` (take 0 first).
```
Build: adj = {0:[1,2], 1:[3], 2:[3], 3:[]}
indeg = [0,1,1,2]
queue seeded with indeg==0 => [0]
--
pop 0 -> order=[0]; relax 1(indeg 1->0 enqueue), 2(1->0 enqueue)  queue=[0,1,2]
pop 1 -> order=[0,1]; relax 3(2->1)                                queue=[0,1,2]
pop 2 -> order=[0,1,2]; relax 3(1->0 enqueue)                      queue=[0,1,2,3]
pop 3 -> order=[0,1,2,3]
order.length (4) === n (4) -> valid
Result: [0,1,2,3]  (0 before 1&2, both before 3)
```
If we added a back edge `3→0`, node 0's indegree would start at 1, the queue would seed empty, nothing gets placed, `order.length < n` ⇒ return `[]` (cycle detected).

### Common Mistakes
- **Getting edge direction backwards** — `[a, b]` "b depends on a" vs "a depends on b" flips the whole graph. Read the prompt precisely.
- Pushing a node in DFS **before** exploring its children (must push after → post-order).
- Forgetting to **reverse** the DFS output.
- Not handling cycles ⇒ Kahn silently returns a partial order; always check `order.length === n`.
- Using a single boolean `visited` in DFS cycle detection instead of 3 states — you can't distinguish "on current path" (cycle) from "already finished" (fine).

### Edge Cases
- Empty graph / no edges ⇒ any permutation is valid (all indegree 0).
- Single node ⇒ trivial `[0]`.
- Disconnected DAG ⇒ multiple indegree-0 starts; still one valid ordering exists.
- Cycle anywhere ⇒ no valid ordering; return empty / false.
- Self-loop `u→u` ⇒ immediate cycle.
- Multiple valid orderings — problems usually accept any correct one.

### Interview Tips
- Immediately identify the trigger: *"'X must come before Y' plus 'is it possible' ⇒ topological sort on a DAG."*
- Recommend **Kahn's** and explain the bonus: *"If the output has fewer than V nodes, there's a cycle — free cycle detection."*
- Be crisp on edge direction; restate it back to the interviewer before coding.
- Mention both algorithms exist and that both are `O(V+E)`; pick one and justify.

### Practice Problems
**Beginner**
- **Find Eventual Safe States** — nodes leading only to terminal nodes. *Insight:* reverse-graph Kahn / DFS coloring. Target `O(V+E)`.

**Medium**
- **Course Schedule** — can you finish all courses? *Insight:* directed cycle detection; Kahn count `== n`. Target `O(V+E)`.
- **Course Schedule II** — return a valid course order. *Insight:* Kahn's, output the removal order. Target `O(V+E)`.
- **Minimum Height Trees** — roots giving minimal-height trees. *Insight:* topological "peeling" of leaves (indegree/degree 1) inward. Target `O(V+E)`.

**Hard**
- **Alien Dictionary** — infer letter order from sorted words. *Insight:* build edges from adjacent word pairs, topo sort; detect invalid/cyclic. Target `O(total chars)`.
- **Parallel Courses / Sequence Reconstruction** — min semesters / unique topo order. *Insight:* level-by-level Kahn (BFS layers = semesters); unique iff queue size is always 1. Target `O(V+E)`.

### Frequently Asked Interview Questions
- **Q: When does a topological order exist?** A: Iff the directed graph is acyclic (a DAG).
- **Q: How does Kahn detect a cycle?** A: If, after processing, fewer than `V` nodes were output, remaining nodes are stuck in a cycle (their in-degree never hit 0).
- **Q: Is the order unique?** A: Only if at every step exactly one node has in-degree 0; otherwise multiple valid orders exist.
- **Q: Kahn vs DFS — differences?** A: Same `O(V+E)`; Kahn is iterative/BFS with natural cycle detection, DFS uses post-order + reverse and needs 3-color state for cycles.

### Revision Notes
- Topo sort needs a **DAG**; cycle ⇒ no order.
- Kahn: indegree array, enqueue indeg-0, decrement, `order.length===V` else cycle.
- DFS: post-order push + reverse; use 3 colors (white/gray/black) for cycles.
- Edge `u→v` = `u` before `v`; verify direction.
- Both `O(V+E)`.
- Pattern trigger: "must come before", prerequisites, build order.

### Cheat Sheet
```js
// Kahn: indeg[], queue of indeg 0, pop -> --indeg[nbr] -> if 0 enqueue
// cycle iff order.length !== n
```
| | Method | Cycle check |
|---|---|---|
| Kahn | BFS indegree | count < V |
| DFS | post-order + reverse | back edge to gray |

---

## 25. Union-Find (DSU)  —  ⭐ **STRETCH (optional / higher bar)**

### Concept
**Union-Find**, a.k.a. **Disjoint Set Union (DSU)**, is a data structure that tracks a collection of elements partitioned into **disjoint (non-overlapping) sets**. It supports two near-constant-time operations:
- **find(x)** — return the representative ("root"/leader) of the set containing `x`.
- **union(x, y)** — merge the two sets containing `x` and `y`.

Two elements are in the same set iff `find(x) === find(y)`. It's the go-to tool for **connectivity** questions when edges arrive incrementally.

### Intuition
Picture each set as a **tree**, where every element points to a parent, and the root points to itself. To ask "are `x` and `y` connected?", walk each up to its root and compare. To merge two sets, point one root at the other. Two optimizations keep the trees nearly flat:
- **Path compression** (in `find`): after finding the root, re-point every node on the path directly to the root, so future lookups are instant.
- **Union by rank/size** (in `union`): always attach the *smaller/shorter* tree under the larger, so trees stay shallow.

Together they give an amortized cost of **O(α(n))** — the inverse Ackermann function, which is ≤ 4 for any practical `n`. Effectively constant.

### Visual
```
Start: each node its own set (parent points to self)
  0  1  2  3  4       parent = [0,1,2,3,4]

union(0,1): attach root(1) under root(0)
  0     2  3  4        parent = [0,0,2,3,4]
  |
  1

union(2,3): 
  0   2   4            parent = [0,0,2,2,4]
  |   |
  1   3

union(1,3): find(1)->0, find(3)->2, attach 2 under 0
      0                parent = [0,0,0,2,4]
     / \
    1   2
        |
        3
find(3) WITH path compression -> re-points 3 straight to 0:
      0                parent = [0,0,0,0,4]
   / | \
  1  2  3
=> {0,1,2,3} one component, {4} another  => 2 components
```

### Time & Space Complexity
| Operation | Complexity | Notes |
|---|---|---|
| `find` | `O(α(n))` amortized | with path compression |
| `union` | `O(α(n))` amortized | with union by rank/size |
| Build (n elements) | `O(n)` | init parent/rank arrays |
| `m` operations total | `O(m · α(n))` ≈ `O(m)` | α(n) ≤ 4 in practice |
| Space | `O(n)` | parent + rank/size arrays |

Without both optimizations, `find` can degrade to `O(n)` (a linked-list-shaped tree). With them, treat it as effectively constant and *say so* in interviews.

### Common Interview Patterns
- **Connected components count** in an undirected graph (especially when edges stream in).
- **Cycle detection in an undirected graph** — if `union(u,v)` finds them already in the same set, adding edge `u–v` forms a cycle.
- **Kruskal's MST** — sort edges, union endpoints if they're in different sets.
- **Dynamic connectivity** — "are these two connected now?" as edges are added.
- Grid/percolation problems, account merging, redundant-connection detection.

### Template Code
```js
// ---- Full DSU template: path compression + union by rank ----
class DSU {
  constructor(n) {
    // each element starts as its own parent (its own set)
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);  // upper bound on tree height
    this.count = n;                    // number of disjoint sets
  }

  // find root of x's set, compressing the path along the way
  find(x) {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]]; // path halving
      x = this.parent[x];
    }
    return x;
  }

  // merge sets of x and y; returns false if already unioned (=> cycle)
  union(x, y) {
    const rx = this.find(x), ry = this.find(y);
    if (rx === ry) return false;        // already in same set
    // attach shorter tree under taller (union by rank)
    if (this.rank[rx] < this.rank[ry]) {
      this.parent[rx] = ry;
    } else if (this.rank[rx] > this.rank[ry]) {
      this.parent[ry] = rx;
    } else {
      this.parent[ry] = rx;
      this.rank[rx]++;                  // tie => new root gets taller
    }
    this.count--;                       // two sets became one
    return true;
  }

  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}

// ---- Recursive find variant (full path compression) ----
function findRec(parent, x) {
  if (parent[x] !== x) parent[x] = findRec(parent, parent[x]);
  return parent[x];
}

// ---- Union by SIZE variant (track set sizes instead of rank) ----
class DSUBySize {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
    this.count = n;
  }
  find(x) {
    while (this.parent[x] !== x) { this.parent[x] = this.parent[this.parent[x]]; x = this.parent[x]; }
    return x;
  }
  union(x, y) {
    let rx = this.find(x), ry = this.find(y);
    if (rx === ry) return false;
    if (this.size[rx] < this.size[ry]) [rx, ry] = [ry, rx]; // rx is bigger
    this.parent[ry] = rx;
    this.size[rx] += this.size[ry];
    this.count--;
    return true;
  }
}

// ---- Use case: count components / detect cycle from an edge list ----
function countComponents(n, edges) {
  const dsu = new DSU(n);
  for (const [u, v] of edges) dsu.union(u, v);
  return dsu.count;
}
function hasCycleUndirected(n, edges) {
  const dsu = new DSU(n);
  for (const [u, v] of edges) {
    if (!dsu.union(u, v)) return true; // endpoints already connected => cycle
  }
  return false;
}
```

### Dry Run
Canonical worked example — **cycle detection** with `hasCycleUndirected`.
`n = 4`, `edges = [[0,1],[1,2],[0,2]]`.
```
init: parent=[0,1,2,3] rank=[0,0,0,0] count=4
edge [0,1]: find0=0, find1=1, different -> union: parent[1]=0, rank[0]=1, count=3
            parent=[0,0,2,3]
edge [1,2]: find1: parent[1]=0 -> root 0; find2=2, different
            rank0(1) > rank2(0) -> parent[2]=0, count=2
            parent=[0,0,0,3]
edge [0,2]: find0=0, find2: parent[2]=0 -> root 0. SAME root!
            union returns false -> CYCLE detected -> return true
```
Correct: edges 0–1, 1–2, 0–2 form a triangle (a cycle). DSU caught it the moment the third edge tried to reconnect already-connected nodes.

### Common Mistakes
- **Skipping path compression / union by rank** — trees degenerate to `O(n)` chains; performance dies on large inputs.
- **Comparing raw elements** instead of roots: use `find(x) === find(y)`, not `x === y` or `parent[x] === parent[y]`.
- **Union without finding roots first** — `parent[x] = y` (attaching a non-root) corrupts the structure. Always union the *roots*.
- Forgetting to update `count`/`rank`/`size` on merge.
- Mixing rank and size semantics (rank ≈ height, not exact size) — pick one scheme consistently.
- Off-by-one when nodes are 1-indexed (size the arrays as `n+1`).

### Edge Cases
- Single element ⇒ its own set, `find(x) === x`.
- Union of an element with itself ⇒ no-op, returns false (already same set).
- All elements already connected ⇒ every further union returns false.
- Disconnected graph ⇒ `count` ends `> 1`.
- Duplicate edges ⇒ second one is a harmless no-op (returns false) — don't mistake it for a real cycle if the problem allows multi-edges.

### Interview Tips
- Name the amortized complexity precisely: *"With path compression and union by rank, each op is O(α(n)) — inverse Ackermann, effectively constant, ≤ 4 for any realistic n."*
- Pitch DSU when edges are **dynamic / streaming**: *"If I only add edges and ask connectivity, DSU beats re-running BFS each time."*
- Contrast with DFS/BFS for components: DSU shines for incremental connectivity and Kruskal; DFS/BFS shine when you also need paths/distances.
- Mention it's the backbone of **Kruskal's MST**.

### Practice Problems
**Beginner**
- **Number of Provinces** — count friend circles. *Insight:* union all friend pairs, return `count`. Target `O(V²·α)`.
- **Find if Path Exists in Graph** — connectivity query. *Insight:* union all edges, then `connected(src,dst)`. Target `O(E·α)`.

**Medium**
- **Number of Connected Components in an Undirected Graph** — count components. *Insight:* union edges, return `dsu.count`. Target `O(E·α)`.
- **Redundant Connection** — find the edge that creates a cycle. *Insight:* first `union` that returns false is the redundant edge. Target `O(E·α)`.
- **Accounts Merge** — merge accounts sharing an email. *Insight:* union by email ownership, group by root. Target `O(N·α)` (plus sorting).
- **Graph Valid Tree** — is it a tree? *Insight:* exactly `n-1` edges AND no cycle (no union returns false). Target `O(E·α)`.

**Hard**
- **Number of Islands II** — count islands as land is added online. *Insight:* dynamic DSU, union new cell with land neighbors, adjust count. Target `O(K·α)`.
- **Most Stones Removed with Same Row or Column** — max removable stones. *Insight:* union stones sharing row/col; answer = stones − components. Target `O(N·α)`.
- **Regions Cut By Slashes** — count regions. *Insight:* split each cell into 4 triangles, union across borders. Target `O(N²·α)`.

### Frequently Asked Interview Questions
- **Q: What's the amortized complexity and why?** A: `O(α(n))` per op with path compression + union by rank; α grows so slowly it's ≤ 4 for all practical `n`, effectively constant.
- **Q: DSU vs BFS/DFS for connectivity?** A: DSU is best for *incremental* edge additions and repeated connectivity queries; BFS/DFS recompute from scratch and also give paths/distances.
- **Q: How does DSU detect a cycle?** A: In an undirected graph, if `union(u,v)` finds both already share a root, adding `u–v` closes a cycle.
- **Q: Why union by rank/size?** A: To keep trees shallow so `find` stays cheap; always hang the smaller tree under the larger.
- **Q: Can DSU delete edges / split sets?** A: Not efficiently — standard DSU is union-only; splitting needs other structures (e.g., offline / link-cut trees).

### Revision Notes
- Two ops: `find` (root) and `union` (merge); same set iff equal roots.
- Path compression + union by rank/size ⇒ `O(α(n))` ≈ O(1).
- Always union **roots**, never raw nodes.
- `count` tracks number of components.
- Undirected cycle: `union` returns false (already connected).
- Backbone of Kruskal's MST; great for streaming connectivity.
- Init `parent[i]=i`, `rank=0` / `size=1`.

### Cheat Sheet
```js
find(x){ while(p[x]!==x){ p[x]=p[p[x]]; x=p[x]; } return x; }
union(x,y){ const a=find(x),b=find(y); if(a===b) return false;
  if(rank[a]<rank[b]) p[a]=b; else if(rank[a]>rank[b]) p[b]=a; else {p[b]=a; rank[a]++;} count--; return true; }
```
| Op | Cost |
|---|---|
| find/union | O(α(n)) ≈ O(1) |
| space | O(n) |
| cycle (undirected) | union returns false |

---

## Part 7 — Recommended Practice Order

Practice these in the following order; each builds on the previous:

1. **21. Graphs (Representation)** — Start here. You cannot traverse what you cannot build. Get comfortable converting edge lists to adjacency lists, distinguishing directed/undirected/weighted, and computing degrees. Everything below assumes this fluency.
2. **22. DFS** — The most fundamental traversal. Master the recursive skeleton, the visited set, grids as implicit graphs, connected components, and undirected cycle detection. Many later patterns are "DFS plus a twist."
3. **23. BFS** — Learn it right after DFS so you can directly contrast them. The key new idea is **shortest path in unweighted graphs** and the queue/level mechanics. Nail "mark visited on enqueue" and multi-source BFS.
4. **24. Topological Sort** — Now combine both: Kahn's algorithm is BFS on in-degrees, and the DFS-based method reuses your DFS skeleton with post-order + cycle coloring. This also cements **directed** cycle detection, a natural step up from undirected.
5. **25. Union-Find (DSU)** — Save for last. It's a specialized structure for connectivity and cycle detection that complements (and sometimes replaces) DFS/BFS. Once solid, you unlock Kruskal's MST and a whole class of "merge sets" problems.

Rationale: representation → traversal (DFS then BFS) → ordering (topo sort, which reuses traversals) → specialized connectivity (DSU). By the end you can pick the right tool: DFS/BFS for exploration and paths, topo sort for dependency ordering, and DSU for incremental connectivity.


---


# Part 8 — Algorithmic Paradigms & Math

## 26. Greedy Algorithms  —  ⭐ **STRETCH (optional / higher bar)**

### Concept
A **greedy algorithm** builds a solution one step at a time, always taking the choice that looks best *right now* (the locally optimal choice), and never revisiting that choice. It never looks ahead and never backtracks. If those local choices happen to add up to the globally optimal answer, the greedy approach wins — and it's usually simpler and faster than dynamic programming.

The catch: greedy is only *correct* when the problem has the right structure. For many problems the locally best move leads you into a dead end. So the real skill isn't writing greedy code — it's **proving (or convincing yourself) that greedy works for this specific problem**.

### Intuition
Think of making change with the smallest number of coins using US denominations `[1, 5, 10, 25]`. To pay 63 cents you grab the biggest coin that fits (25), then again (25), then 10, then 3×1 = 6 coins. You never regret taking a quarter first. That "grab the biggest fitting coin, no regrets" instinct *is* greedy.

Greedy works when two properties hold:
- **Greedy-choice property** — a globally optimal solution can be reached by making a locally optimal choice at each step. You never need to reconsider a past choice.
- **Optimal substructure** — after making the greedy choice, what's left is a smaller version of the same problem, and solving that optimally gives the overall optimum.

The mental model: greedy = "commit and move on." DP = "try everything and remember." If committing early can never hurt you, use greedy.

### Visual
Interval scheduling — pick the maximum number of non-overlapping meetings. The greedy rule is *"always pick the meeting that finishes earliest."* Finishing early leaves the most room for everything after it.

```
Meetings (sorted by END time):
      A  |----|
      B     |------|
      C        |----|
      D           |--------|
      E                |----|

Time  0  1  2  3  4  5  6  7  8  9

Pick A (ends at 2) -> discard B,C (overlap A? B overlaps A)
Actually walk it:
  take A  (end=2)
  B starts at 1 < 2  -> skip (overlaps)
  C starts at 3 >= 2 -> take C (end=5)
  D starts at 4 < 5  -> skip
  E starts at 6 >= 5 -> take E (end=8)
Chosen: A, C, E  => 3 meetings (optimal)
```

Choosing the earliest-finishing meeting each time frees up the timeline maximally — that's the greedy-choice property made visible.

### Time & Space Complexity
| Operation | Complexity | Why |
|---|---|---|
| Sort the input (by a key) | O(n log n) | Almost every greedy starts by sorting |
| Single linear scan making choices | O(n) | One pass, commit each step |
| Overall typical greedy | **O(n log n)** | Sort dominates |
| Space | O(1) or O(n) | O(1) if in-place after sort; O(n) if building an output list |

Best/avg/worst are usually the same for greedy because there's no branching or backtracking — the work is deterministic.

### Common Interview Patterns
- **Sort, then scan** — sort by finish time / cost / ratio, then make one pass.
- **"Pick earliest end" / "pick latest start"** — interval scheduling, minimum number of arrows/rooms.
- **Reach / coverage tracking** — keep a running "farthest I can reach" (jump game, gas station).
- **Priority queue greedy** — repeatedly extract the current best (Huffman coding, Dijkstra, merge k, task scheduling with cooldown).
- **Exchange/ratio greedy** — fractional knapsack (value/weight ratio), assign cookies.

### Template Code
```js
// GREEDY SKELETON: sort by the "greedy key", then scan and commit.
// Example: Activity / Interval Scheduling — max non-overlapping intervals.
function maxNonOverlapping(intervals) {
  if (intervals.length === 0) return 0;

  // 1) Sort by END time (the greedy key that makes local choice safe)
  intervals.sort((a, b) => a[1] - b[1]);

  let count = 0;
  let lastEnd = -Infinity; // end time of the last interval we committed to

  // 2) Single scan: commit greedily when it doesn't conflict
  for (const [start, end] of intervals) {
    if (start >= lastEnd) {   // no overlap with the last chosen interval
      count++;                // commit — never revisited
      lastEnd = end;
    }
  }
  return count;
}

// Example: Jump Game — can we reach the last index? Track farthest reach.
function canJump(nums) {
  let farthest = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > farthest) return false;          // a gap we can't cross
    farthest = Math.max(farthest, i + nums[i]);
    if (farthest >= nums.length - 1) return true;
  }
  return true;
}
```

### Dry Run
`canJump([2, 3, 1, 1, 4])` (fully worked canonical example):

```
farthest = 0
i=0: i(0) <= farthest(0) ok. farthest = max(0, 0+2)=2. 2 >= 4? no
i=1: i(1) <= 2 ok.          farthest = max(2, 1+3)=4. 4 >= 4? YES -> return true
```
We reach the end. Now a failing case `canJump([3, 2, 1, 0, 4])`:
```
i=0: farthest = max(0,3)=3
i=1: farthest = max(3,3)=3
i=2: farthest = max(3,3)=3
i=3: farthest = max(3,3)=3
i=4: i(4) > farthest(3) -> return false  (index 3 holds value 0, a trap)
```

### Common Mistakes
- **Assuming greedy is correct without justification.** Coin change with arbitrary coins (e.g. `[1, 3, 4]`, amount 6) breaks greedy: greedy gives `4+1+1=3` coins, optimal is `3+3=2` coins.
- **Sorting by the wrong key** — interval scheduling must sort by *end* time, not start time. Sorting by start gives wrong answers.
- **Mutating the input** with `.sort()` when the caller still needs the original order — copy first if needed.
- **Off-by-one in overlap check** — decide whether touching endpoints (`start == lastEnd`) count as overlapping and stay consistent (`>=` vs `>`).
- **Forgetting the empty-input case** before sorting/accessing index 0.

### Edge Cases
- Empty input → return 0 / true / identity as appropriate.
- Single element → trivially schedulable / reachable.
- All identical items or fully overlapping intervals → only one can be chosen.
- Negative numbers or zero values (e.g. a `0` in jump game creating a trap).
- Ties in the greedy key — make sure the tie-break doesn't change correctness.

### Interview Tips
- Say out loud: *"I'll try greedy — the greedy choice here is X. Let me argue it's safe with an exchange argument."*
- **Exchange argument** is the standard proof: assume an optimal solution that *differs* from the greedy one; show you can swap in the greedy choice without making the solution worse; conclude greedy is at least as good. Mention this even informally — interviewers love it.
- Always contrast with DP: *"If the greedy choice could hurt later, I'd fall back to DP and explore all options."*
- Derive complexity out loud: "Sort is O(n log n), the scan is O(n), so O(n log n) total."

### Practice Problems
**Beginner**
- **Assign Cookies** — give cookies to children to maximize satisfied kids. *Sort both, two-pointer greedy. O(n log n).*
- **Best Time to Buy and Sell Stock II** — max profit with unlimited transactions. *Sum every positive day-to-day delta. O(n).*
- **Lemonade Change** — can you give correct change to every customer? *Greedily give back largest bills first. O(n).*

**Medium**
- **Jump Game** — can you reach the last index? *Track farthest reach. O(n).*
- **Jump Game II** — minimum jumps to reach the end. *Greedy BFS-by-levels on reach window. O(n).*
- **Non-overlapping Intervals** — min removals so none overlap. *Sort by end, count kept. O(n log n).*
- **Gas Station** — find start index to complete the circuit. *Running tank + total check. O(n).*
- **Task Scheduler** — min intervals with cooldown. *Greedy fill by most-frequent task. O(n).*

**Hard**
- **Candy** — min candies so higher-rated neighbor gets more. *Two passes L→R and R→L. O(n).*
- **Minimum Number of Refueling Stops** — max-heap of fuel seen so far. *PQ greedy. O(n log n).*
- **IPO** — maximize capital with k projects. *Two heaps greedy. O(n log n).*

### Frequently Asked Interview Questions
- **Q: When does greedy work?** A: When the problem has the greedy-choice property and optimal substructure — the locally optimal choice is always part of some global optimum.
- **Q: Greedy vs DP?** A: Greedy commits to one choice per step and never reconsiders (fast, O(n log n)-ish); DP explores all choices and remembers subresults (slower, but always correct when substructure exists). Use greedy only when you can prove the local choice is safe.
- **Q: How do you prove greedy is correct?** A: Exchange argument — show any optimal solution can be transformed into the greedy one without getting worse.
- **Q: Give an example where greedy fails.** A: Coin change with coins `[1,3,4]` for amount 6 — greedy picks `4,1,1` (3 coins), optimal is `3,3` (2 coins).

### Revision Notes
- Greedy = local optimum → global optimum, no backtracking.
- Two requirements: greedy-choice property + optimal substructure.
- Almost always: **sort by the right key, then one linear scan.**
- Prove with an **exchange argument**.
- Interval scheduling: sort by **end** time.
- Coin change is greedy-safe *only* for canonical coin systems; otherwise use DP.
- Typical cost: O(n log n) from the sort.

### Cheat Sheet
```
GREEDY = sort by key -> scan -> commit locally best, never undo.
Works iff: greedy-choice property + optimal substructure.
Prove: exchange argument.
Interval scheduling  -> sort by END,   pick if start >= lastEnd
Min arrows / min rooms -> sort by END/START, sweep
Jump game            -> track farthest reach
Coin change          -> greedy only for canonical coins, else DP
Cost: O(n log n) (sort dominates), space O(1)
```

---

## 27. Dynamic Programming  —  🔶 **RECOMMENDED (do after core)**

### Concept
**Dynamic programming (DP)** solves a problem by breaking it into smaller subproblems, solving each subproblem *once*, and storing (caching) the answer so it's never recomputed. It applies when the same subproblems appear over and over inside a naive recursion.

DP is the answer to: *"My recursion is correct but exponential — how do I make it fast?"* You keep the recursion's logic but stop redoing work.

Two ingredients must be present:
- **Overlapping subproblems** — the recursion revisits the same inputs many times (otherwise there's nothing to cache; that's plain divide-and-conquer).
- **Optimal substructure** — the optimal answer to the big problem is built from optimal answers to smaller subproblems.

### Intuition
Compute Fibonacci naively:

```
                       fib(5)
                 /                \
             fib(4)              fib(3)
            /     \              /    \
        fib(3)   fib(2)      fib(2)  fib(1)
        /   \
    fib(2) fib(1)   ...        fib(3) computed TWICE, fib(2) THREE times
```

`fib(3)` and `fib(2)` get recomputed multiple times — that's overlapping subproblems, and it explodes to O(2^n). If we *remember* each `fib(k)` the first time we compute it, every value is computed once → O(n). That remembering is DP.

The core mindset shift: **a DP is just a recursion + a cache.** If you can write the recurrence, you already have the DP — you only need to add memory (memoization) or flip it into a filled table (tabulation).

### Visual
Tabulation for House Robber (`nums = [2, 7, 9, 3, 1]`) — `dp[i]` = max money robbing houses `0..i`, no two adjacent:

```
house i:     0    1    2    3    4
nums:        2    7    9    3    1

dp[i] = max( dp[i-1],            // skip house i
             dp[i-2] + nums[i] ) // rob house i, add best up to i-2

dp[0] = 2
dp[1] = max(2, 0+7)      = 7
dp[2] = max(7, 2+9)      = 11
dp[3] = max(11, 7+3)     = 11
dp[4] = max(11, 11+1)    = 12   <- answer

table:  [ 2 | 7 | 11 | 11 | 12 ]
                              ^ last cell = final answer
```

### Time & Space Complexity
| Aspect | Rule of thumb |
|---|---|
| **Time** | (number of distinct states) × (work per state / transition) |
| **Space (memo/table)** | number of distinct states |
| **Space (optimized)** | often reducible to the last 1–2 rows/values |
| 1D DP (climbing stairs, house robber) | Time O(n), Space O(n) → O(1) optimized |
| 2D DP (grid paths, LCS, 0/1 knapsack) | Time O(m·n), Space O(m·n) → O(n) optimized |

Deriving complexity out loud: *"There are `n` states, each does O(1) work, so O(n) time."* For knapsack: *"`n` items × `W` capacities = O(nW) states, O(1) each → O(nW)."* (Note: O(nW) is *pseudo-polynomial* — it depends on the numeric value W, not just input size.)

### Common Interview Patterns
- **Linear / 1D DP** — decision per index depends on a few previous indices (climbing stairs, house robber, max subarray, decode ways).
- **Grid / 2D DP** — `dp[i][j]` from neighbors (unique paths, min path sum, edit distance).
- **Two-sequence DP** — `dp[i][j]` over prefixes of two strings/arrays (LCS, edit distance, regex match).
- **Knapsack family** — choose/skip items under a capacity (0/1 knapsack, subset sum, coin change, partition).
- **Interval DP** — `dp[i][j]` over a range (matrix chain, burst balloons, palindrome partitioning).
- **DP on subsets (bitmask)** — small n (≤ ~20), state is a bitmask (traveling salesman).

### Template Code
```js
// A repeatable 5-step METHOD to derive any DP:
//   1) STATE:      what does dp[...] mean? (define it in one English sentence)
//   2) TRANSITION: how does a state build from smaller states? (the recurrence)
//   3) BASE CASE:  the smallest states you can fill directly.
//   4) ORDER:      fill so dependencies are ready (top-down handles this for free).
//   5) ANSWER:     which state holds the final result?

// -- MEMOIZATION (top-down): recursion + cache. Closest to the natural recurrence.
function climbStairsMemo(n) {
  const memo = new Map();
  function ways(i) {                 // STATE: ways(i) = number of ways to reach step i
    if (i <= 1) return 1;            // BASE: 1 way to be at step 0 or 1
    if (memo.has(i)) return memo.get(i);
    const res = ways(i - 1) + ways(i - 2); // TRANSITION: step from i-1 or i-2
    memo.set(i, res);
    return res;
  }
  return ways(n);                    // ANSWER: ways(n)
}

// -- TABULATION (bottom-up): fill an array in dependency order. No recursion.
function climbStairsTab(n) {
  if (n <= 1) return 1;
  const dp = new Array(n + 1);
  dp[0] = 1; dp[1] = 1;              // BASE
  for (let i = 2; i <= n; i++) {     // ORDER: small -> large
    dp[i] = dp[i - 1] + dp[i - 2];   // TRANSITION
  }
  return dp[n];                      // ANSWER
}

// -- SPACE-OPTIMIZED: we only ever read the last two values.
function climbStairsOpt(n) {
  if (n <= 1) return 1;
  let prev2 = 1, prev1 = 1;
  for (let i = 2; i <= n; i++) {
    const cur = prev1 + prev2;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}

// -- 2D DP: Longest Common Subsequence (two-sequence pattern).
function lcs(a, b) {
  const m = a.length, n = b.length;
  // dp[i][j] = LCS length of a[0..i-1] and b[0..j-1]
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;   // match: extend diagonal
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);        // skip one char
    }
  }
  return dp[m][n];
}

// -- 0/1 KNAPSACK: choose items to maximize value under capacity W.
function knapsack(weights, values, W) {
  const n = weights.length;
  // dp[c] = best value achievable with capacity c (1D, space-optimized)
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < n; i++) {
    // iterate capacity DOWNWARD so each item is used at most once (0/1)
    for (let c = W; c >= weights[i]; c--) {
      dp[c] = Math.max(dp[c], dp[c - weights[i]] + values[i]);
    }
  }
  return dp[W];
}
```

### Dry Run
`lcs("abcde", "ace")` (fully worked canonical example). Rows = `"abcde"`, cols = `"ace"`. Cell = LCS of prefixes.

```
        ""  a   c   e
   ""    0  0   0   0
   a     0  1   1   1     a==a -> dp[0][0]+1 = 1
   b     0  1   1   1     no match, carry max of top/left
   c     0  1   2   2     c==c -> dp[1][1]+1 = 2
   d     0  1   2   2     no match
   e     0  1   2   3     e==e -> dp[3][2]+1 = 3  <- ANSWER

LCS length = 3  (the subsequence "ace")
```
Each cell used only its top, left, or top-left neighbor — that's why we fill top-to-bottom, left-to-right, and why we can space-optimize to two rows.

### Common Mistakes
- **Wrong iteration direction in 1D knapsack.** For 0/1 knapsack the capacity loop must go **downward**; going upward silently turns it into unbounded knapsack (item reused).
- **Off-by-one in table sizing** — `dp` for strings usually needs size `n+1` (extra row/col for the empty prefix).
- **Forgetting base cases** or seeding the wrong initial value (`0` vs `Infinity` vs `1`) — coin-change-min uses `Infinity`, counting-ways uses `0` with `dp[0]=1`.
- **Fill order violating dependencies** in tabulation — you read a cell before it was computed.
- **Not resetting memo** between independent calls (a module-level memo leaking across test cases).
- **Confusing "count the ways" vs "find the optimum"** — they use `+` vs `max/min` in the transition and different base seeds.

### Edge Cases
- Empty input → base case must return the identity (0 length, 1 way, etc.).
- Single element.
- Target/capacity of 0 → usually 1 way (choose nothing) or value 0.
- Unreachable target (coin change) → return -1 / `Infinity` sentinel handled at the end.
- Negative numbers (max subarray with all negatives → answer is the largest single element, not 0).
- Large n causing deep recursion → prefer tabulation to avoid call-stack overflow.

### Interview Tips
- **Always start from the brute-force recursion**, point out the repeated subproblems in the recursion tree, *then* add memoization. This shows the interviewer your reasoning, not a memorized table.
- State the **DP definition in one sentence** before coding: "`dp[i][j]` is the ...". If you can't say it cleanly, your state is wrong.
- Mention the top-down → bottom-up → space-optimized progression; implement whichever the interviewer wants, but name the trade-off (recursion depth vs clarity).
- Derive complexity as **states × transition cost**.
- If asked to reconstruct the actual solution (not just its value), keep the full table and **backtrack** from the answer cell.

### Practice Problems
**Beginner**
- **Climbing Stairs** — count ways to climb n steps (1 or 2 at a time). *Fibonacci recurrence. O(n)/O(1).*
- **House Robber** — max loot, no two adjacent houses. *dp[i]=max(dp[i-1], dp[i-2]+nums[i]). O(n)/O(1).*
- **Min Cost Climbing Stairs** — cheapest way to top. *1D DP. O(n).*
- **Maximum Subarray (Kadane)** — largest contiguous sum. *Running best-ending-here. O(n).*

**Medium**
- **Coin Change** — fewest coins to make amount. *Unbounded knapsack, dp[amt]=min. O(n·amt).*
- **Coin Change II** — number of ways to make amount. *Count-ways knapsack. O(n·amt).*
- **Unique Paths / Min Path Sum** — grid DP. *dp[i][j] from top+left. O(m·n).*
- **Longest Common Subsequence** — two-sequence DP. *O(m·n).*
- **Longest Increasing Subsequence** — *O(n²) DP or O(n log n) patience sorting.*
- **Word Break** — can string be segmented into dictionary words? *dp[i] over prefixes. O(n²).*
- **Partition Equal Subset Sum** — subset-sum knapsack. *O(n·sum).*
- **Decode Ways** — count decodings of a digit string. *1D DP with 1/2-digit lookback. O(n).*

**Hard**
- **Edit Distance** — min insert/delete/replace to convert strings. *2D DP. O(m·n).*
- **Burst Balloons** — max coins bursting balloons. *Interval DP. O(n³).*
- **Regular Expression Matching** — match with `.` and `*`. *2D DP. O(m·n).*
- **Best Time to Buy/Sell Stock with Cooldown / k Transactions** — state-machine DP. *O(n·k).*
- **Longest Valid Parentheses** — *1D DP or stack. O(n).*

### Frequently Asked Interview Questions
- **Q: When can I use DP?** A: When the problem has overlapping subproblems *and* optimal substructure.
- **Q: Memoization vs tabulation?** A: Memoization is top-down recursion with a cache — closest to the recurrence, only computes needed states, but risks stack overflow. Tabulation is bottom-up iterative filling — no recursion, easy to space-optimize, but computes all states.
- **Q: How do you find the DP state?** A: Ask "what information do I need to describe a subproblem uniquely?" That set of parameters is your state.
- **Q: DP vs greedy vs divide-and-conquer?** A: Greedy commits to one choice; DP explores all and caches overlapping ones; divide-and-conquer splits into *non-overlapping* subproblems (no caching needed).
- **Q: What does "optimal substructure" mean?** A: The optimal solution to the whole is composed of optimal solutions to its parts.
- **Q: Why is knapsack O(nW) not polynomial?** A: W is a numeric value, so cost grows with the *magnitude* of input — pseudo-polynomial.

### Revision Notes
- DP = recursion + caching. Needs overlapping subproblems + optimal substructure.
- Method: **State → Transition → Base case → Order → Answer.**
- Memoization = top-down; Tabulation = bottom-up; then space-optimize to last row(s).
- Complexity = (#states) × (work per transition).
- 0/1 knapsack: loop capacity **downward**; unbounded: loop **upward**.
- Count-ways uses `+` and `dp[0]=1`; optimize uses `min/max`.
- To recover the actual answer, keep the table and backtrack.
- Prefer tabulation for large n (avoid recursion depth limits).

### Cheat Sheet
```
DP recipe:
  1. STATE      dp[i] / dp[i][j] = "..." (one sentence)
  2. TRANSITION recurrence from smaller states
  3. BASE       smallest states
  4. ORDER      fill dependencies first
  5. ANSWER     which cell?

Fibonacci/stairs : dp[i]=dp[i-1]+dp[i-2]
House robber     : dp[i]=max(dp[i-1], dp[i-2]+v)
Grid paths       : dp[i][j]=dp[i-1][j]+dp[i][j-1]
LCS              : match -> diag+1 ; else max(top,left)
Edit distance    : match -> diag ; else 1+min(3 neighbors)
0/1 knapsack     : for c=W..w: dp[c]=max(dp[c], dp[c-w]+val)  (DOWN)
Unbounded/coins  : for c=w..W: dp[c]=... (UP)
Kadane           : cur=max(x, cur+x); best=max(best,cur)

Time = states x transition.  Space often -> last 1-2 rows.
```

---

## 28. Bit Manipulation  —  🔶 **RECOMMENDED (do after core)**

### Concept
**Bit manipulation** means operating directly on the individual binary digits (bits) of an integer using bitwise operators. Because these operations map to single CPU instructions, they're extremely fast and let you do things like check/set flags, pack many booleans into one number, and pull off clever O(1) tricks that would otherwise need loops.

### Intuition
Every non-negative integer is a sum of powers of two. `13 = 8 + 4 + 1 = 1101₂`. Think of an integer as a **row of light switches**, each switch a power of two:

```
bit index:   3  2  1  0
power:       8  4  2  1
value 13:    1  1  0  1   -> 8 + 4 + 0 + 1 = 13
```

Bitwise operators flip and combine these switches in parallel:
- `AND (&)` — 1 only where *both* are 1 → used to **test/mask** bits.
- `OR (|)` — 1 where *either* is 1 → used to **set** bits.
- `XOR (^)` — 1 where they *differ* → used to **toggle** and to cancel pairs.
- `NOT (~)` — flips every bit (and, in JS, gives `-(x+1)`).
- `<<` shift left by k = multiply by 2^k; `>>` shift right by k = integer-divide by 2^k.

The magic identity behind many tricks: `x ^ x = 0` and `x ^ 0 = x`. So XOR-ing a list cancels every value that appears an even number of times.

### Visual
```
   a = 6 = 1 1 0
   b = 3 = 0 1 1

 a & b  = 0 1 0 = 2   (1 only where both 1)
 a | b  = 1 1 1 = 7   (1 where either 1)
 a ^ b  = 1 0 1 = 5   (1 where they differ)
 ~a     = ...11111001 = -7  (all bits flipped, two's complement)

 1 << 3 = 1000 = 8    (set bit 3)
 20 >> 2 = 10100 -> 101 = 5   (divide by 4)

 Check bit k:   (x >> k) & 1
 Set bit k:     x | (1 << k)
 Clear bit k:   x & ~(1 << k)
 Toggle bit k:  x ^ (1 << k)
 Lowest set bit: x & (-x)
 Clear lowest set bit: x & (x - 1)
```

### Time & Space Complexity
| Operation | Complexity | Note |
|---|---|---|
| Any single bitwise op (`& \| ^ ~ << >>`) | O(1) | One machine instruction |
| Count set bits (Brian Kernighan `x & (x-1)`) | O(number of set bits) | Beats O(32) naive loop |
| Count set bits (naive per-bit) | O(w) = O(32) | w = word width |
| XOR-all to find single number | O(n) time, O(1) space | Replaces a hash set |
| Iterate all subsets via bitmask | O(2^n) | n up to ~20 |

### Common Interview Patterns
- **Single/missing number** — XOR everything (pairs cancel).
- **Bit as a boolean set / visited mask** — subset enumeration, DP-on-subsets, permutations-used mask.
- **Flags packed in one int** — options bitfields.
- **Power-of-two / alignment checks** — `x & (x - 1) === 0`.
- **Counting / parity** — Hamming weight, Hamming distance (`countBits(a ^ b)`).
- **Swapping / sign tricks** — XOR swap, absolute value, min/max without branches.

### Template Code
```js
// --- Single-bit operations (k is the bit index, 0 = least significant) ---
const getBit    = (x, k) => (x >> k) & 1;         // 0 or 1
const setBit    = (x, k) => x | (1 << k);         // force bit k to 1
const clearBit  = (x, k) => x & ~(1 << k);        // force bit k to 0
const toggleBit = (x, k) => x ^ (1 << k);         // flip bit k

// --- Count set bits (Brian Kernighan): each step removes the lowest 1 ---
function countSetBits(x) {
  x = x >>> 0;              // treat as unsigned 32-bit (see JS caveat below)
  let count = 0;
  while (x !== 0) {
    x &= (x - 1);          // clears the lowest set bit
    count++;
  }
  return count;
}

// --- XOR trick: find the element that appears once (others appear twice) ---
function singleNumber(nums) {
  let acc = 0;
  for (const n of nums) acc ^= n;   // pairs cancel to 0, the lone one remains
  return acc;
}

// --- Power of two: exactly one bit set, and must be positive ---
const isPowerOfTwo = (x) => x > 0 && (x & (x - 1)) === 0;

// --- Enumerate every subset of a set of size n using bitmasks ---
function subsets(arr) {
  const n = arr.length, out = [];
  for (let mask = 0; mask < (1 << n); mask++) {   // 2^n masks
    const subset = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) subset.push(arr[i]);   // bit i set -> include arr[i]
    }
    out.push(subset);
  }
  return out;
}
```

### Dry Run
`countSetBits(13)` using Brian Kernighan (fully worked canonical example). `13 = 1101₂`:

```
start x = 1101 (13), count = 0
step1: x & (x-1) = 1101 & 1100 = 1100 (12)  count=1  (removed lowest 1)
step2: x & (x-1) = 1100 & 1011 = 1000 (8)   count=2
step3: x & (x-1) = 1000 & 0111 = 0000 (0)   count=3
x == 0 -> stop. Answer = 3 set bits.
```
Notice it looped only 3 times (once per set bit), not 32 times.

### Common Mistakes
- **Forgetting JS's 32-bit signed truncation** — bitwise operators coerce operands to **signed 32-bit ints**. `1 << 31` is *negative*, and `>>` sign-extends. Use `>>> 0` to view a value as unsigned, and `>>>` for logical right shift.
- **Numbers above 2³¹−1** silently overflow the bitwise domain — bit tricks don't work on values beyond 32 bits (use `BigInt` with its own `& | ^ << >>`, no `>>>`).
- **Operator precedence** — `&`, `|`, `^` have *lower* precedence than `==`/`+`. Always parenthesize: write `(x & 1) === 0`, not `x & 1 === 0`.
- **`~x` confusion** — in two's complement `~x === -(x+1)`, not "positive complement".
- **Checking power of two without the `x > 0` guard** — `0 & -1 === 0` would wrongly report 0 as a power of two, and negatives misbehave.

### Edge Cases
- `0` → no set bits; not a power of two.
- Negative numbers → two's complement; `>>` sign-extends, `>>>` does not.
- `1 << 31` → most significant signed bit; becomes negative in JS.
- Very large integers (> 2^53 or > 2^31 for bit ops) → switch to `BigInt`.
- Empty array in XOR trick → returns `0`.

### Interview Tips
- Name the identity you're using: *"XOR is its own inverse, so duplicates cancel — that gives O(1) space."*
- Mention the JS 32-bit caveat proactively; it signals maturity and it's a real bug source.
- Explain `x & (x-1)` clears the lowest set bit and `x & -x` isolates it — these two show up constantly.
- For counting problems, contrast the O(32) per-bit loop with the O(popcount) Kernighan loop.

### Practice Problems
**Beginner**
- **Number of 1 Bits (Hamming Weight)** — count set bits. *Kernighan `x&(x-1)`. O(bits).*
- **Power of Two** — is n a power of two? *`n>0 && (n&(n-1))===0`. O(1).*
- **Single Number** — every element twice except one. *XOR all. O(n)/O(1).*
- **Missing Number** — 0..n with one missing. *XOR indices and values. O(n)/O(1).*

**Medium**
- **Counting Bits** — set-bit count for 0..n. *dp[i]=dp[i>>1]+(i&1). O(n).*
- **Single Number II** — every element thrice except one. *Bit-count mod 3, or two-mask state machine. O(n)/O(1).*
- **Single Number III** — two elements appear once. *XOR all, split by a differing bit. O(n)/O(1).*
- **Reverse Bits** — reverse 32-bit representation. *Shift and OR. O(1).*
- **Sum of Two Integers** — add without `+`. *XOR (sum) + carry loop. O(1).*
- **Subsets** — all subsets. *Bitmask enumeration. O(n·2^n).*

**Hard**
- **Maximum XOR of Two Numbers in an Array** — *bitwise trie, greedy per bit. O(n·32).*
- **Bitwise AND of Numbers Range** — *common prefix of range. O(1)/O(32).*
- **Minimum Number of K Consecutive Bit Flips** — *greedy + difference array on bits. O(n).*

### Frequently Asked Interview Questions
- **Q: Why does XOR find the single number?** A: `a ^ a = 0` and `a ^ 0 = a`, so every duplicate cancels and only the unique value survives — in O(1) space.
- **Q: What does `x & (x - 1)` do?** A: Clears the lowest set bit; repeating it counts set bits in O(popcount).
- **Q: How to check power of two?** A: `x > 0 && (x & (x-1)) === 0` — a power of two has exactly one set bit.
- **Q: JS bitwise gotcha?** A: Operators use signed 32-bit ints; results wrap past 2³¹, `>>` sign-extends, use `>>>` for logical shift and `BigInt` for larger values.
- **Q: `<<` vs `*`?** A: `x << k === x * 2^k` (within 32 bits) but faster and integer-only.

### Revision Notes
- Bit = a power-of-two switch; `&` test, `|` set, `^` toggle/cancel, `~` flip.
- `x ^ x = 0`, `x ^ 0 = x` → XOR cancels pairs.
- `x & (x-1)` clears lowest set bit; `x & -x` isolates it.
- Power of two: `x>0 && (x&(x-1))===0`.
- Set/clear/toggle/get bit k: `|1<<k`, `& ~(1<<k)`, `^1<<k`, `(x>>k)&1`.
- JS bitwise = signed 32-bit; use `>>>` for unsigned, `BigInt` for big numbers.
- Parenthesize bitwise ops (low precedence).
- Enumerate subsets with masks `0..(1<<n)-1`.

### Cheat Sheet
```
& AND (test/mask)   | OR (set)   ^ XOR (toggle/cancel)   ~ NOT (-(x+1))
<< mul by 2^k       >> signed div by 2^k     >>> logical (unsigned) shift

get   (x>>k)&1        set   x|(1<<k)
clear x&~(1<<k)       toggle x^(1<<k)
lowest set bit x&(-x)     clear lowest x&(x-1)
count bits: while(x){x&=x-1;c++}
isPow2: x>0 && (x&(x-1))==0
single number: XOR all
JS: bitwise = 32-bit signed; use >>> and BigInt as needed
```

---

## 29. Math & Number Theory  —  ⭐ **STRETCH (optional / higher bar)**

### Concept
A cluster of number-theory tools that show up in interviews: **GCD/LCM**, **prime detection and the Sieve of Eratosthenes**, **modular arithmetic**, **fast (binary) exponentiation**, and **factorials/combinatorics** — plus JavaScript's **integer-precision limits** (`Number.MAX_SAFE_INTEGER`, `BigInt`). These aren't about data structures; they're about computing numeric answers efficiently and *correctly* without overflow.

### Intuition
- **GCD (Euclid):** the greatest common divisor of `a` and `b` is unchanged if you replace the larger by its remainder mod the smaller — `gcd(a,b) = gcd(b, a mod b)`. It shrinks fast, so it's O(log(min(a,b))).
- **LCM:** `lcm(a,b) = a / gcd(a,b) * b` (divide *before* multiplying to avoid overflow).
- **Sieve:** to find all primes up to n, cross out multiples of each prime you find. Whatever's left uncrossed is prime.
- **Modular arithmetic:** "clock math." Add/multiply then take remainder; interviewers ask for answers `mod 1e9+7` precisely to keep numbers small and avoid overflow.
- **Fast exponentiation:** computing `x^n` by repeated squaring — halve the exponent each step → O(log n) instead of O(n).
- **Combinatorics:** `n! ` counts arrangements; `C(n,k) = n! / (k!(n-k)!)` counts choices.

### Visual
Euclid's algorithm on `gcd(48, 18)`:
```
gcd(48, 18): 48 mod 18 = 12  -> gcd(18, 12)
gcd(18, 12): 18 mod 12 = 6   -> gcd(12, 6)
gcd(12, 6):  12 mod 6  = 0   -> gcd(6, 0)
gcd(6, 0):   b == 0          -> answer 6
```

Sieve of Eratosthenes up to 20 (`.` = crossed out composite, `P` = prime):
```
 2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20
 P  P  .  P  .  P  .  .  .  P  .  P  .  .  .  P  .  P  .
 ^cross multiples of 2 (4,6,8..), then 3 (9,15..), then 5 (nothing new <=20 beyond crossed)
Primes: 2 3 5 7 11 13 17 19
```

Fast exponentiation `3^13`, `13 = 1101₂`:
```
result=1, base=3, n=13(1101)
 bit0=1: result=1*3=3        base=3^2=9    n=6(110)
 bit0=0:                      base=9^2=81   n=3(11)
 bit0=1: result=3*81=243      base=81^2     n=1(1)
 bit0=1: result=243*6561=... n=0 stop
= 3^13 = 1,594,323   (only 4 multiplications, not 13)
```

### Time & Space Complexity
| Algorithm | Time | Space |
|---|---|---|
| GCD (Euclid) | O(log(min(a,b))) | O(1) iterative |
| LCM | O(log(min(a,b))) | O(1) |
| Primality test (trial division to √n) | O(√n) | O(1) |
| Sieve of Eratosthenes (primes ≤ n) | O(n log log n) | O(n) |
| Fast exponentiation (`x^n`, or mod) | O(log n) | O(1) iterative |
| Factorial `n!` | O(n) | O(1) |
| `C(n,k)` via multiplicative formula | O(k) | O(1) |

### Common Interview Patterns
- **Reduce fractions / align cycles** → GCD/LCM.
- **"Count / list primes up to n"** → Sieve; single primality check → trial division to √n.
- **"Answer may be large, return it mod 1e9+7"** → modular arithmetic throughout, fast pow for modular inverse.
- **`pow(x, n)` or `x^n mod m`** → binary exponentiation.
- **Counting paths / combinations / arrangements** → factorials & `C(n,k)`, often with modular inverse.
- **Overflow-sensitive products** → `BigInt` or divide-before-multiply.

### Template Code
```js
// --- GCD (Euclid) and LCM ---
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b !== 0) [a, b] = [b, a % b];   // replace (a,b) with (b, a mod b)
  return a;                              // b == 0 -> a is the gcd
}
function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a) / gcd(a, b) * Math.abs(b); // divide FIRST to limit overflow
}

// --- Primality test: trial division up to sqrt(n) ---
function isPrime(n) {
  if (n < 2) return false;
  if (n < 4) return true;            // 2, 3
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) // only odd divisors up to sqrt(n)
    if (n % i === 0) return false;
  return true;
}

// --- Sieve of Eratosthenes: all primes <= n ---
function sieve(n) {
  const isComposite = new Array(n + 1).fill(false);
  const primes = [];
  for (let i = 2; i <= n; i++) {
    if (!isComposite[i]) {
      primes.push(i);
      for (let j = i * i; j <= n; j += i) isComposite[j] = true; // start at i*i
    }
  }
  return primes;
}

// --- Fast (binary) exponentiation, with optional modulus ---
function power(base, exp, mod = null) {
  let result = mod ? 1n : 1;
  let b = mod ? BigInt(base) % BigInt(mod) : base;
  let e = BigInt(exp);
  const m = mod ? BigInt(mod) : null;
  while (e > 0n) {
    if (e & 1n) result = mod ? (result * b) % m : result * Number(b);
    b = mod ? (b * b) % m : b * b;
    e >>= 1n;                        // halve the exponent -> O(log exp)
  }
  return mod ? result : result;      // BigInt when mod given, else Number
}

// --- Combinations C(n, k) without huge intermediate factorials ---
function nCr(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);            // symmetry: C(n,k)=C(n,n-k)
  let res = 1;
  for (let i = 0; i < k; i++) res = res * (n - i) / (i + 1); // multiplicative
  return Math.round(res);
}
```

### Dry Run
`sieve(10)` (fully worked canonical example):
```
isComposite = [F x11], primes=[]
i=2: not composite -> primes=[2]; mark 4,6,8,10 composite
i=3: not composite -> primes=[2,3]; mark 9 (start j=3*3=9) composite
i=4: composite -> skip
i=5: not composite -> primes=[2,3,5]; j=25 >10, nothing to mark
i=6: composite -> skip
i=7: not composite -> primes=[2,3,5,7]; j=49>10, nothing
i=8,9,10: composite -> skip
Result: [2, 3, 5, 7]
```
Starting the inner loop at `i*i` (not `2*i`) skips redundant marking already done by smaller primes.

### Common Mistakes
- **Integer overflow in JS.** `Number` is exact only up to `2^53 - 1` (`Number.MAX_SAFE_INTEGER = 9007199254740991`). Products like `n!` or `a*b` for modular problems silently lose precision — use `BigInt` (the `n` suffix) or reduce mod at every step.
- **Multiply-then-divide in LCM** overflowing — always `a / gcd * b`.
- **Sieve inner loop starting at `2*i`** instead of `i*i` — correct but slower; or off-by-one on the `n+1` array size.
- **Trial division looping to `n` instead of `√n`** — O(n) instead of O(√n). Use `i * i <= n`.
- **Modulo of negatives** in JS: `-7 % 3 === -1`, not `2`. Normalize with `((x % m) + m) % m`.
- **Forgetting mod on intermediate multiplications** in modular problems — apply mod after *every* `*` and `+`.
- **Mixing `BigInt` and `Number`** throws a `TypeError`; keep types consistent.

### Edge Cases
- `gcd(0, 0) = 0`; `gcd(a, 0) = a`.
- `n < 2` is not prime; 2 is the only even prime.
- Sieve for `n < 2` → empty list.
- `x^0 = 1` (including `0^0` conventionally 1 here).
- Negative exponents → not integer power (out of scope, or use modular inverse for mod problems).
- Very large factorials / combinations → `BigInt`.
- Modulo with negative operands → normalize.

### Interview Tips
- If the problem says *"return the answer modulo 1e9+7"*, that's a signal: keep everything mod m and reach for fast modular exponentiation (and modular inverse via Fermat's little theorem when you need division).
- Justify complexities out loud: "Euclid is O(log min(a,b)) because the remainder at least halves every two steps"; "the sieve is O(n log log n) — nearly linear."
- Proactively mention JS's `2^53` precision limit and offer `BigInt` — shows you know the platform.
- Prefer trial division to √n for a single number, sieve when you need *many* primes.

### Practice Problems
**Beginner**
- **GCD of Two Numbers / GCD of Strings** — Euclid. *O(log min).*
- **Count Primes** — number of primes < n. *Sieve. O(n log log n).*
- **Power of Three / Four** — is n a power of k? *Divide-down loop or math. O(log n).*
- **Add Digits (Digital Root)** — *`1 + (n-1) % 9`. O(1).*

**Medium**
- **Pow(x, n)** — implement power. *Binary exponentiation, handle negative n. O(log n).*
- **Fraction to Recurring Decimal** — *long division + seen-remainder map. O(period).*
- **Ugly Number II** — nth number whose only factors are 2,3,5. *Three-pointer DP. O(n).*
- **Perfect Squares** — fewest squares summing to n. *DP or Lagrange four-square. O(n√n).*
- **Excel Sheet Column Number/Title** — base-26 conversion. *O(log n).*

**Hard**
- **Super Pow** — `a^b mod 1337` with b as a digit array. *Modular fast pow. O(len·log).*
- **Count Primes in Range / Segmented Sieve** — *sieve variant. O((hi-lo) log log hi).*
- **Largest Palindrome Product** / **Nth Digit** — number-theory reasoning. *O(varies).*
- **Number of Digit One** — count 1s in 1..n. *Digit DP / place-value math. O(log n).*

### Frequently Asked Interview Questions
- **Q: How does Euclid's GCD work / its complexity?** A: `gcd(a,b)=gcd(b, a mod b)`; O(log(min(a,b))) since the values shrink at least by half every two steps.
- **Q: Sieve complexity?** A: O(n log log n) time, O(n) space — cross out multiples of each prime.
- **Q: Why fast exponentiation?** A: Squaring halves the exponent, so `x^n` takes O(log n) multiplications instead of O(n).
- **Q: Why mod 1e9+7?** A: A large prime keeps numbers in safe range and supports modular inverses; apply mod after every operation.
- **Q: JS integer limits?** A: Exact up to `Number.MAX_SAFE_INTEGER = 2^53 − 1`; beyond that use `BigInt`.
- **Q: LCM from GCD?** A: `lcm(a,b) = a / gcd(a,b) * b` (divide first).

### Revision Notes
- `gcd(a,b)=gcd(b,a%b)`, O(log min); `lcm=a/gcd*b`.
- Single primality: trial-divide to √n, skip evens.
- Many primes: Sieve, inner loop from `i*i`, O(n log log n).
- Fast pow: square base, halve exponent, O(log n).
- Modular: apply mod after every `*` and `+`; normalize negatives `((x%m)+m)%m`.
- `C(n,k)=C(n,n-k)`; use multiplicative form to avoid big factorials.
- JS exact ints up to `2^53−1`; use `BigInt` beyond, never mix with `Number`.

### Cheat Sheet
```
gcd(a,b): while(b) [a,b]=[b,a%b]; return a      // O(log min)
lcm(a,b): a/gcd(a,b)*b                          // divide first
isPrime : i*i<=n, step 2, skip evens            // O(sqrt n)
sieve   : mark j=i*i..n step i                  // O(n log log n)
fast pow: while(e){ if(e&1)r*=b; b*=b; e>>=1 }  // O(log e)
mod     : (a*b)%m each step; ((x%m)+m)%m for neg
nCr     : k=min(k,n-k); prod (n-i)/(i+1)
JS ints : safe <= 2^53-1 (MAX_SAFE_INTEGER); else BigInt (5n)
```

---

## Part 8 — Recommended Practice Order

Practice these paradigms in the order below — each rung builds the reasoning the next one assumes.

1. **Greedy Algorithms (26)** — start here. It's the simplest paradigm (sort + one scan) and it teaches you to *reason about why a choice is safe*, which is the exact muscle DP will stretch further. Do the interval and jump-game problems until the "sort by the right key" reflex is automatic.
2. **Dynamic Programming (27)** — the largest and highest-value topic; tackle it once greedy has taught you to spot when a local choice is *not* safe (that's precisely when you reach for DP). Follow the internal order: 1D (climbing stairs → house robber → Kadane) → 2D grid → two-sequence (LCS, edit distance) → knapsack family. Master the memoization→tabulation→space-optimization progression on each before moving on.
3. **Bit Manipulation (28)** — lighter and mostly trick-based; do it after DP so you can also handle DP-on-subsets (bitmask states). Nail the single-number XOR trick, `x & (x-1)`, power-of-two, and the JS 32-bit caveat.
4. **Math & Number Theory (29)** — finish here. It's self-contained and formula-driven, and its fast-exponentiation/modular pieces reinforce the "halve the work" idea from binary thinking in bit manipulation. Prioritize GCD/Euclid, the Sieve, fast power, and the `BigInt` / `MAX_SAFE_INTEGER` overflow awareness that quietly breaks otherwise-correct solutions.

Overall theme: **Greedy teaches commitment, DP teaches remembering, Bits teach representation, Math teaches precision.** Do a mixed review set spanning all four the week before interviews so you can recognize *which* paradigm a new problem wants — that recognition is what interviewers are really testing.


---
